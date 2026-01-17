"""Shared dataclasses and helpers for RAG document ingestion prototypes.

These helpers live under ``playground/rag_agent`` while we iterate.
Once stable they can be relocated under ``src/ragx/core/services/``.
"""
from __future__ import annotations

# Shared dataclasses and helpers for RAG document ingestion prototypes.
# These helpers are used for processing and managing documents, sections, assets, and references
# during Retrieval-Augmented Generation (RAG) workflows. The code provides utility functions for
# hashing, language detection, document ID generation, and serialization, as well as dataclasses
# representing document structure and metadata.


# Standard library imports
from dataclasses import dataclass, field, asdict  # For defining structured data containers
from pathlib import Path  # For filesystem path operations
from typing import Any, Dict, Iterable, List, Optional  # For type hints


import datetime as _dt  # Used for timestamps
import hashlib  # Used for generating SHA256 hashes
import json  # For JSON serialization
import uuid  # For generating unique document IDs



def _now_iso() -> str:
    """
    Returns the current UTC time in ISO 8601 format with seconds precision, suffixed with 'Z'.
    Used for timestamping document ingestion.
    """
    return _dt.datetime.utcnow().isoformat(timespec="seconds") + "Z"



def sha256_bytes(data: bytes) -> str:
    """
    Computes the SHA256 hash of a bytes object.
    Args:
        data (bytes): Data to hash.
    Returns:
        str: Hexadecimal SHA256 digest.
    """
    return hashlib.sha256(data).hexdigest()



def sha256_file(path: Path) -> str:
    """
    Computes the SHA256 hash of a file's contents.
    Args:
        path (Path): Path to the file.
    Returns:
        str: Hexadecimal SHA256 digest.
    """
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()



def detect_language_simple(text: str) -> Optional[str]:
    """
    Heuristic to detect if text is primarily Chinese or English.
    Args:
        text (str): Input text.
    Returns:
        Optional[str]: 'zh-CN' for Chinese, 'en-US' for English, or None if undetermined.
    """
    if not text:
        return None
    zh = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")  # Count Chinese characters
    latin = sum(1 for ch in text if ("A" <= ch <= "Z") or ("a" <= ch <= "z"))  # Count Latin letters
    if zh + latin == 0:
        return None
    ratio = zh / (zh + latin)
    if ratio >= 0.55:
        return "zh-CN"
    if (1 - ratio) >= 0.55:
        return "en-US"
    return "zh-CN" if zh > latin else "en-US"



@dataclass
class AssetRef:
    """
    Represents a reference to an asset (e.g., image, table, equation) in a document.
    Args:
        asset_id (str): Unique identifier for the asset.
        kind (str): Type of asset (e.g., 'image', 'table').
        source (str): Source path or reference (e.g., file path, page number).
        metadata (Dict[str, Any]): Additional metadata about the asset.
    """
    asset_id: str
    kind: str  # e.g., image/table/equation
    source: str  # path or page/section reference
    metadata: Dict[str, Any] = field(default_factory=dict)



@dataclass
class SectionBlock:
    """
    Represents a block/section of a document (e.g., chapter, subsection).
    Args:
        block_id (str): Unique identifier for the section block.
        title (str): Title of the section.
        level (int): Hierarchy level (e.g., 1 for chapter, 2 for subsection).
        text (str): Section text content.
        parent_id (Optional[str]): ID of parent section, if any.
        page_span (Optional[tuple[int, int]]): Page range for the section.
        metadata (Dict[str, Any]): Additional metadata.
    """
    block_id: str
    title: str
    level: int
    text: str
    parent_id: Optional[str] = None
    page_span: Optional[tuple[int, int]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)



@dataclass
class DocumentHeader:
    """
    Metadata for an ingested document.
    Args:
        doc_id (str): Unique document identifier.
        doc_type (str): Type/category of document.
        source_path (str): Path to the source file.
        ingest_time (str): ISO timestamp of ingestion.
        content_hash (str): SHA256 hash of the document content.
        language (Optional[str]): Detected language code.
        page_count (Optional[int]): Number of pages in the document.
        extra (Dict[str, Any]): Additional metadata.
    """
    doc_id: str
    doc_type: str
    source_path: str
    ingest_time: str
    content_hash: str
    language: Optional[str] = None
    page_count: Optional[int] = None
    extra: Dict[str, Any] = field(default_factory=dict)



def generate_doc_id(prefix: str = "doc") -> str:
    """
    Generates a unique document ID with a given prefix.
    Args:
        prefix (str): Prefix for the document ID.
    Returns:
        str: Document ID string.
    """
    return f"{prefix}-{uuid.uuid4().hex[:12]}"



def ensure_dir(path: Path) -> Path:
    """
    Ensures that a directory exists, creating it if necessary.
    Args:
        path (Path): Directory path.
    Returns:
        Path: The same path object.
    """
    path.mkdir(parents=True, exist_ok=True)
    return path



def save_artifact_jsonl(artifact: 'IngestArtifact', output_file: Path) -> None:
    """
    Validates and saves an IngestArtifact as a JSON line in the specified file.
    Args:
        artifact (IngestArtifact): The artifact to save.
        output_file (Path): Path to the output .jsonl file.
    """
    from .metadata_schema import validate_artifact_payload

    validate_artifact_payload(artifact)
    ensure_dir(output_file.parent)
    with output_file.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(artifact.to_dict(), ensure_ascii=False) + "\n")


def _tuple_from_span(value: Any) -> Optional[tuple[int, int]]:
    if isinstance(value, (list, tuple)) and len(value) == 2:
        try:
            return int(value[0]), int(value[1])
        except Exception:
            return None
    return None


def artifact_from_payload(payload: Dict[str, Any]) -> "IngestArtifact":
    header_payload = payload.get("header") or {}
    header = DocumentHeader(
        doc_id=str(header_payload.get("doc_id") or ""),
        doc_type=str(header_payload.get("doc_type") or ""),
        source_path=str(header_payload.get("source_path") or ""),
        ingest_time=str(header_payload.get("ingest_time") or ""),
        content_hash=str(header_payload.get("content_hash") or ""),
        language=header_payload.get("language"),
        page_count=header_payload.get("page_count"),
        extra=header_payload.get("extra") or {},
    )
    sections = [
        SectionBlock(
            block_id=str(section.get("block_id") or ""),
            title=str(section.get("title") or ""),
            level=int(section.get("level") or 0),
            text=str(section.get("text") or ""),
            parent_id=section.get("parent_id"),
            page_span=_tuple_from_span(section.get("page_span")),
            metadata=section.get("metadata") or {},
        )
        for section in payload.get("sections", [])
        if isinstance(section, dict)
    ]
    assets = [
        AssetRef(
            asset_id=str(asset.get("asset_id") or ""),
            kind=str(asset.get("kind") or ""),
            source=str(asset.get("source") or ""),
            metadata=asset.get("metadata") or {},
        )
        for asset in payload.get("assets", [])
        if isinstance(asset, dict)
    ]
    references = [
        ReferenceEntry(
            ref_id=str(ref.get("ref_id") or ""),
            label=str(ref.get("label") or ""),
            text=str(ref.get("text") or ""),
            section_block_id=ref.get("section_block_id"),
            page_span=_tuple_from_span(ref.get("page_span")),
            metadata=ref.get("metadata") or {},
        )
        for ref in payload.get("references", [])
        if isinstance(ref, dict)
    ]
    return IngestArtifact(
        header=header,
        sections=sections,
        assets=assets,
        references=references,
        raw_text=str(payload.get("raw_text") or ""),
        manifests=payload.get("manifests") or {},
    )


def load_artifact_jsonl(path: Path) -> "IngestArtifact":
    """
    Load the first artifact payload stored in a JSONL file.
    """
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            payload = json.loads(line)
            return artifact_from_payload(payload)
    raise ValueError(f"No artifact payload found in {path}")


def new_header(
    *,
    source_path: Path,
    doc_type: str,
    language: Optional[str] = None,
    page_count: Optional[int] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> DocumentHeader:
    """
    Creates a new DocumentHeader with metadata for an ingested document.
    Args:
        source_path (Path): Path to the source document.
        doc_type (str): Type/category of document.
        language (Optional[str]): Detected language code.
        page_count (Optional[int]): Number of pages.
        extra (Optional[Dict[str, Any]]): Additional metadata.
    Returns:
        DocumentHeader: Populated document header.
    """
    return DocumentHeader(
        doc_id=generate_doc_id(doc_type),
        doc_type=doc_type,
        source_path=str(source_path),
        ingest_time=_now_iso(),
        content_hash=sha256_file(source_path),
        language=language,
        page_count=page_count,
        extra=extra or {},
    )



def flatten_sections(sections: Iterable[SectionBlock]) -> str:
    """
    Joins the text of all non-empty SectionBlock objects into a single string, separated by double newlines.
    Args:
        sections (Iterable[SectionBlock]): Iterable of section blocks.
    Returns:
        str: Concatenated section text.
    """
    return "\n\n".join(sec.text.strip() for sec in sections if sec.text.strip())



@dataclass
class ReferenceEntry:
    """
    Represents a reference (e.g., citation, footnote) in a document.
    Args:
        ref_id (str): Unique reference identifier.
        label (str): Reference label (e.g., citation key).
        text (str): Reference text/content.
        section_block_id (Optional[str]): Associated section block ID.
        page_span (Optional[tuple[int, int]]): Page range for the reference.
        metadata (Dict[str, Any]): Additional metadata.
    """
    ref_id: str
    label: str
    text: str
    section_block_id: Optional[str] = None
    page_span: Optional[tuple[int, int]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)



@dataclass
class IngestArtifact:
    """
    Container for all data extracted from a document during ingestion.
    Args:
        header (DocumentHeader): Metadata for the document.
        sections (List[SectionBlock]): List of document sections.
        assets (List[AssetRef]): List of referenced assets (images, tables, etc.).
        references (List[ReferenceEntry]): List of references/citations.
        raw_text (str): Raw text of the document.
        manifests (Dict[str, Any]): Additional manifest data.
    """
    header: DocumentHeader
    sections: List[SectionBlock]
    assets: List[AssetRef] = field(default_factory=list)
    references: List[ReferenceEntry] = field(default_factory=list)
    raw_text: str = ""
    manifests: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the artifact to a dictionary suitable for JSON output.
        Returns:
            Dict[str, Any]: Dictionary representation of the artifact.
        """
        return {
            "header": asdict(self.header),
            "sections": [asdict(sec) for sec in self.sections],
            "assets": [asdict(asset) for asset in self.assets],
            "references": [asdict(ref) for ref in self.references],
            "raw_text": self.raw_text,
            "manifests": self.manifests,
        }
