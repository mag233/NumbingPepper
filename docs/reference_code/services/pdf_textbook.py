"""Prototype PDF textbook ingestor for the RAG playground."""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

import fitz  # type: ignore

from .ingestion_base import (
    IngestArtifact,
    SectionBlock,
    detect_language_simple,
    new_header,
    save_artifact_jsonl,
)


# --- Helpers -----------------------------------------------------------------
def _page_texts(doc: fitz.Document) -> List[str]:
    texts: List[str] = []
    for page in doc:
        try:
            texts.append(page.get_text("text"))
        except Exception:
            texts.append("")
    return texts


def _build_sections_from_toc(
    toc: Sequence[Sequence[Any]],
    page_texts: List[str],
) -> List[SectionBlock]:
    if not toc:
        return []
    sections: List[SectionBlock] = []
    total_pages = len(page_texts)
    for idx, entry in enumerate(toc):
        if len(entry) < 3:
            continue
        level = int(entry[0])
        title = str(entry[1]).strip() or f"Section {idx+1}"
        start_page = max(1, int(entry[2]))
        end_page = total_pages
        if idx + 1 < len(toc):
            next_entry = toc[idx + 1]
            if len(next_entry) >= 3:
                end_page = max(start_page, int(next_entry[2]) - 1)
        text_slice = page_texts[start_page - 1 : end_page]
        text = "\n".join(text_slice).strip()
        if not text:
            continue
        sections.append(
            SectionBlock(
                block_id=f"sec-{idx+1}",
                title=title,
                level=level,
                text=text,
                parent_id=None,
                page_span=(start_page, end_page),
                metadata={},
            )
        )
    return sections


def _fallback_sections(page_texts: List[str]) -> List[SectionBlock]:
    sections: List[SectionBlock] = []
    for idx, text in enumerate(page_texts, start=1):
        clean = text.strip()
        if not clean:
            continue
        sections.append(
            SectionBlock(
                block_id=f"page-{idx}",
                title=f"Page {idx}",
                level=1,
                text=clean,
                parent_id=None,
                page_span=(idx, idx),
                metadata={},
            )
        )
    return sections


# --- Ingestor ----------------------------------------------------------------


@dataclass
class PdfTextbookIngestOptions:
    two_column: str = "auto"  # future use


class PdfTextbookIngestor:
    def __init__(self, opts: Optional[PdfTextbookIngestOptions] = None):
        self.opts = opts or PdfTextbookIngestOptions()

    def ingest(self, source: Path) -> IngestArtifact:
        if not source.exists():
            raise FileNotFoundError(source)
        doc = fitz.open(source)
        page_texts = _page_texts(doc)
        toc = doc.get_toc(simple=False)
        sections = _build_sections_from_toc(toc, page_texts)
        if not sections:
            sections = _fallback_sections(page_texts)

        header = new_header(
            source_path=source,
            doc_type="pdf_textbook",
            language=detect_language_simple("".join(page_texts[:5])),
            page_count=len(page_texts),
            extra={
                "title": doc.metadata.get("title"),
                "author": doc.metadata.get("author"),
                "producer": doc.metadata.get("producer"),
                "toc_entries": len(toc),
            },
        )

        manifests = {
            "pages": [
                {"page": idx + 1, "chars": len(text)}
                for idx, text in enumerate(page_texts)
            ],
            "sections": [
                {
                    "block_id": sec.block_id,
                    "title": sec.title,
                    "level": sec.level,
                    "page_span": sec.page_span,
                }
                for sec in sections
            ],
        }

        raw_text = "\n\n".join(page_texts)
        artifact = IngestArtifact(
            header=header,
            sections=sections,
            assets=[],
            raw_text=raw_text,
            manifests=manifests,
        )
        return artifact


def run_cli(source: Path, output_dir: Path) -> Path:
    ingestor = PdfTextbookIngestor()
    artifact = ingestor.ingest(source)
    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / f"{artifact.header.doc_id}.jsonl"
    save_artifact_jsonl(artifact, out_file)
    return out_file


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PDF textbook ingestion prototype")
    parser.add_argument("--source", required=True, help="Path to PDF textbook")
    parser.add_argument(
        "--output-dir",
        default="playground/rag_agent/output/ingest",
        help="Directory to write JSONL artifacts",
    )
    return parser


if __name__ == "__main__":
    args = _build_parser().parse_args()
    output_path = run_cli(Path(args.source).resolve(), Path(args.output_dir).resolve())
    print(f"[ingest] wrote artifact: {output_path}")
