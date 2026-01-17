"""Shared retrieval dataclasses."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional


@dataclass
class ChunkRecord:
    chunk_id: str
    doc_id: str
    text: str
    metadata: Dict[str, object] = field(default_factory=dict)


@dataclass
class RetrievalResult:
    chunk_id: str
    doc_id: str
    text: str
    section: str
    score: float
    source: str
    metadata: Dict[str, object] = field(default_factory=dict)


@dataclass
class VectorStoreConfig:
    project_id: str
    provider: str
    model: str
    dimension: int
    collection: str
    distance: str = "cosine"
    path: Optional[Path] = None
    last_updated: Optional[str] = None
