import { Page } from 'react-pdf'
import { type Highlight } from '../types'

type Props = {
  pageNumber: number
  width: number
  highlights: Highlight[]
}

const highlightClass = (color: Highlight['color']) => {
  if (color === 'red') return 'bg-red-400/30 ring-1 ring-red-300/40'
  if (color === 'blue') return 'bg-sky-400/25 ring-1 ring-sky-300/35'
  return 'bg-amber-300/30 ring-1 ring-amber-200/40'
}

const PdfPageWithHighlights = ({ pageNumber, width, highlights }: Props) => (
  <div className="relative rounded-lg border border-slate-800/60 bg-slate-900/60 p-2">
    <div className="pointer-events-none absolute inset-2">
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
    <Page pageNumber={pageNumber} width={width} />
  </div>
)

export default PdfPageWithHighlights

