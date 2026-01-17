"""
Controller layer that coordinates RAG services with UI/CLI callers.

Modules in this package expose thin orchestration helpers (e.g., project
management) so Tk widgets and CLI commands can stay lean and mockable.
"""

from .project_controller import (
    ProjectController,
    ProjectCreateResult,
    ProjectDeleteResult,
    ProjectListResult,
    ProjectManifestResult,
    ProjectUpdateResult,
    ManifestEntriesResult,
)
from .pipeline_controller import PipelineRunner
from .pipeline_state import (
    ArtifactHandle,
    ChunkState,
    EmbeddingState,
    IngestState,
    JobState,
    JobStatus,
    PipelineState,
    PreprocessState,
    RetrievalHit,
    RetrievalState,
)
from .retrieval_controller import RetrievalController

__all__ = [
    "ProjectController",
    "ProjectCreateResult",
    "ProjectDeleteResult",
    "ProjectListResult",
    "ProjectManifestResult",
    "ProjectUpdateResult",
    "ManifestEntriesResult",
    "PipelineRunner",
    "PipelineState",
    "IngestState",
    "PreprocessState",
    "ChunkState",
    "EmbeddingState",
    "RetrievalState",
    "RetrievalHit",
    "JobState",
    "JobStatus",
    "ArtifactHandle",
    "RetrievalController",
]
