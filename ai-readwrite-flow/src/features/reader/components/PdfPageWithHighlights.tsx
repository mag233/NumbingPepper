import { Page } from 'react-pdf'
import { type Highlight, type HighlightRect } from '../types'

type Props = {
  pageNumber: number
  width?: number
  height?: number
  highlights: Highlight[]
  selectionRects?: HighlightRect[]
  onHitHighlight?: (pageNumber: number, x: number, y: number, clientX: number, clientY: number) => void
}

const highlightClass = (color: Highlight['color']) => {
  if (color === 'red') return 'bg-red-400/30 ring-1 ring-inset ring-red-300/40'
  if (color === 'blue') return 'bg-sky-400/25 ring-1 ring-inset ring-sky-300/35'
  return 'bg-amber-300/30 ring-1 ring-inset ring-amber-200/40'
}

const isBogusSelectionRect = (rect: HighlightRect) => {
  const area = rect.width * rect.height
  if (rect.height > 0.14) return true
  if (area > 0.22) return true
  if (rect.width > 0.92 && rect.height > 0.05) return true
  if (rect.width > 0.98 && rect.height > 0.02) return true
  return false
}

const filterSelectionRects = (rects: HighlightRect[] | undefined) =>
  rects?.filter((r) => !isBogusSelectionRect(r))

const PdfPageWithHighlights = ({ pageNumber, width, height, highlights, selectionRects, onHitHighlight }: Props) => {
  const filteredSelectionRects = filterSelectionRects(selectionRects)

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/60">
      <div className="flex justify-center p-2">
        <div
          data-arwf-page-host
          className="relative inline-block"
          onClick={(event) => {
            if (!onHitHighlight) return
            const host = event.currentTarget.getBoundingClientRect()
            if (!host.width || !host.height) return
            const x = (event.clientX - host.left) / host.width
            const y = (event.clientY - host.top) / host.height
            onHitHighlight(pageNumber, x, y, event.clientX, event.clientY)
          }}
        >
          {filteredSelectionRects?.length ? (
            <div className="pointer-events-none absolute inset-0 z-30 mix-blend-multiply">
              {filteredSelectionRects.map((r, idx) => (
                <div
                  key={`sel-${idx}`}
                  className="absolute rounded-sm bg-sky-400/25 ring-1 ring-inset ring-sky-300/35"
                  style={{
                    left: `${r.x * 100}%`,
                    top: `${r.y * 100}%`,
                    width: `${r.width * 100}%`,
                    height: `${r.height * 100}%`,
                  }}
                />
              ))}
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 z-20 mix-blend-multiply">
            {highlights.flatMap((h) =>
              h.contextRange.rects.map((r, rIdx) => (
                <div
                  key={`${h.id}-${rIdx}`}
                  className={`absolute ${highlightClass(h.color)} rounded-sm`}
                  style={{
                    left: `${r.x * 100}%`,
                    top: `${r.y * 100}%`,
                    width: `${r.width * 100}%`,
                    height: `${r.height * 100}%`,
                  }}
                />
              )),
            )}
          </div>
          <Page pageNumber={pageNumber} width={width} height={height} />
        </div>
      </div>
    </div>
  )
}

export default PdfPageWithHighlights
