"""Pydantic-powered metadata schema and validators for ingestion artifacts."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union, TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, field_validator

if TYPE_CHECKING:  # pragma: no cover - only for typing
    from .ingestion_base import IngestArtifact

ArtifactPayload = Dict[str, Any]
ArtifactLike = Union["IngestArtifact", ArtifactPayload]


def _iso_utc_pattern() -> re.Pattern[str]:
    # Matches YYYY-MM-DDTHH:MM:SSZ
    return re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


class AssetRefModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asset_id: str = Field(min_length=1)
    kind: str = Field(min_length=1)
    source: str = Field(min_length=1)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SectionBlockModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    block_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    level: int = Field(ge=0)
    text: str = Field(min_length=1)
    parent_id: Optional[str] = None
    page_span: Optional[Tuple[int, int]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("page_span")
    @classmethod
    def validate_page_span(
        cls, value: Optional[Tuple[int, int]]
    ) -> Optional[Tuple[int, int]]:
        if value is None:
            return value
        start, end = value
        if start <= 0 or end <= 0:
            raise ValueError("page_span values must be positive integers")
        if start > end:
            raise ValueError("page_span start cannot exceed end")
        return value


class DocumentHeaderModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    doc_id: str = Field(min_length=1)
    doc_type: str = Field(min_length=1)
    source_path: str = Field(min_length=1)
    ingest_time: str = Field(pattern=_iso_utc_pattern().pattern)
    content_hash: str = Field(pattern=r"^[0-9a-f]{64}$")
    language: Optional[str] = None
    page_count: Optional[int] = Field(default=None, ge=0)
    extra: Dict[str, Any] = Field(default_factory=dict)


class ReferenceEntryModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ref_id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    text: str = Field(min_length=1)
    section_block_id: Optional[str] = None
    page_span: Optional[Tuple[int, int]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestArtifactModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    header: DocumentHeaderModel
    sections: List[SectionBlockModel]
    assets: List[AssetRefModel] = Field(default_factory=list)
    references: List[ReferenceEntryModel] = Field(default_factory=list)
    raw_text: str = Field(default="")
    manifests: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("sections")
    @classmethod
    def require_sections(cls, value: List[SectionBlockModel]) -> List[SectionBlockModel]:
        if not value:
            raise ValueError("artifact must contain at least one section")
        seen: set[str] = set()
        for section in value:
            if section.block_id in seen:
                raise ValueError(f"duplicate section block_id: {section.block_id}")
            seen.add(section.block_id)
        return value

    @field_validator("assets")
    @classmethod
    def unique_asset_ids(cls, value: List[AssetRefModel]) -> List[AssetRefModel]:
        seen: set[str] = set()
        for asset in value:
            if asset.asset_id in seen:
                raise ValueError(f"duplicate asset_id: {asset.asset_id}")
            seen.add(asset.asset_id)
        return value

    @field_validator("references")
    @classmethod
    def unique_reference_ids(cls, value: List[ReferenceEntryModel]) -> List[ReferenceEntryModel]:
        seen: set[str] = set()
        for ref in value:
            if ref.ref_id in seen:
                raise ValueError(f"duplicate reference ref_id: {ref.ref_id}")
            seen.add(ref.ref_id)
        return value


def validate_artifact_payload(artifact: ArtifactLike) -> IngestArtifactModel:
    """Validate artifact data and return the parsed model."""
    payload: ArtifactPayload
    if hasattr(artifact, "to_dict"):
        payload = artifact.to_dict()  # type: ignore[assignment]
    elif isinstance(artifact, dict):
        payload = artifact
    else:
        raise TypeError("artifact must be a dict or expose to_dict()")
    return IngestArtifactModel.model_validate(payload)


def artifact_json_schema() -> Dict[str, Any]:
    """Return the JSON schema for ingestion artifacts."""
    return IngestArtifactModel.model_json_schema()


def write_artifact_schema(path: Union[str, Path]) -> Path:
    """Persist the JSON schema to disk."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    schema = artifact_json_schema()
    target.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    return target


__all__ = [
    "AssetRefModel",
    "SectionBlockModel",
    "DocumentHeaderModel",
    "ReferenceEntryModel",
    "IngestArtifactModel",
    "validate_artifact_payload",
    "artifact_json_schema",
    "write_artifact_schema",
]
