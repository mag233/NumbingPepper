"""Lexical/BM25/hybrid search helpers for retrieval."""
from __future__ import annotations

import re
from typing import Dict, List, Sequence, TYPE_CHECKING

from .retrieval_types import ChunkRecord, RetrievalResult

if TYPE_CHECKING:  # pragma: no cover
    from .retrieval import ChunkStore

try:  # Optional BM25 dependency
    from rank_bm25 import BM25Okapi  # type: ignore
except Exception:  # pragma: no cover
    BM25Okapi = None  # type: ignore


def lexical_search(chunk_store: "ChunkStore", query: str, top_k: int = 5) -> List[RetrievalResult]:
    terms = [token for token in re.split(r"[^0-9a-zA-Z]+", query.lower()) if token]
    if not terms:
        return []
    records = []
    for chunk in chunk_store.all():
        haystack = chunk.text.lower()
        score = 0.0
        for term in terms:
            score += haystack.count(term)
        if score <= 0:
            continue
        section = str(
            chunk.metadata.get("section_type")
            or chunk.metadata.get("section_title")
            or ""
        )
        records.append(
            RetrievalResult(
                chunk_id=chunk.chunk_id,
                doc_id=chunk.doc_id,
                text=chunk.text,
                section=section,
                score=float(score),
                source="lexical",
                metadata=chunk.metadata.copy(),
            )
        )
    records.sort(key=lambda item: (-item.score, item.chunk_id))
    return records[:top_k]


def hybrid_fuse(vector_results: Sequence[RetrievalResult], lexical_results: Sequence[RetrievalResult]) -> List[RetrievalResult]:
    if not vector_results:
        return list(lexical_results)
    if not lexical_results:
        return list(vector_results)
    combined: Dict[str, RetrievalResult] = {}
    for result in vector_results:
        combined[result.chunk_id] = RetrievalResult(
            chunk_id=result.chunk_id,
            doc_id=result.doc_id,
            text=result.text,
            section=result.section,
            score=result.score,
            source="vector",
            metadata=result.metadata.copy(),
        )
    total = len(lexical_results)
    for rank, result in enumerate(lexical_results, start=1):
        weight = 1.0 - (rank - 1) / max(total, 1)
        score_boost = weight * 0.3  # lexical carries smaller influence
        if result.chunk_id in combined:
            combined[result.chunk_id].score += score_boost
            combined[result.chunk_id].source = "hybrid"
        else:
            combined[result.chunk_id] = RetrievalResult(
                chunk_id=result.chunk_id,
                doc_id=result.doc_id,
                text=result.text,
                section=result.section,
                score=score_boost,
                source="hybrid",
                metadata=result.metadata.copy(),
            )
    merged = list(combined.values())
    merged.sort(key=lambda item: (-item.score, item.chunk_id))
    return merged


def bm25_search(chunk_store: "ChunkStore", query: str, top_k: int = 5) -> List[RetrievalResult]:
    if BM25Okapi is None:  # pragma: no cover - optional dependency
        raise RuntimeError("rank-bm25 is not installed. Run `pip install rank-bm25`.")
    corpus_tokens: List[List[str]] = []
    chunk_refs: List[ChunkRecord] = []
    pattern = re.compile(r"[0-9a-zA-Z]+")
    for chunk in chunk_store.all():
        tokens = [tok.lower() for tok in pattern.findall(chunk.text)]
        if not tokens:
            continue
        corpus_tokens.append(tokens)
        chunk_refs.append(chunk)
    if not corpus_tokens:
        return []
    bm25 = BM25Okapi(corpus_tokens)
    query_tokens = [tok.lower() for tok in pattern.findall(query)]
    if not query_tokens:
        return []
    scores = bm25.get_scores(query_tokens)
    ranked = sorted(
        zip(chunk_refs, scores),
        key=lambda pair: (-pair[1], pair[0].chunk_id),
    )
    results: List[RetrievalResult] = []
    for chunk, score in ranked[:top_k]:
        section = str(
            chunk.metadata.get("section_type")
            or chunk.metadata.get("section_title")
            or ""
        )
        results.append(
            RetrievalResult(
                chunk_id=chunk.chunk_id,
                doc_id=chunk.doc_id,
                text=chunk.text,
                section=section,
                score=float(score),
                source="bm25",
                metadata=chunk.metadata.copy(),
            )
        )
    return results


__all__ = ["lexical_search", "hybrid_fuse", "bm25_search"]
