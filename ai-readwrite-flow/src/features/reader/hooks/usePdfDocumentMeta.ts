import { useCallback } from 'react'
import { extractPdfOutline } from '../services/pdfOutline'
import { tryGetPageLabels } from '../services/pageLabels'

type Args = {
  fileSrc: string | null
  activeItem: unknown
  setPageCount: (count: number) => void
  setRenderedPages: (value: number) => void
  setDocError: (value: { src: string; message: string } | null) => void
  setOutlineLoading: () => void
  setOutline: (outline: Array<{ title: string; page: number | null; depth: number }>) => void
  setOutlineError: (message: string) => void
  setPageLabels: (labels: Array<string | null> | null) => void
}

export const usePdfDocumentMeta = (args: Args) => {
  const {
    fileSrc,
    activeItem,
    setDocError,
    setOutline,
    setOutlineError,
    setOutlineLoading,
    setPageCount,
    setPageLabels,
    setRenderedPages,
  } = args

  const onLoadError = useCallback(
    (error: Error) => {
      console.error('[ReaderPane] onLoadError', { error, fileSrc, activeItem })
      setDocError({
        src: String(fileSrc ?? ''),
        message: `${error.message} | source: ${String(fileSrc ?? 'none')}`,
      })
    },
    [activeItem, fileSrc, setDocError],
  )

  const onSourceError = useCallback(
    (error: Error) => {
      console.error('[ReaderPane] onSourceError', { error, fileSrc, activeItem })
      setDocError({
        src: String(fileSrc ?? ''),
        message: `${error.message} | source: ${String(fileSrc ?? 'none')}`,
      })
    },
    [activeItem, fileSrc, setDocError],
  )

  const onLoadSuccess = useCallback(
    (doc: { numPages: number }) => {
      setPageCount(doc.numPages)
      setRenderedPages(Math.min(3, doc.numPages))
      setDocError(null)

      setOutlineLoading()
      void extractPdfOutline(doc)
        .then((outline) => setOutline(outline))
        .catch((error: unknown) =>
          setOutlineError(error instanceof Error ? error.message : 'Outline extraction failed'),
        )

      setPageLabels(null)
      void tryGetPageLabels(doc, doc.numPages).then((labels) => setPageLabels(labels))
    },
    [setDocError, setOutline, setOutlineError, setOutlineLoading, setPageCount, setPageLabels, setRenderedPages],
  )

  return { onLoadError, onLoadSuccess, onSourceError }
}

