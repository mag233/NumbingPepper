"""Prototype PDF research paper ingestor for the RAG playground."""
from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import fitz  # type: ignore
except ImportError as exc:  # pragma: no cover
    fitz = None  # type: ignore
    _fitz_import_error = exc

from .ingestion_base import (
    AssetRef,
    IngestArtifact,
    SectionBlock,
    detect_language_simple,
    new_header,
    save_artifact_jsonl,
)
from .reference_parser import ReferenceParser


SECTION_VARIANTS: Dict[str, Tuple[str, ...]] = {
    "abstract": ("abstract",),
    "introduction": ("introduction", "background"),
    "methods": ("methods", "methodology", "materials and methods"),
    "results": ("results",),
    "discussion": ("discussion", "analysis"),
    "conclusion": ("conclusion", "conclusions"),
    "limitations": ("limitations", "limitation"),
    "acknowledgements": ("acknowledgements", "acknowledgments"),
    "references": ("references", "bibliography"),
}

ASSET_PATTERNS = {
    "table": re.compile(r"\btable\s+[A-Z]?\d+[\w\-]*", re.IGNORECASE),
    "figure": re.compile(r"\bfigure\s+[A-Z]?\d+[\w\-]*", re.IGNORECASE),
}


def _compile_section_patterns() -> List[Tuple[str, re.Pattern[str]]]:
    prefix = r"(?:[0-9]+(?:\.[0-9]+)*\.?|[IVXLC]+\.)?\s*"
    patterns: List[Tuple[str, re.Pattern[str]]] = []
    for section_type, variants in SECTION_VARIANTS.items():
        alternation = "|".join(re.escape(variant) for variant in variants)
        regex = re.compile(
            rf"^\s*{prefix}(?:{alternation})\b[:\s\.-]*.*$",
            re.IGNORECASE,
        )
        patterns.append((section_type, regex))
    return patterns


SECTION_PATTERNS = _compile_section_patterns()
DOI_PATTERN = re.compile(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+\b", re.IGNORECASE)
NAME_PATTERN = re.compile(
    r"\b([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?(?:\s+[A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)+)\b"
)
AFFILIATION_KEYWORDS = (
    "university",
    "school",
    "college",
    "hospital",
    "laboratory",
    "centre",
    "center",
    "institute",
    "department",
    "email",
    "@",
)
STOP_SECTION_KEYWORDS = ("abstract", "introduction", "background")
STUDY_DESIGN_KEYWORDS = {
    "RCT": ("randomized", "randomised", "double-blind", "placebo-controlled"),
    "qRCT": ("quasi-randomized", "quasi experimental", "cluster randomized"),
    "Cohort": ("cohort", "longitudinal", "prospective", "retrospective"),
    "Case-control": ("case-control", "case control"),
    "Cross-sectional": ("cross-sectional", "cross sectional"),
}
CONDITION_KEYWORDS = (
    "diabetes",
    "hypertension",
    "cancer",
    "covid",
    "asthma",
    "stroke",
    "obesity",
    "depression",
)
POPULATION_KEYWORDS = {
    "children": ("child", "children", "pediatric", "paediatric"),
    "adolescents": ("adolescent", "teen"),
    "adults": ("adult" ,),
    "older adults": ("elderly", "older", "geriatric"),
    "pregnant": ("pregnant", "gestational"),
    "infants": ("infant", "neonate", "newborn"),
}


def _normalize_heading(text: str) -> str:
    cleaned = text.strip().strip(":")
    return re.sub(r"\s+", " ", cleaned)


def _match_section_heading(line: str) -> Optional[Tuple[str, str]]:
    stripped = line.strip()
    if not stripped:
        return None
    for section_type, pattern in SECTION_PATTERNS:
        if pattern.match(stripped):
            return _normalize_heading(stripped), section_type
    return None


def _page_texts(doc: fitz.Document) -> List[str]:
    texts: List[str] = []
    for page in doc:
        try:
            texts.append(page.get_text("text"))
        except Exception:
            texts.append("")
    return texts


def _flush_section(
    sections: List[SectionBlock],
    buffer: Dict[str, object],
) -> None:
    if not buffer:
        return
    text = "\n".join(buffer["text_parts"]).strip()  # type: ignore[index]
    if not text:
        return
    idx = len(sections) + 1
    sections.append(
        SectionBlock(
            block_id=f"sec-{idx}",
            title=str(buffer["title"]),
            level=1,
            text=text,
            parent_id=None,
            page_span=(buffer["start_page"], buffer["end_page"]),  # type: ignore[arg-type]
            metadata={
                "section_type": buffer["section_type"],
                "structure_confidence": buffer["confidence"],
            },
        )
    )


def _build_sections_from_headings(page_texts: List[str]) -> List[SectionBlock]:
    sections: List[SectionBlock] = []
    current: Dict[str, object] = {}

    def ensure_current(default_title: str, section_type: str, confidence: float, page: int) -> None:
        nonlocal current
        if current:
            return
        current = {
            "title": default_title,
            "section_type": section_type,
            "start_page": page,
            "end_page": page,
            "text_parts": [],
            "confidence": confidence,
        }

    for page_idx, page_text in enumerate(page_texts, start=1):
        lines = page_text.splitlines()
        for line in lines:
            heading = _match_section_heading(line)
            if heading:
                _flush_section(sections, current)
                title, section_type = heading
                current = {
                    "title": title,
                    "section_type": section_type,
                    "start_page": page_idx,
                    "end_page": page_idx,
                    "text_parts": [],
                    "confidence": 0.9,
                }
                continue
            ensure_current("Front Matter", "front_matter", 0.4, page_idx)
            current["text_parts"].append(line)  # type: ignore[index]
            current["end_page"] = page_idx
        if current:
            current["end_page"] = page_idx
    _flush_section(sections, current)
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
                metadata={"section_type": "page_chunk", "structure_confidence": 0.2},
            )
        )
    return sections


def _detect_table_figure_assets(page_texts: List[str]) -> List[AssetRef]:
    assets: List[AssetRef] = []
    for page_idx, text in enumerate(page_texts, start=1):
        for line in text.splitlines():
            for kind, pattern in ASSET_PATTERNS.items():
                for match in pattern.finditer(line):
                    label = _normalize_heading(match.group(0))
                    asset_id = f"{kind}-{len(assets) + 1:04d}"
                    assets.append(
                        AssetRef(
                            asset_id=asset_id,
                            kind=kind,
                            source=f"page:{page_idx}",
                            metadata={
                                "page": page_idx,
                                "label": label,
                                "context": line.strip()[:200],
                            },
                        )
                    )
    return assets


def _extract_doi_from_text(text: str) -> Optional[str]:
    match = DOI_PATTERN.search(text)
    if match:
        return match.group(0)
    return None


def _clean_author_name(candidate: str) -> Optional[str]:
    text = candidate.strip()
    text = re.sub(r"[\d\*†‡]+", "", text)
    text = re.sub(r"\s+", " ", text)
    if len(text.split()) < 2:
        return None
    if any(keyword in text.lower() for keyword in AFFILIATION_KEYWORDS):
        return None
    return text.strip()


def _authors_from_metadata(doc: fitz.Document) -> List[str]:
    value = doc.metadata.get("author")
    if not value:
        return []
    parts = re.split(r"[,;/]| and ", value)
    names: List[str] = []
    for part in parts:
        cleaned = _clean_author_name(part)
        if cleaned and cleaned not in names:
            names.append(cleaned)
    return names


def _authors_from_first_page(page_texts: List[str]) -> List[str]:
    if not page_texts:
        return []
    first_page = page_texts[0]
    lines = []
    for line in first_page.splitlines():
        clean = line.strip()
        if not clean:
            continue
        lower = clean.lower()
        if any(lower.startswith(keyword) for keyword in STOP_SECTION_KEYWORDS):
            break
        lines.append(clean)
    blob = " ".join(lines)[:2000]
    matches = NAME_PATTERN.findall(blob)
    names: List[str] = []
    for match in matches:
        cleaned = _clean_author_name(match)
        if cleaned and cleaned not in names:
            names.append(cleaned)
    return names


def _merge_author_lists(*lists: List[str]) -> List[str]:
    merged: List[str] = []
    for seq in lists:
        for name in seq:
            if name and name not in merged:
                merged.append(name)
    return merged


@dataclass
class PdfPaperIngestOptions:
    two_column: str = "auto"
    drop_references: bool = False


class PdfPaperIngestor:
    def __init__(self, opts: Optional[PdfPaperIngestOptions] = None):
        if fitz is None:
            raise ImportError("PyMuPDF (fitz) is required for pdf_research_paper workflow") from _fitz_import_error
        self.opts = opts or PdfPaperIngestOptions()
        self._reference_parser = ReferenceParser()

    def ingest(self, source: Path) -> IngestArtifact:
        if not source.exists():
            raise FileNotFoundError(source)
        doc = fitz.open(source)
        page_texts = _page_texts(doc)
        sections = _build_sections_from_headings(page_texts)
        if not sections:
            sections = _fallback_sections(page_texts)

        reference_sections = [sec for sec in sections if sec.metadata.get("section_type") == "references"]
        if self.opts.drop_references and reference_sections:
            sections = [sec for sec in sections if sec not in reference_sections]
            if not sections:
                sections = _fallback_sections(page_texts)
            reference_sections = []

        assets = _detect_table_figure_assets(page_texts)
        doi = _extract_doi_from_text(page_texts[0]) if page_texts else None
        references = self._parse_references(reference_sections)
        author_list = _merge_author_lists(
            _authors_from_metadata(doc),
            _authors_from_first_page(page_texts),
        )

        auto_tags = _generate_auto_tags(doc.metadata.get("title") or "", sections, page_texts)
        header = new_header(
            source_path=source,
            doc_type="pdf_research_paper",
            language=detect_language_simple("".join(page_texts[:3])),
            page_count=len(page_texts),
            extra={
                "title": doc.metadata.get("title"),
                "authors": author_list,
                "keywords": doc.metadata.get("keywords"),
                "creator": doc.metadata.get("creator"),
                "doi": doi,
                "tags": auto_tags,
            },
        )

        manifests = {
            "pages": [
                {"page": idx + 1, "chars": len(text)} for idx, text in enumerate(page_texts)
            ],
            "sections": [
                {
                    "block_id": sec.block_id,
                    "title": sec.title,
                    "section_type": sec.metadata.get("section_type"),
                    "page_span": sec.page_span,
                }
                for sec in sections
            ],
            "assets": [
                {
                    "asset_id": asset.asset_id,
                    "kind": asset.kind,
                    "page": asset.metadata.get("page"),
                    "label": asset.metadata.get("label"),
                }
                for asset in assets
            ],
            "references": [
                {
                    "ref_id": ref.ref_id,
                    "label": ref.label,
                    "section_block_id": ref.section_block_id,
                }
                for ref in references
            ],
        }

        raw_text = "\n\n".join(page_texts)
        artifact = IngestArtifact(
            header=header,
            sections=sections,
            assets=assets,
            references=references,
            raw_text=raw_text,
            manifests=manifests,
        )
        return artifact

    def _parse_references(self, reference_sections: List[SectionBlock]):
        if not reference_sections:
            return []
        return self._reference_parser.parse_sections(
            section_texts=[sec.text for sec in reference_sections],
            section_ids=[sec.block_id for sec in reference_sections],
            page_spans=[sec.page_span for sec in reference_sections],
        )


def run_cli(
    source: Path,
    output_dir: Path,
    opts: Optional[PdfPaperIngestOptions] = None,
) -> Path:
    ingestor = PdfPaperIngestor(opts)
    artifact = ingestor.ingest(source)
    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / f"{artifact.header.doc_id}.jsonl"
    save_artifact_jsonl(artifact, out_file)
    return out_file


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PDF research paper ingestion prototype")
    parser.add_argument("--source", required=True, help="Path to PDF research paper")
    parser.add_argument(
        "--output-dir",
        default="playground/rag_agent/output/ingest",
        help="Directory to write JSONL artifacts",
    )
    parser.add_argument(
        "--drop-references",
        action="store_true",
        help="If set, omit the references section from output",
    )
    return parser


if __name__ == "__main__":
    args = _build_parser().parse_args()
    opts = PdfPaperIngestOptions(drop_references=args.drop_references)
    output_path = run_cli(
        Path(args.source).resolve(),
        Path(args.output_dir).resolve(),
        opts=opts,
    )
    print(f"[ingest] wrote artifact: {output_path}")
def _detect_study_design(text: str) -> List[str]:
    lowered = text.lower()
    tags: List[str] = []
    for label, keywords in STUDY_DESIGN_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            tags.append(label)
    return tags


def _detect_conditions(text: str) -> List[str]:
    lowered = text.lower()
    return [word.title() for word in CONDITION_KEYWORDS if word in lowered]


def _detect_population(text: str) -> List[str]:
    lowered = text.lower()
    tags: List[str] = []
    for label, keywords in POPULATION_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            tags.append(label.title())
    return tags


def _generate_auto_tags(title: str, sections: List[SectionBlock], page_texts: List[str]) -> Dict[str, List[str]]:
    abstract = next((sec.text for sec in sections if sec.metadata.get("section_type") == "abstract"), "")
    context = " ".join(page_texts[:2])
    combined = " \n".join(filter(None, [title, abstract, context]))
    study_tags = _detect_study_design(combined)
    condition_tags = _detect_conditions(combined)
    population_tags = _detect_population(combined)
    tags: Dict[str, List[str]] = {}
    if study_tags:
        tags["study_design"] = sorted(set(study_tags))
    if condition_tags:
        tags["condition"] = sorted(set(condition_tags))
    if population_tags:
        tags["population"] = sorted(set(population_tags))
    return tags
