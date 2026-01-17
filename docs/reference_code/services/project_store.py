"""Project metadata helpers for the RAG agent playground."""
from __future__ import annotations

import json
import os
import re
import shutil
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


PROJECTS_ROOT = Path(os.getenv("RAG_PROJECTS_ROOT", "rag_projects"))
INDEX_FILE = PROJECTS_ROOT / "projects_index.jsonl"
STANDARD_SUBDIRS = ("ingest", "preprocess", "chunks", "embeddings", "metadata")
TRASH_ROOT = PROJECTS_ROOT / ".trash"


@dataclass
class ProjectRecord:
    project_id: str
    display_name: str
    description: str = ""
    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)
    default_embedding: Dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, object]:
        return asdict(self)


def ensure_projects_root() -> Path:
    PROJECTS_ROOT.mkdir(parents=True, exist_ok=True)
    return PROJECTS_ROOT


def _ensure_trash_root() -> Path:
    TRASH_ROOT.mkdir(parents=True, exist_ok=True)
    return TRASH_ROOT


def _project_base(project_id: str) -> Path:
    ensure_projects_root()
    return PROJECTS_ROOT / project_id


def _project_file(project_id: str) -> Path:
    return _project_base(project_id) / "project.json"


def _record_from_dict(project_id: str, payload: Dict[str, object]) -> ProjectRecord:
    return ProjectRecord(
        project_id=payload.get("project_id", project_id),
        display_name=payload.get("display_name", project_id),
        description=payload.get("description", "") or "",
        created_at=payload.get("created_at", _now_iso()),
        updated_at=payload.get("updated_at", payload.get("created_at", _now_iso())),
        default_embedding=payload.get("default_embedding", {}) or {},
    )


def list_projects() -> List[ProjectRecord]:
    ensure_projects_root()
    records: List[ProjectRecord] = []
    for entry in sorted(PROJECTS_ROOT.iterdir()):
        if not entry.is_dir():
            continue
        payload_path = entry / "project.json"
        if not payload_path.exists():
            continue
        try:
            payload = json.loads(payload_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        record = _record_from_dict(entry.name, payload)
        records.append(record)
    return records


def load_project(project_id: str) -> Optional[ProjectRecord]:
    payload_path = _project_file(project_id)
    if not payload_path.exists():
        return None
    try:
        payload = json.loads(payload_path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return _record_from_dict(project_id, payload)


def _write_project_file(record: ProjectRecord) -> None:
    base = _project_base(record.project_id)
    base.mkdir(parents=True, exist_ok=True)
    payload_path = base / "project.json"
    payload_path.write_text(json.dumps(record.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")


def _write_index(records: Iterable[ProjectRecord]) -> None:
    ensure_projects_root()
    with INDEX_FILE.open("w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record.to_dict(), ensure_ascii=False) + "\n")


def ensure_project_dirs(project_id: str) -> Dict[str, Path]:
    base = _project_base(project_id)
    base.mkdir(parents=True, exist_ok=True)
    paths = {"base": base}
    for name in STANDARD_SUBDIRS:
        sub_path = base / name
        sub_path.mkdir(parents=True, exist_ok=True)
        paths[name] = sub_path
    return paths


def slugify_project_id(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Project id cannot be empty")
    slug = re.sub(r"[^0-9a-zA-Z_-]+", "-", value)
    slug = slug.strip("-").lower()
    slug = re.sub(r"-{2,}", "-", slug)
    if not slug:
        raise ValueError("Project id must contain alphanumeric characters")
    return slug


def create_project(project_id: str, display_name: Optional[str] = None, description: str = "") -> ProjectRecord:
    pid = slugify_project_id(project_id)
    existing = load_project(pid)
    if existing:
        raise ValueError(f"Project '{pid}' already exists")
    timestamp = _now_iso()
    record = ProjectRecord(
        project_id=pid,
        display_name=(display_name or project_id or pid).strip() or pid,
        description=description.strip(),
        created_at=timestamp,
        updated_at=timestamp,
    )
    ensure_project_dirs(pid)
    _write_project_file(record)
    records = list_projects()
    seen = {rec.project_id for rec in records}
    if pid not in seen:
        records.append(record)
    _write_index(records)
    return record


def delete_project(project_id: str, *, move_to_trash: bool = True) -> Optional[Path]:
    """Delete a project directory. Returns trash path when applicable."""
    pid = slugify_project_id(project_id)
    base = _project_base(pid)
    if not base.exists():
        raise FileNotFoundError(f"Project '{pid}' does not exist.")
    trash_path: Optional[Path] = None
    if move_to_trash:
        _ensure_trash_root()
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        trash_path = TRASH_ROOT / f"{pid}-{stamp}"
        counter = 1
        while trash_path.exists():
            trash_path = TRASH_ROOT / f"{pid}-{stamp}-{counter}"
            counter += 1
        shutil.move(str(base), str(trash_path))
    else:
        shutil.rmtree(base, ignore_errors=False)
    remaining = [rec for rec in list_projects() if rec.project_id != pid]
    _write_index(remaining)
    return trash_path


def update_project(
    project_id: str,
    *,
    display_name: Optional[str] = None,
    description: Optional[str] = None,
    default_embedding: Optional[Dict[str, object]] = None,
) -> ProjectRecord:
    pid = slugify_project_id(project_id)
    record = load_project(pid)
    if record is None:
        raise FileNotFoundError(f"Project '{pid}' does not exist.")
    if display_name is not None:
        value = display_name.strip()
        if value:
            record.display_name = value
    if description is not None:
        record.description = description.strip()
    if default_embedding is not None:
        record.default_embedding = default_embedding
    record.updated_at = _now_iso()
    _write_project_file(record)
    records = list_projects()
    found = False
    for idx, existing in enumerate(records):
        if existing.project_id == pid:
            records[idx] = record
            found = True
            break
    if not found:
        records.append(record)
    _write_index(records)
    return record


@dataclass
class DocumentManifestSummary:
    doc_id: str
    source: str = ""
    chunk_count: int = 0
    embedding_count: int = 0
    embedding_provider: str = ""
    embedding_model: str = ""
    authors: List[str] = field(default_factory=list)
    has_ingest: bool = False
    has_preprocess: bool = False
    has_chunks: bool = False
    has_embeddings: bool = False
    health: str = "unknown"
    issues: List[str] = field(default_factory=list)
    chunk_path: Optional[str] = None
    embedding_path: Optional[str] = None


@dataclass
class ProjectManifestSummary:
    project_id: str
    doc_count: int = 0
    chunk_total: int = 0
    embedding_total: int = 0
    healthy_docs: int = 0
    documents: List[DocumentManifestSummary] = field(default_factory=list)
    manifest_path: Optional[Path] = None

    @property
    def unhealthy_docs(self) -> int:
        return max(self.doc_count - self.healthy_docs, 0)

    @property
    def has_documents(self) -> bool:
        return bool(self.doc_count)

    @property
    def has_warnings(self) -> bool:
        return any(doc.issues for doc in self.documents)


def _manifest_path(project_id: str) -> Path:
    base = _project_base(project_id)
    return base / "manifest.jsonl"


def read_manifest_entries(project_id: str) -> List[Dict[str, object]]:
    path = _manifest_path(project_id)
    if not path.exists():
        return []
    entries: List[Dict[str, object]] = []
    try:
        with path.open("r", encoding="utf-8") as fh:
            for line in fh:
                payload = line.strip()
                if not payload:
                    continue
                try:
                    entries.append(json.loads(payload))
                except Exception:
                    continue
    except Exception:
        return []
    return entries


def summarize_manifest(project_id: str) -> ProjectManifestSummary:
    entries = read_manifest_entries(project_id)
    doc_states: Dict[str, Dict[str, object]] = {}
    doc_sources: Dict[str, str] = {}
    for entry in entries:
        doc_id = entry.get("doc_id")
        if not doc_id:
            continue
        status = str(entry.get("status") or "unknown")
        state = doc_states.setdefault(doc_id, {"statuses": {}, "deleted": False})
        statuses = state["statuses"]  # type: ignore[assignment]
        if status == "deleted":
            state["deleted"] = True
            statuses.clear()
            continue
        if state.get("deleted"):
            state["deleted"] = False
            statuses.clear()
        statuses[status] = entry
        source = entry.get("source")
        if isinstance(source, str) and source and doc_id not in doc_sources:
            doc_sources[doc_id] = source

    documents: List[DocumentManifestSummary] = []
    chunk_total = 0
    embedding_total = 0
    healthy_docs = 0

    for doc_id, state in doc_states.items():
        if state.get("deleted"):
            continue
        statuses = state.get("statuses", {})
        chunk_entry = statuses.get("chunks") or statuses.get("complete")
        embedding_entry = statuses.get("embeddings")
        ingest_entry = statuses.get("ingest")
        preprocess_entry = statuses.get("preprocess")
        chunk_count = int(chunk_entry.get("chunk_count", 0)) if chunk_entry else 0
        vector_count = int(embedding_entry.get("vector_count", 0)) if embedding_entry else 0
        if chunk_count:
            chunk_total += chunk_count
        if vector_count:
            embedding_total += vector_count
        health, issues = _evaluate_doc_health(chunk_count, vector_count, bool(chunk_entry), bool(embedding_entry))
        if health == "ok":
            healthy_docs += 1
        documents.append(
            DocumentManifestSummary(
                doc_id=doc_id,
                source=doc_sources.get(doc_id, ingest_entry.get("source", "") if ingest_entry else ""),
                chunk_count=chunk_count,
                embedding_count=vector_count,
                embedding_provider=str(embedding_entry.get("provider", "")) if embedding_entry else "",
                embedding_model=str(embedding_entry.get("model", "")) if embedding_entry else "",
                authors=list(ingest_entry.get("authors", [])) if ingest_entry else [],
                has_ingest=bool(ingest_entry),
                has_preprocess=bool(preprocess_entry),
                has_chunks=bool(chunk_entry),
                has_embeddings=bool(embedding_entry),
                health=health,
                issues=issues,
                chunk_path=_safe_manifest_path(chunk_entry.get("file_path")) if chunk_entry else None,
                embedding_path=_safe_manifest_path(embedding_entry.get("file_path")) if embedding_entry else None,
            )
        )

    documents.sort(key=lambda doc: doc.doc_id)
    summary = ProjectManifestSummary(
        project_id=project_id,
        doc_count=len(documents),
        chunk_total=chunk_total,
        embedding_total=embedding_total,
        healthy_docs=healthy_docs,
        documents=documents,
        manifest_path=_manifest_path(project_id),
    )
    return summary


def _safe_manifest_path(value: object) -> Optional[str]:
    if isinstance(value, str) and value:
        return value
    return None


def _evaluate_doc_health(chunk_count: int, vector_count: int, has_chunks: bool, has_embeddings: bool) -> tuple[str, List[str]]:
    issues: List[str] = []
    if not has_chunks or chunk_count <= 0:
        issues.append("no_chunks")
    if has_chunks and (not has_embeddings or vector_count <= 0):
        issues.append("missing_embeddings")
    if has_chunks and has_embeddings and chunk_count != vector_count:
        issues.append("mismatch")
    health = "ok" if not issues else issues[0]
    return health, issues


__all__ = [
    "ProjectRecord",
    "PROJECTS_ROOT",
    "INDEX_FILE",
    "list_projects",
    "load_project",
    "create_project",
    "delete_project",
    "update_project",
    "ensure_project_dirs",
    "slugify_project_id",
    "DocumentManifestSummary",
    "ProjectManifestSummary",
    "read_manifest_entries",
    "summarize_manifest",
]
