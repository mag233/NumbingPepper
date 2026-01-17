"""Retrieval helpers: chunk loading and Chroma vector store."""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .project_store import PROJECTS_ROOT
from .retrieval_types import ChunkRecord, RetrievalResult, VectorStoreConfig
from .search import bm25_search as _bm25_search, hybrid_fuse as _hybrid_fuse, lexical_search as _lexical_search

try:  # Optional dependency
    import chromadb  # type: ignore
except Exception:  # pragma: no cover - handled at runtime
    chromadb = None  # type: ignore


class ChunkStore:
    """Lazy loader for chunk JSONL files stored under a project."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self._chunks: List[ChunkRecord] | None = None
        self._index: Dict[str, ChunkRecord] | None = None

    @property
    def base_path(self) -> Path:
        return PROJECTS_ROOT / self.project_id / "chunks"

    def all(self) -> List[ChunkRecord]:
        if self._chunks is None:
            self._chunks = self._load_chunks()
            self._index = {chunk.chunk_id: chunk for chunk in self._chunks}
        return self._chunks

    def by_id(self) -> Dict[str, ChunkRecord]:
        if self._index is None:
            self.all()
        return self._index or {}

    def _load_chunks(self) -> List[ChunkRecord]:
        path = self.base_path
        if not path.exists():
            return []
        records: List[ChunkRecord] = []
        for file in sorted(path.glob("*.jsonl")):
            doc_id = file.stem
            try:
                with file.open("r", encoding="utf-8") as fh:
                    for line in fh:
                        payload = line.strip()
                        if not payload:
                            continue
                        try:
                            data = json.loads(payload)
                        except Exception:
                            continue
                        metadata = data.get("metadata") or {}
                        if not isinstance(metadata, dict):
                            metadata = {}
                        metadata = metadata.copy()
                        metadata.setdefault("doc_id", doc_id)
                        records.append(
                            ChunkRecord(
                                chunk_id=str(data.get("chunk_id", "")),
                                doc_id=str(metadata.get("doc_id", doc_id)),
                                text=str(data.get("text", "")),
                                metadata=metadata,
                            )
                        )
            except Exception:
                continue
        return records


class VectorStoreManager:
    """Wrapper around a Chroma persistent client per project."""

    CONFIG_NAME = "vector_config.json"
    COLLECTION_PREFIX = "rag_chunks"

    def __init__(self, project_id: str):
        self.project_id = project_id
        self._client = None

    @property
    def store_path(self) -> Path:
        return PROJECTS_ROOT / self.project_id / "vector_store"

    @property
    def config_path(self) -> Path:
        return self.store_path / self.CONFIG_NAME

    def ensure_client(self):
        if chromadb is None:  # pragma: no cover - optional dependency
            raise RuntimeError("chromadb is not installed. Run `pip install chromadb` to enable vector retrieval.")
        if self._client is None:
            self.store_path.mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(path=str(self.store_path))
        return self._client

    def _collection_name(self, provider: str, model: str) -> str:
        slug = re.sub(r"[^0-9a-zA-Z_-]+", "-", f"{provider}-{model}").lower()
        return f"{self.COLLECTION_PREFIX}-{slug}"

    def load_config(self) -> Optional[VectorStoreConfig]:
        path = self.config_path
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None
        required = {"provider", "model", "dimension", "collection"}
        if not required.issubset(payload.keys()):
            return None
        return VectorStoreConfig(
            project_id=self.project_id,
            provider=str(payload["provider"]),
            model=str(payload["model"]),
            dimension=int(payload["dimension"]),
            collection=str(payload["collection"]),
            distance=str(payload.get("distance", "cosine")),
            path=self.store_path,
            last_updated=payload.get("last_updated"),
        )

    def save_config(self, config: VectorStoreConfig) -> None:
        self.store_path.mkdir(parents=True, exist_ok=True)
        payload = {
            "provider": config.provider,
            "model": config.model,
            "dimension": config.dimension,
            "collection": config.collection,
            "distance": config.distance,
            "last_updated": config.last_updated,
        }
        self.config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def upsert_embeddings(
        self,
        *,
        provider: str,
        model: str,
        doc_id: str,
        chunk_lookup: Dict[str, ChunkRecord],
        embeddings: Sequence[Tuple[str, Sequence[float]]],
        metadata: Optional[Dict[str, object]] = None,
    ) -> VectorStoreConfig:
        client = self.ensure_client()
        collection_name = self._collection_name(provider, model)
        collection = client.get_or_create_collection(
            name=collection_name,
            metadata={"provider": provider, "model": model},
        )
        # Remove previous entries for this document to avoid duplicates.
        try:
            collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass
        ids: List[str] = []
        vectors: List[Sequence[float]] = []
        docs: List[str] = []
        metadatas: List[Dict[str, object]] = []
        vector_dim = 0
        for chunk_id, vector in embeddings:
            chunk = chunk_lookup.get(chunk_id)
            if not chunk or not vector:
                continue
            ids.append(chunk_id)
            vectors.append(vector)
            docs.append(chunk.text)
            meta = _sanitize_metadata(chunk.metadata)
            meta["doc_id"] = chunk.doc_id
            meta["chunk_id"] = chunk.chunk_id
            if metadata:
                meta.update(_sanitize_metadata(metadata))
            metadatas.append(meta)
            vector_dim = len(vector)
        if not ids:
            raise RuntimeError("No embeddings available to sync with vector store.")
        collection.upsert(
            ids=ids,
            embeddings=vectors,
            documents=docs,
            metadatas=metadatas,
        )
        config = VectorStoreConfig(
            project_id=self.project_id,
            provider=provider,
            model=model,
            dimension=vector_dim,
            collection=collection_name,
            distance="cosine",
        )
        self.save_config(config)
        return config

    def delete_doc(self, *, provider: str, model: str, doc_id: str) -> None:
        """Remove vectors for a given document from the configured collection."""
        if not doc_id or not provider or not model:
            return
        if chromadb is None:  # pragma: no cover - optional dependency
            return
        client = self.ensure_client()
        collection_name = self._collection_name(provider, model)
        try:
            collection = client.get_collection(name=collection_name)
        except Exception:
            return
        try:
            collection.delete(where={"doc_id": doc_id})
        except Exception:
            return

    def query(
        self,
        *,
        provider: str,
        model: str,
        query_embedding: Sequence[float],
        top_k: int = 5,
    ) -> List[RetrievalResult]:
        client = self.ensure_client()
        collection_name = self._collection_name(provider, model)
        try:
            collection = client.get_collection(name=collection_name)
        except Exception:
            raise RuntimeError("Vector store not initialized for the selected provider/model.")
        results = collection.query(
            query_embeddings=[list(query_embedding)],
            n_results=top_k,
        )
        rows: List[RetrievalResult] = []
        ids = results.get("ids") or [[]]
        documents = results.get("documents") or [[]]
        metadatas = results.get("metadatas") or [[]]
        distances = results.get("distances") or [[]]
        for chunk_id, text, meta, dist in zip(ids[0], documents[0], metadatas[0], distances[0]):
            if not chunk_id:
                continue
            section = ""
            if isinstance(meta, dict):
                section = str(meta.get("section_type") or meta.get("section_title") or "")
            # Convert cosine distance (0 best) to similarity score.
            try:
                similarity = 1.0 - float(dist)
            except Exception:
                similarity = 0.0
            rows.append(
                RetrievalResult(
                    chunk_id=str(chunk_id),
                    doc_id=str(meta.get("doc_id")) if isinstance(meta, dict) else "",
                    text=str(text or ""),
                    section=section,
                    score=similarity,
                    source="vector",
                    metadata=meta if isinstance(meta, dict) else {},
                )
            )
        return rows


lexical_search = _lexical_search
hybrid_fuse = _hybrid_fuse
bm25_search = _bm25_search


def chunk_lookup_from_jobs(jobs: Sequence[Tuple[str, str, Dict[str, object]]]) -> Dict[str, ChunkRecord]:
    """Build ChunkRecord mapping from embedding jobs for persistence."""
    lookup: Dict[str, ChunkRecord] = {}
    for chunk_id, text, metadata in jobs:
        doc_id = str(metadata.get("doc_id") or metadata.get("source_doc") or "")
        lookup[chunk_id] = ChunkRecord(
            chunk_id=chunk_id,
            doc_id=doc_id,
            text=text,
            metadata=metadata.copy(),
        )
    return lookup


def _sanitize_metadata(meta: Dict[str, object]) -> Dict[str, object]:
    cleaned: Dict[str, object] = {}
    for key, value in meta.items():
        if not isinstance(key, str):
            key = str(key)
        if isinstance(value, (str, int, float, bool)) or value is None:
            cleaned[key] = value
        elif isinstance(value, (list, tuple, set)):
            cleaned[key] = ", ".join(str(item) for item in value)
        else:
            cleaned[key] = str(value)
    return cleaned


__all__ = [
    "ChunkRecord",
    "ChunkStore",
    "RetrievalResult",
    "VectorStoreConfig",
    "VectorStoreManager",
    "lexical_search",
    "hybrid_fuse",
    "bm25_search",
    "chunk_lookup_from_jobs",
]
