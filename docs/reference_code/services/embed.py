"""Embedding provider abstractions for RAG pipeline."""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Protocol, Sequence


@dataclass
class EmbeddingJob:
    chunk_id: str
    text: str
    metadata: Dict[str, object] = field(default_factory=dict)


@dataclass
class EmbeddingResult:
    chunk_id: str
    vector: List[float]
    provider: str
    model: str
    metadata: Dict[str, object] = field(default_factory=dict)


class EmbeddingProvider(Protocol):
    provider_name: str
    model_name: str
    batch_size: int

    def embed(self, jobs: Sequence[EmbeddingJob]) -> List[EmbeddingResult]:
        ...


def _chunk_sequence(items: Sequence[EmbeddingJob], batch_size: int) -> Iterable[Sequence[EmbeddingJob]]:
    for idx in range(0, len(items), batch_size):
        yield items[idx : idx + batch_size]


class OpenAIEmbeddingProvider:
    """Embedding provider backed by OpenAI's embeddings API."""

    provider_name = "openai"

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: str = "text-embedding-3-large",
        batch_size: int = 128,
        max_retries: int = 5,
        timeout: float = 60.0,
    ):
        try:
            import openai  # type: ignore
        except Exception as exc:  # pragma: no cover - dependency missing
            raise RuntimeError("openai package is required for OpenAIEmbeddingProvider") from exc
        self._openai = openai
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self.base_url = base_url or os.getenv("OPENAI_BASE_URL") or os.getenv("OPENAI_API_BASE")
        self.model_name = model
        self.batch_size = batch_size
        self.max_retries = max_retries
        self.timeout = timeout
        self._client = openai.OpenAI(api_key=self.api_key, base_url=self.base_url)

    def embed(self, jobs: Sequence[EmbeddingJob]) -> List[EmbeddingResult]:
        results: List[EmbeddingResult] = []
        for batch in _chunk_sequence(jobs, self.batch_size):
            payload = [job.text for job in batch]
            response = self._call_api(payload)
            for job, data in zip(batch, response.data):
                vector = list(getattr(data, "embedding", []))
                results.append(
                    EmbeddingResult(
                        chunk_id=job.chunk_id,
                        vector=vector,
                        provider=self.provider_name,
                        model=self.model_name,
                        metadata={
                            **job.metadata,
                            "token_usage": getattr(response.usage, "total_tokens", None),
                        },
                    )
                )
        return results

    def _call_api(self, inputs: List[str]):
        delay = 1.0
        for attempt in range(1, self.max_retries + 1):
            try:
                return self._client.embeddings.create(
                    model=self.model_name,
                    input=inputs,
                    timeout=self.timeout,
                )
            except Exception as exc:  # pragma: no cover - runtime path
                if attempt == self.max_retries:
                    raise
                time.sleep(delay)
                delay *= 2
        raise RuntimeError("Failed to call OpenAI embeddings API")


class LocalSentenceTransformerProvider:
    """Local embedding provider using sentence-transformers."""

    provider_name = "local"

    def __init__(
        self,
        *,
        model_name: str = "sentence-transformers/gte-base",
        batch_size: int = 64,
        device: Optional[str] = None,
        trust_remote_code: bool = False,
        local_files_only: bool = False,
        cache_folder: Optional[str] = None,
    ):
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            raise RuntimeError(
                "sentence-transformers is required for LocalSentenceTransformerProvider"
            ) from exc
        self.model_name = model_name
        self.batch_size = batch_size
        self._model = SentenceTransformer(
            model_name_or_path=model_name,
            device=device,
            trust_remote_code=trust_remote_code,
            cache_folder=cache_folder,
            local_files_only=local_files_only,
        )
        self._device = device

    def embed(self, jobs: Sequence[EmbeddingJob]) -> List[EmbeddingResult]:
        texts = [job.text for job in jobs]
        vectors = self._model.encode(texts, batch_size=self.batch_size, convert_to_numpy=True).tolist()
        results: List[EmbeddingResult] = []
        for job, vector in zip(jobs, vectors):
            results.append(
                EmbeddingResult(
                    chunk_id=job.chunk_id,
                    vector=vector,
                    provider=self.provider_name,
                    model=self.model_name,
                    metadata=job.metadata.copy(),
                )
            )
        return results


__all__ = [
    "EmbeddingJob",
    "EmbeddingResult",
    "EmbeddingProvider",
    "OpenAIEmbeddingProvider",
    "LocalSentenceTransformerProvider",
]
