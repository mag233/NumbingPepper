"""Shared state/dataclasses for RAG pipeline controllers."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto
from pathlib import Path
from typing import Dict, List, Sequence

from ragx.core.services.chunker import Chunk
from ragx.core.services.embed import EmbeddingResult
from ragx.core.services.ingestion_base import IngestArtifact
from ragx.core.services.preprocess import PreprocessResult


class JobStatus(Enum):
    """Simple lifecycle phases for background jobs."""

    IDLE = auto()
    RUNNING = auto()
    SUCCESS = auto()
    ERROR = auto()
    CANCELLED = auto()


@dataclass
class JobState:
    """Base status structure shared across pipeline stages."""

    status: JobStatus = JobStatus.IDLE
    message: str = ""
    error: str | None = None

    def as_running(self, message: str | None = None) -> "JobState":
        self.status = JobStatus.RUNNING
        if message is not None:
            self.message = message
        self.error = None
        return self

    def as_success(self, message: str | None = None) -> "JobState":
        self.status = JobStatus.SUCCESS
        if message is not None:
            self.message = message
        self.error = None
        return self

    def as_error(self, error: str) -> "JobState":
        self.status = JobStatus.ERROR
        self.error = error
        self.message = error
        return self

    def as_cancelled(self, message: str | None = None) -> "JobState":
        self.status = JobStatus.CANCELLED
        if message is not None:
            self.message = message
        return self


@dataclass
class ArtifactHandle:
    """Normalized reference to an ingest artifact on disk."""

    project_id: str
    doc_id: str
    workflow: str
    source_path: Path
    content_hash: str | None = None


@dataclass
class IngestState(JobState):
    """Tracks ingest job progress and resulting artifact."""

    handle: ArtifactHandle | None = None
    artifact: IngestArtifact | None = None


@dataclass
class PreprocessState(JobState):
    """Tracks preprocess job output/stats."""

    artifact: ArtifactHandle | None = None
    result: PreprocessResult | None = None
    stats_raw: Dict[str, int] = field(default_factory=dict)
    stats_clean: Dict[str, int] = field(default_factory=dict)
    stats_deep: Dict[str, int] = field(default_factory=dict)
    removal_log: Sequence[dict] = field(default_factory=list)


@dataclass
class ChunkState(JobState):
    """Tracks chunk creation/persistence metadata."""

    artifact: ArtifactHandle | None = None
    chunks: List[Chunk] = field(default_factory=list)
    run_id: str | None = None
    file_path: Path | None = None

    @property
    def chunk_count(self) -> int:
        return len(self.chunks)


@dataclass
class EmbeddingState(JobState):
    """Tracks embedding job inputs/outputs."""

    artifact: ArtifactHandle | None = None
    provider: str = ""
    model: str = ""
    results: List[EmbeddingResult] = field(default_factory=list)
    file_path: Path | None = None

    @property
    def vector_count(self) -> int:
        return len(self.results)


@dataclass
class RetrievalHit:
    """Single retrieval result (lexical/vector/hybrid)."""

    chunk_id: str
    doc_id: str
    text: str
    score: float
    metadata: Dict[str, object] = field(default_factory=dict)
    source: str = "vector"


@dataclass
class RetrievalState(JobState):
    """Tracks retrieval + QA summaries."""

    project_id: str | None = None
    query: str = ""
    top_k: int = 5
    strategy: str = "vector"
    hits: List[RetrievalHit] = field(default_factory=list)
    answer_markdown: str = ""


@dataclass
class PipelineState:
    """Aggregate of all pipeline stages for convenience."""

    ingest: IngestState = field(default_factory=IngestState)
    preprocess: PreprocessState = field(default_factory=PreprocessState)
    chunking: ChunkState = field(default_factory=ChunkState)
    embeddings: EmbeddingState = field(default_factory=EmbeddingState)
    retrieval: RetrievalState = field(default_factory=RetrievalState)

    def reset(self) -> None:
        self.ingest = IngestState()
        self.preprocess = PreprocessState()
        self.chunking = ChunkState()
        self.embeddings = EmbeddingState()
        self.retrieval = RetrievalState()


__all__ = [
    "ArtifactHandle",
    "ChunkState",
    "EmbeddingState",
    "IngestState",
    "JobState",
    "JobStatus",
    "PipelineState",
    "PreprocessState",
    "RetrievalHit",
    "RetrievalState",
]
