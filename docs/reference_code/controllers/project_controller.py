"""Stateful helpers for project metadata operations."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

from ragx.core.services.project_store import (
    PROJECTS_ROOT as PROJECTS_ROOT_PATH,
    ProjectManifestSummary,
    ProjectRecord,
    create_project,
    delete_project,
    ensure_project_dirs,
    list_projects,
    read_manifest_entries,
    slugify_project_id,
    summarize_manifest,
    update_project,
)


@dataclass
class ProjectListResult:
    """Return value for project listing calls."""

    records: List[ProjectRecord]
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.error is None


@dataclass
class ProjectCreateResult:
    """Return value for project creation/update operations."""

    record: Optional[ProjectRecord] = None
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.error is None and self.record is not None


@dataclass
class ProjectUpdateResult(ProjectCreateResult):
    """Alias for updates (same payload as creation)."""


@dataclass
class ProjectDeleteResult:
    """Return value for project deletion."""

    trash_path: Optional[Path] = None
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.error is None


@dataclass
class ProjectManifestResult:
    """Return value for manifest summaries."""

    summary: Optional[ProjectManifestSummary] = None
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.error is None and self.summary is not None


@dataclass
class ManifestEntriesResult:
    """Return value for manifest entry reads."""

    entries: List[Dict[str, object]]
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.error is None


class ProjectController:
    """Orchestrates project metadata helpers with friendly error handling."""

    def __init__(self, *, projects_root: Path | None = None) -> None:
        self._projects_root = projects_root or PROJECTS_ROOT_PATH

    @property
    def projects_root(self) -> Path:
        return self._projects_root

    # ------------------------------------------------------------------ queries
    def list_projects(self) -> ProjectListResult:
        try:
            records = list_projects()
        except Exception as exc:  # noqa: BLE001
            return ProjectListResult(records=[], error=str(exc))
        return ProjectListResult(records=records)

    def summarize_manifest(self, project_id: str) -> ProjectManifestResult:
        try:
            summary = summarize_manifest(project_id)
        except Exception as exc:  # noqa: BLE001
            return ProjectManifestResult(summary=None, error=str(exc))
        return ProjectManifestResult(summary=summary)

    def read_manifest_entries(self, project_id: str) -> ManifestEntriesResult:
        try:
            entries = read_manifest_entries(project_id)
        except Exception as exc:  # noqa: BLE001
            return ManifestEntriesResult(entries=[], error=str(exc))
        return ManifestEntriesResult(entries=entries)

    def project_paths(self, project_id: str) -> Dict[str, Path]:
        if not project_id:
            raise ValueError("Missing project id")
        paths = ensure_project_dirs(project_id)
        base = paths.get("base") or (self.projects_root / project_id)
        paths["base"] = base
        paths["manifest"] = base / "manifest.jsonl"
        paths["project_id"] = project_id
        return paths

    # --------------------------------------------------------------- mutations
    def create_project(
        self, project_id: str, *, display_name: str, description: str = ""
    ) -> ProjectCreateResult:
        try:
            record = create_project(project_id, display_name=display_name, description=description)
        except Exception as exc:  # noqa: BLE001
            return ProjectCreateResult(record=None, error=str(exc))
        return ProjectCreateResult(record=record)

    def update_project(
        self,
        project_id: str,
        *,
        display_name: str | None = None,
        description: str | None = None,
        default_embedding: dict | None = None,
    ) -> ProjectUpdateResult:
        try:
            record = update_project(
                project_id,
                display_name=display_name,
                description=description,
                default_embedding=default_embedding,
            )
        except Exception as exc:  # noqa: BLE001
            return ProjectUpdateResult(record=None, error=str(exc))
        return ProjectUpdateResult(record=record)

    def delete_project(self, project_id: str, *, move_to_trash: bool = True) -> ProjectDeleteResult:
        try:
            trash_path = delete_project(project_id, move_to_trash=move_to_trash)
        except Exception as exc:  # noqa: BLE001
            return ProjectDeleteResult(trash_path=None, error=str(exc))
        return ProjectDeleteResult(trash_path=trash_path)

    # ----------------------------------------------------------- helper utils
    def slugify(self, value: str) -> str:
        return slugify_project_id(value)

