"""Synchronous helpers that orchestrate ingestion -> preprocess -> chunk -> embed."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from ragx.core.controllers.pipeline_state import (
    ArtifactHandle,
    ChunkState,
    EmbeddingState,
    IngestState,
    PipelineState,
    PreprocessState,
)
from ragx.core.services.chunker import Chunk, ChunkerOptions, ResearchPaperChunker
from ragx.core.services.embed import EmbeddingJob, EmbeddingProvider, EmbeddingResult
from ragx.core.services.pdf_paper import PdfPaperIngestOptions, PdfPaperIngestor
from ragx.core.services.pdf_textbook import PdfTextbookIngestor
from ragx.core.services.preprocess import DocumentPreprocessor, PreprocessOptions, PreprocessResult


class PipelineRunner:
    """Thin orchestration layer for ingestion/preprocess/chunk/embed steps."""

    def __init__(
        self,
        *,
        pdf_textbook_cls: type[PdfTextbookIngestor] | None = None,
        pdf_paper_cls: type[PdfPaperIngestor] | None = None,
        pdf_paper_options: PdfPaperIngestOptions | None = None,
        preprocessor: DocumentPreprocessor | None = None,
        chunker: ResearchPaperChunker | None = None,
    ) -> None:
        self._pdf_textbook_cls = pdf_textbook_cls or PdfTextbookIngestor
        self._pdf_paper_cls = pdf_paper_cls or PdfPaperIngestor
        self._pdf_paper_options = pdf_paper_options
        self._preprocessor = preprocessor or DocumentPreprocessor()
        self._chunker = chunker or ResearchPaperChunker(ChunkerOptions())
        self.state = PipelineState()

    # ------------------------------------------------------------------ ingestion
    def ingest(
        self,
        *,
        project_id: str,
        workflow: str,
        source_path: Path,
        content_hash: str | None = None,
    ) -> IngestState:
        """Run the configured ingestor synchronously."""
        state = self.state.ingest
        state.as_running(f"Ingesting {source_path.name}")
        handle = ArtifactHandle(
            project_id=project_id,
            doc_id="",
            workflow=workflow,
            source_path=source_path,
            content_hash=content_hash,
        )
        state.handle = handle
        ingestor = self._resolve_ingestor(workflow)
        if ingestor is None:
            return state.as_error(f"No ingestor available for workflow '{workflow}'")
        artifact = ingestor.ingest(source_path)
        handle.doc_id = getattr(artifact.header, "doc_id", "")
        state.artifact = artifact
        return state.as_success(f"Ingested {handle.doc_id or source_path.name}")

    def _resolve_ingestor(self, workflow: str):
        if workflow == "pdf_textbook" and self._pdf_textbook_cls:
            return self._pdf_textbook_cls()
        if workflow == "pdf_research_paper" and self._pdf_paper_cls:
            return self._pdf_paper_cls(self._pdf_paper_options)
        return None

    # ------------------------------------------------------------------ preprocess
    def preprocess(
        self,
        *,
        artifact_handle: ArtifactHandle,
        options: PreprocessOptions | None = None,
    ) -> PreprocessState:
        """Preprocess previously ingested artifact."""
        state = self.state.preprocess
        state.artifact = artifact_handle
        state.as_running("Preprocessing artifact")
        artifact = self.state.ingest.artifact
        if artifact is None:
            return state.as_error("No artifact available for preprocessing.")
        result = self._preprocessor.preprocess(artifact, options=options)
        state.result = result
        state.stats_raw = dict(result.stats_raw)
        state.stats_clean = dict(result.stats_clean)
        state.stats_deep = dict(result.stats_deep_clean)
        state.removal_log = list(result.removed_sections)
        return state.as_success("Preprocessing complete")

    # ------------------------------------------------------------------ chunking
    def chunkify(
        self,
        *,
        artifact_handle: ArtifactHandle,
        preprocess_result: PreprocessResult | None = None,
        run_id: str,
        excluded_sections: Iterable[str] | None = None,
    ) -> ChunkState:
        """Generate chunks for downstream embedding."""
        state = self.state.chunking
        state.artifact = artifact_handle
        state.as_running("Chunking document")
        artifact = self.state.ingest.artifact
        preprocess = preprocess_result or self.state.preprocess.result
        if artifact is None or preprocess is None:
            return state.as_error("Artifact/preprocess result missing; cannot chunk.")
        chunks = self._chunker.chunkify(
            artifact,
            preprocess,
            project_id=artifact_handle.project_id,
            run_id=run_id,
            excluded_sections=excluded_sections,
        )
        state.chunks = chunks
        state.run_id = run_id
        return state.as_success(f"Generated {len(chunks)} chunks")

    # ------------------------------------------------------------------ embedding
    def build_embedding_jobs(self, chunks: Sequence[Chunk]) -> list[EmbeddingJob]:
        return [
            EmbeddingJob(
                chunk_id=chunk.chunk_id,
                text=chunk.text,
                metadata=dict(chunk.metadata),
            )
            for chunk in chunks
        ]

    def embed(
        self,
        *,
        artifact_handle: ArtifactHandle,
        provider: EmbeddingProvider,
        chunks: Sequence[Chunk] | None = None,
    ) -> EmbeddingState:
        state = self.state.embeddings
        state.artifact = artifact_handle
        state.as_running(f"Embedding chunks via {provider.__class__.__name__}")
        chunk_list = list(chunks) if chunks is not None else list(self.state.chunking.chunks)
        if not chunk_list:
            return state.as_error("No chunks to embed.")
        jobs = self.build_embedding_jobs(chunk_list)
        results: list[EmbeddingResult] = provider.embed(jobs)
        state.results = results
        state.provider = getattr(provider, "provider_name", provider.__class__.__name__)
        state.model = getattr(provider, "model_name", "")
        return state.as_success(f"Embedded {len(results)} chunks")


__all__ = ["PipelineRunner"]
