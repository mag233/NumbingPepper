"""Helpers for managing chunk stores and vector stores."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple

from ragx.core.services.retrieval import (
    ChunkStore,
    VectorStoreConfig,
    VectorStoreManager,
)


class RetrievalController:
    """Encapsulates chunk/vector store access and rebuilding logic."""

    def __init__(
        self,
        *,
        manifest_reader: Callable[[str], Sequence[Dict[str, object]]] | None = None,
    ) -> None:
        self._manifest_reader = manifest_reader
        self._chunk_store_cache: Dict[str, ChunkStore] = {}
        self._vector_store_managers: Dict[str, VectorStoreManager] = {}
        self._vector_configs: Dict[str, VectorStoreConfig] = {}

    # ------------------------------------------------------------------ chunk store helpers
    def chunk_store_for(self, project_id: str) -> ChunkStore:
        if not project_id:
            raise RuntimeError("Missing project id for chunk store.")
        store = self._chunk_store_cache.get(project_id)
        if store is None:
            if not ChunkStore:
                raise RuntimeError("Chunk store helpers unavailable in this environment.")
            store = ChunkStore(project_id)  # type: ignore[misc]
            self._chunk_store_cache[project_id] = store
        return store

    def clear_chunk_cache(self, project_id: str) -> None:
        self._chunk_store_cache.pop(project_id, None)

    # ------------------------------------------------------------------ vector store helpers
    def vector_manager_for(self, project_id: str) -> VectorStoreManager:
        if not project_id:
            raise RuntimeError("Missing project id for vector store.")
        manager = self._vector_store_managers.get(project_id)
        if manager is None:
            if not VectorStoreManager:
                raise RuntimeError("Vector store helpers unavailable in this environment.")
            manager = VectorStoreManager(project_id)  # type: ignore[misc]
            self._vector_store_managers[project_id] = manager
        return manager

    def clear_vector_cache(self, project_id: str) -> None:
        self._vector_configs.pop(project_id, None)
        self._vector_store_managers.pop(project_id, None)

    def load_vector_config(self, project_id: str) -> Optional[VectorStoreConfig]:
        manager = self.vector_manager_for(project_id)
        config = manager.load_config()
        if config:
            self._vector_configs[project_id] = config
        return config

    def ensure_vector_profile(
        self,
        project_id: str,
        *,
        provider: str | None = None,
        model: str | None = None,
    ) -> Optional[VectorStoreConfig]:
        cached = self._vector_configs.get(project_id)
        if cached and (not provider or cached.provider == provider) and (not model or cached.model == model):
            return cached
        manager = self.vector_manager_for(project_id)
        stored = manager.load_config()
        if stored and (not provider or stored.provider == provider) and (not model or stored.model == model):
            self._vector_configs[project_id] = stored
            return stored
        try:
            self.rebuild_vector_store(project_id, provider=provider, model=model)
        except Exception:
            return None
        stored = manager.load_config()
        if stored:
            self._vector_configs[project_id] = stored
        return stored

    def rebuild_vector_store(
        self,
        project_id: str,
        *,
        provider: str | None = None,
        model: str | None = None,
        manifest_entries: Sequence[Dict[str, object]] | None = None,
    ) -> None:
        entries = manifest_entries or self._load_manifest_entries(project_id)
        embedding_entries = [
            entry
            for entry in entries
            if entry.get("status") == "embeddings" and entry.get("file_path")
        ]
        if provider:
            embedding_entries = [entry for entry in embedding_entries if str(entry.get("provider") or "") == provider]
        if model:
            embedding_entries = [entry for entry in embedding_entries if str(entry.get("model") or "") == model]
        if not embedding_entries:
            raise RuntimeError("No embedding files recorded in manifest.")
        store = self.chunk_store_for(project_id)
        lookup = {chunk.chunk_id: chunk for chunk in store.all()}
        manager = self.vector_manager_for(project_id)
        last_config: VectorStoreConfig | None = None
        processed = 0
        for entry in embedding_entries:
            entry_provider = str(entry.get("provider") or "openai")
            entry_model = str(entry.get("model") or "text-embedding-3-large")
            doc_id = str(entry.get("doc_id") or "")
            file_path = Path(entry.get("file_path"))
            if not file_path.exists():
                continue
            embeddings = self._load_embedding_vectors(file_path)
            if not embeddings:
                continue
            last_config = manager.upsert_embeddings(
                provider=entry_provider,
                model=entry_model,
                doc_id=doc_id,
                chunk_lookup=lookup,
                embeddings=embeddings,
                metadata={"provider": entry_provider, "model": entry_model},
            )
            processed += 1
        if last_config:
            self._vector_configs[project_id] = last_config
        if processed <= 0:
            raise RuntimeError("Selected embedding model has no vectors to load.")

    # ------------------------------------------------------------------ internal utilities
    def _load_manifest_entries(self, project_id: str) -> Sequence[Dict[str, object]]:
        if not self._manifest_reader:
            raise RuntimeError("Manifest reader unavailable; cannot rebuild vector store.")
        return self._manifest_reader(project_id)

    def _load_embedding_vectors(self, file_path: Path) -> List[Tuple[str, Sequence[float]]]:
        embeddings: List[Tuple[str, Sequence[float]]] = []
        with file_path.open("r", encoding="utf-8") as fh:
            for line in fh:
                payload = line.strip()
                if not payload:
                    continue
                data = json.loads(payload)
                chunk_id = data.get("chunk_id")
                vector = data.get("vector")
                if not chunk_id or not isinstance(vector, list):
                    continue
                embeddings.append((str(chunk_id), vector))
        return embeddings


__all__ = ["RetrievalController"]
