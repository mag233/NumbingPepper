"""Document cleanup + metadata helpers prior to chunking."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

from .ingestion_base import IngestArtifact, SectionBlock, flatten_sections


@dataclass
class PreprocessOptions:
    enable_deep_clean: bool = True
    remove_section_types: Sequence[str] = (
        "front_matter",
        "references",
        "acknowledgements",
        "appendix",
        "table_of_contents",
    )
    strip_author_metadata: bool = True

    def normalized_remove_types(self) -> Tuple[str, ...]:
        seen = []
        for entry in self.remove_section_types:
            if not entry:
                continue
            lowered = entry.lower()
            if lowered not in seen:
                seen.append(lowered)
        return tuple(seen)


@dataclass
class SectionMetrics:
    block_id: str
    title: str
    section_type: Optional[str]
    page_span: Optional[tuple[int, int]]
    chars: int
    words: int


@dataclass
class RemovedSection:
    block_id: str
    title: str
    section_type: Optional[str]
    reason: str


@dataclass
class PreprocessResult:
    cleaned_text: str
    deep_clean_text: str
    paragraphs: List[str]
    deep_clean_paragraphs: List[str]
    stats_raw: Dict[str, int]
    stats_clean: Dict[str, int]
    stats_deep_clean: Dict[str, int]
    section_metrics: List[SectionMetrics]
    removed_sections: List[RemovedSection]


class DocumentPreprocessor:
    """Applies cleanup heuristics + light metadata prep before chunking."""

    def __init__(self, options: Optional[PreprocessOptions] = None):
        self.options = options or PreprocessOptions()

    def preprocess(
        self,
        artifact: IngestArtifact,
        *,
        options: Optional[PreprocessOptions] = None,
    ) -> PreprocessResult:
        opts = options or self.options
        raw_text = artifact.raw_text or flatten_sections(artifact.sections)
        cleaned_text, paragraphs = self._clean_text(raw_text)
        stats_raw = self._text_stats(raw_text)
        stats_clean = self._text_stats(cleaned_text)

        if opts.enable_deep_clean:
            (
                deep_clean_text,
                deep_clean_paragraphs,
                removed_sections,
            ) = self._deep_clean(artifact, opts)
        else:
            deep_clean_text = cleaned_text
            deep_clean_paragraphs = paragraphs
            removed_sections = []
        stats_deep_clean = self._text_stats(deep_clean_text)

        section_metrics = [
            SectionMetrics(
                block_id=section.block_id,
                title=section.title,
                section_type=self._section_type(section),
                page_span=section.page_span,
                chars=len(section.text or ""),
                words=self._word_count(section.text or ""),
            )
            for section in artifact.sections
        ]

        return PreprocessResult(
            cleaned_text=cleaned_text,
            deep_clean_text=deep_clean_text,
            paragraphs=paragraphs,
            deep_clean_paragraphs=deep_clean_paragraphs,
            stats_raw=stats_raw,
            stats_clean=stats_clean,
            stats_deep_clean=stats_deep_clean,
            section_metrics=section_metrics,
            removed_sections=removed_sections,
        )

    # ------------------------------------------------------------------ #
    # Text utilities
    def _clean_text(self, text: str) -> tuple[str, List[str]]:
        if not text:
            return "", []
        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        normalized = re.sub(r"[ \t]+", " ", normalized)
        normalized = re.sub(r" ?\n{2,}", "\n\n", normalized)
        normalized = re.sub(r"(?<=\w)-\n(?=\w)", " ", normalized)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        normalized = normalized.strip()
        blocks = [block.strip() for block in re.split(r"\n{2,}", normalized)]
        paragraphs: List[str] = []
        for block in blocks:
            if not block:
                continue
            merged = re.sub(r"\s*\n\s*", " ", block)
            merged = re.sub(r"\s{2,}", " ", merged).strip()
            if merged:
                paragraphs.append(merged)
        cleaned_text = "\n\n".join(paragraphs)
        return cleaned_text, paragraphs

    def _text_stats(self, text: str) -> Dict[str, int]:
        return {
            "chars": len(text),
            "words": self._word_count(text),
            "paragraphs": len(self._paragraphs(text)),
        }

    def _paragraphs(self, text: str) -> List[str]:
        splits = re.split(r"\n{2,}", text.strip()) if text.strip() else []
        return [s.strip() for s in splits if s.strip()]

    def _word_count(self, text: str) -> int:
        if not text:
            return 0
        return len(re.findall(r"\b\w+\b", text))

    # ------------------------------------------------------------------ #
    # Deep clean helpers
    def _deep_clean(
        self,
        artifact: IngestArtifact,
        opts: PreprocessOptions,
    ) -> tuple[str, List[str], List[RemovedSection]]:
        removal_types = set(opts.normalized_remove_types())
        retained_sections: List[SectionBlock] = []
        removed: List[RemovedSection] = []

        for section in artifact.sections:
            section_type = (self._section_type(section) or "").lower()
            if section_type and section_type in removal_types:
                removed.append(
                    RemovedSection(
                        block_id=section.block_id,
                        title=section.title,
                        section_type=section_type or None,
                        reason=f"section_type:{section_type}",
                    )
                )
                continue
            retained_sections.append(section)

        if retained_sections:
            combined = "\n\n".join(sec.text or "" for sec in retained_sections)
        else:
            combined = artifact.raw_text or ""

        deep_clean_text, deep_clean_paragraphs = self._clean_text(combined)
        if opts.strip_author_metadata:
            deep_clean_text = self._strip_header_metadata(deep_clean_text, artifact)
        if deep_clean_text:
            deep_clean_paragraphs = self._paragraphs(deep_clean_text)
        else:
            deep_clean_paragraphs = []
        return deep_clean_text, deep_clean_paragraphs, removed

    def _strip_header_metadata(self, text: str, artifact: IngestArtifact) -> str:
        header = getattr(artifact, "header", None)
        extra = getattr(header, "extra", {}) if header else {}
        if not text or not isinstance(extra, dict):
            return text
        authors = extra.get("authors") or extra.get("author")
        tokens: List[str] = []
        if isinstance(authors, str):
            tokens.append(authors)
        elif isinstance(authors, (list, tuple, set)):
            tokens.extend(str(item) for item in authors)
        cleaned = text
        for token in tokens:
            cleaned = self._remove_token_occurrence(cleaned, str(token).strip())
        return cleaned.strip()

    def _remove_token_occurrence(self, text: str, token: str) -> str:
        if not text or not token:
            return text
        lowered = text.lower()
        token_lower = token.lower()
        idx = lowered.find(token_lower)
        if 0 <= idx <= 400:
            cleaned = text[:idx] + text[idx + len(token) :]
        else:
            pattern = re.compile(rf"^\s*{re.escape(token)}\s*$", re.IGNORECASE | re.MULTILINE)
            cleaned = re.sub(pattern, "", text)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned

    # ------------------------------------------------------------------ #
    def _section_type(self, section: SectionBlock) -> Optional[str]:
        metadata = getattr(section, "metadata", {}) or {}
        value = metadata.get("section_type") or metadata.get("type")
        return str(value) if isinstance(value, str) else None


def _tuple_from_span(value: object) -> Optional[tuple[int, int]]:
    if isinstance(value, (list, tuple)) and len(value) == 2:
        try:
            return int(value[0]), int(value[1])
        except Exception:
            return None
    return None


def preprocess_result_from_payload(payload: Dict[str, Any]) -> PreprocessResult:
    section_metrics = [
        SectionMetrics(
            block_id=str(metric.get("block_id") or ""),
            title=str(metric.get("title") or ""),
            section_type=metric.get("section_type"),
            page_span=_tuple_from_span(metric.get("page_span")),
            chars=int(metric.get("chars") or 0),
            words=int(metric.get("words") or 0),
        )
        for metric in payload.get("section_metrics", [])
        if isinstance(metric, dict)
    ]
    removed_sections = [
        RemovedSection(
            block_id=str(entry.get("block_id") or ""),
            title=str(entry.get("title") or ""),
            section_type=entry.get("section_type"),
            reason=str(entry.get("reason") or ""),
        )
        for entry in payload.get("removed_sections", [])
        if isinstance(entry, dict)
    ]
    return PreprocessResult(
        cleaned_text=str(payload.get("cleaned_text") or ""),
        deep_clean_text=str(payload.get("deep_clean_text") or ""),
        paragraphs=list(payload.get("paragraphs") or []),
        deep_clean_paragraphs=list(payload.get("deep_clean_paragraphs") or []),
        stats_raw=dict(payload.get("stats_raw") or {}),
        stats_clean=dict(payload.get("stats_clean") or {}),
        stats_deep_clean=dict(payload.get("stats_deep_clean") or {}),
        section_metrics=section_metrics,
        removed_sections=removed_sections,
    )


def load_preprocess_result(path: Path | str) -> PreprocessResult:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return preprocess_result_from_payload(payload)


__all__ = [
    "DocumentPreprocessor",
    "PreprocessOptions",
    "PreprocessResult",
    "RemovedSection",
    "SectionMetrics",
    "preprocess_result_from_payload",
    "load_preprocess_result",
]
