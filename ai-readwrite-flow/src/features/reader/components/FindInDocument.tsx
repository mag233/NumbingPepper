import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import useReaderStore from '../../../stores/readerStore'
import useLibraryStore from '../../../stores/libraryStore'
import { usePdfFileSource } from '../hooks/usePdfFileSource'
import { extractPageText, loadPdfDocument, type PdfDocumentProxyLike } from '../services/pdfText'
import { searchPageText, type PdfSearchHit } from '../services/pdfSearch'

type Props = {
  scrollMode: 'paged' | 'continuous'
  onToggleScrollMode: () => void
  onJump?: (page: number) => void
}

const navButton =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/60 bg-surface-raised/60 px-2 py-1 text-xs text-ink-primary hover:border-accent'

const FindInDocument = ({ scrollMode, onToggleScrollMode, onJump }: Props) => {
  const { pageCount, requestJump, setFindQuery, bumpFindToken, setFindActiveHit } = useReaderStore()
  const { items, activeId } = useLibraryStore()
  const activeItem = useMemo(() => items.find((item) => item.id === activeId), [items, activeId])
  const { fileSrc } = usePdfFileSource(activeItem)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<PdfSearchHit[]>([])
  const [activeHitIdx, setActiveHitIdx] = useState(0)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const docRef = useRef<{ src: string; doc: PdfDocumentProxyLike } | null>(null)

  const jumpTo = (page: number) => {
    requestJump(page)
    onJump?.(page)
  }

  const getDoc = async () => {
    if (!fileSrc) throw new Error('No PDF loaded')
    if (docRef.current?.src === fileSrc) return docRef.current.doc
    const doc = await loadPdfDocument(fileSrc)
    docRef.current = { src: fileSrc, doc }
    return doc
  }

  const gotoHit = (index: number) => {
    if (!hits.length) return
    const next = (index + hits.length) % hits.length
    const hit = hits[next]
    if (!hit) return
    setActiveHitIdx(next)
    setFindActiveHit({ page: hit.page, ordinal: hit.ordinal })
    bumpFindToken()
    jumpTo(hit.page)
  }

  const resetSearchState = (q: string) => {
    setFindQuery(q)
    setHits([])
    setActiveHitIdx(0)
    setFindActiveHit(null)
    setSearchError(null)
  }

  const runSearch = async () => {
    const q = query.trim()
    resetSearchState(q)
    if (!q) return
    if (scrollMode === 'continuous') onToggleScrollMode()
    if (!fileSrc) {
      setSearchError('No PDF selected')
      return
    }

    setSearching(true)
    try {
      const doc = await getDoc()
      const totalPages = Math.min(pageCount || doc.numPages, doc.numPages)
      const found: PdfSearchHit[] = []
      for (let page = 1; page <= totalPages; page += 1) {
        const text = await extractPageText(doc, page)
        const pageHits = searchPageText(text, q, page, 200 - found.length)
        found.push(...pageHits)
        if (found.length >= 200) break
      }
      setHits(found)
      const first = found[0]
      if (!first) return
      setActiveHitIdx(0)
      setFindActiveHit({ page: first.page, ordinal: first.ordinal })
      bumpFindToken()
      jumpTo(first.page)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Search className="size-4" />
        <span>Find</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search text..."
          className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-sm text-ink-primary focus:border-accent focus:outline-none"
        />
        <button className={navButton} onClick={() => void runSearch()} disabled={searching}>
          Find
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className={navButton} onClick={() => gotoHit(activeHitIdx - 1)} disabled={!hits.length}>
          Prev
        </button>
        <button className={navButton} onClick={() => gotoHit(activeHitIdx + 1)} disabled={!hits.length}>
          Next
        </button>
        <span className="text-xs text-ink-muted">
          {hits.length ? `${activeHitIdx + 1}/${hits.length}` : searching ? 'Searching...' : '0'}
        </span>
      </div>
      {hits[activeHitIdx]?.snippet && (
        <p className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 p-2 text-xs text-ink-primary">
          {hits[activeHitIdx]!.snippet}
        </p>
      )}
      {searchError && <p className="text-xs text-status-warning">{searchError}</p>}
      <p className="text-xs text-ink-muted">Tip: Find runs in paged scroll for stability.</p>
    </div>
  )
}

export default FindInDocument
