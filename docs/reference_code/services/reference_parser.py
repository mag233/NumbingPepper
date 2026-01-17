"""Lightweight reference extraction for research papers."""
from __future__ import annotations

import itertools
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence

from .ingestion_base import ReferenceEntry

ENTRY_PATTERN = re.compile(
    r"^\s*(?P<label>(\[\d+\])|(\d{1,3}[.)])|([A-Z][A-Za-z-]+,\s*\d{4}))\s*"
)


@dataclass
class ReferenceCandidate:
    label: str
    lines: List[str]

    def consolidated_text(self) -> str:
        joined = " ".join(line.strip() for line in self.lines if line.strip())
        return re.sub(r"\s{2,}", " ", joined).strip()


class ReferenceParser:
    """Splits reference sections into structured entries."""

    def parse_sections(
        self,
        *,
        section_texts: Sequence[str],
        section_ids: Sequence[str],
        page_spans: Sequence[Optional[tuple[int, int]]],
        start_index: int = 1,
    ) -> List[ReferenceEntry]:
        entries: List[ReferenceEntry] = []
        counter = itertools.count(start_index)
        for text, block_id, span in zip(section_texts, section_ids, page_spans):
            parsed = self._parse_block(text or "")
            for candidate in parsed:
                consolidated = candidate.consolidated_text()
                if not consolidated:
                    continue
                ref_id = f"ref-{next(counter):04d}"
                entries.append(
                    ReferenceEntry(
                        ref_id=ref_id,
                        label=candidate.label,
                        text=consolidated,
                        section_block_id=block_id,
                        page_span=span,
                    )
                )
        return entries

    def _parse_block(self, text: str) -> List[ReferenceCandidate]:
        lines = text.splitlines()
        candidates: List[ReferenceCandidate] = []
        current: Optional[ReferenceCandidate] = None

        def flush() -> None:
            nonlocal current
            if current and current.lines:
                candidates.append(current)
            current = None

        for raw_line in lines:
            line = raw_line.rstrip()
            if not line.strip():
                flush()
                continue
            match = ENTRY_PATTERN.match(line)
            if match:
                flush()
                label = match.group("label") or ""
                remainder = line[match.end() :].strip()
                current = ReferenceCandidate(label=label.strip(), lines=[])
                if remainder:
                    current.lines.append(remainder)
                continue
            if current is None:
                current = ReferenceCandidate(label="unlabeled", lines=[])
            current.lines.append(line)
        flush()
        return candidates


__all__ = ["ReferenceParser"]
