"""Chunking helpers for research paper artifacts."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .ingestion_base import IngestArtifact, SectionBlock
from .preprocess import PreprocessResult


def _tokenize(text: str) -> List[str]:
    return text.split()


def _estimate_tokens(text: str) -> int:
    return len(_tokenize(text))


@dataclass
class Chunk:
    chunk_id: str
    doc_id: str
    project_id: str
    run_id: str
    text: str
    metadata: Dict[str, object]


@dataclass
class ChunkerOptions:
    target_tokens: int = 450
    overlap_tokens: int = 60
    min_tokens: int = 120


class ResearchPaperChunker:
    def __init__(self, options: Optional[ChunkerOptions] = None):
        self.options = options or ChunkerOptions()

    def chunkify(
        self,
        artifact: IngestArtifact,
        preprocess: PreprocessResult,
        *,
        project_id: str,
        run_id: str,
        excluded_sections: Optional[Iterable[str]] = None,
    ) -> List[Chunk]:
        excluded = set(excluded_sections or [])
        seq = 0
        chunks: List[Chunk] = []

        section_lookup = {sec.block_id: sec for sec in artifact.sections}
        for metric in preprocess.section_metrics:
            if metric.block_id in excluded:
                continue
            section = section_lookup.get(metric.block_id)
            if not section or not section.text.strip():
                continue
            section_chunks = self._chunk_section(section, seq)
            seq += len(section_chunks)
            for idx, entry in enumerate(section_chunks, start=1):
                source_file = Path(getattr(artifact.header, "source_path", "") or "").stem or artifact.header.doc_id
                base = source_file
                if artifact.header.doc_id and artifact.header.doc_id != source_file:
                    base = f"{source_file}__{artifact.header.doc_id}"
                chunk_id = f"{base}-chunk-{len(chunks) + 1:04d}"
                metadata = {
                    "doc_id": artifact.header.doc_id,
                    "source_file": source_file,
                    "project_id": project_id,
                    "run_id": run_id,
                    "section_block_id": section.block_id,
                    "section_title": section.title,
                    "section_type": section.metadata.get("section_type"),
                    "page_span": section.page_span,
                    "chunk_index_within_section": idx,
                    "start_word": entry["start_word"],
                    "end_word": entry["end_word"],
                    "token_estimate": entry["token_estimate"],
                    "char_span": entry["char_span"],
                }
                chunks.append(
                    Chunk(
                        chunk_id=chunk_id,
                        doc_id=artifact.header.doc_id,
                        project_id=project_id,
                        run_id=run_id,
                        text=entry["text"],
                        metadata=metadata,
                    )
                )
        return chunks

    def _chunk_section(self, section: SectionBlock, seq_offset: int) -> List[Dict[str, object]]:
        tokens = _tokenize(section.text)
        if not tokens:
            return []
        opts = self.options
        target = max(opts.min_tokens, opts.target_tokens)
        overlap = min(opts.overlap_tokens, target // 2)
        step = max(target - overlap, opts.min_tokens)

        chunks: List[Dict[str, object]] = []
        start = 0
        total_words = len(tokens)
        while start < total_words:
            end = min(total_words, start + target)
            slice_tokens = tokens[start:end]
            if len(slice_tokens) < opts.min_tokens and chunks:
                chunks[-1]["text"] += " " + " ".join(slice_tokens)
                chunks[-1]["end_word"] = end
                chunks[-1]["token_estimate"] = _estimate_tokens(chunks[-1]["text"])
                chunks[-1]["char_span"] = (
                    chunks[-1]["char_span"][0],
                    chunks[-1]["char_span"][1] + len(" ".join(slice_tokens)) + 1,
                )
                break

            text = " ".join(slice_tokens).strip()
            if not text:
                break
            char_start = len(" ".join(tokens[:start]))
            if char_start:
                char_start += 1  # account for omitted space
            char_end = char_start + len(text)
            chunks.append(
                {
                    "text": text,
                    "start_word": start,
                    "end_word": end,
                    "token_estimate": len(slice_tokens),
                    "char_span": (char_start, char_end),
                }
            )
            if end >= total_words:
                break
            start = max(end - overlap, start + step)
        return chunks


__all__ = ["ResearchPaperChunker", "ChunkerOptions", "Chunk"]
