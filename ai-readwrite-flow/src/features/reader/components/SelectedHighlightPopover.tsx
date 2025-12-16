import { type Highlight, type HighlightColor } from '../types'
import HighlightPopover from './HighlightPopover'

type Props = {
  activeId: string | undefined
  selectedHighlight: Highlight | undefined
  popover: { x: number; y: number } | null
  onClose: () => void
  onAskAi: () => void
  onSummarize: () => void
  onExplain: () => void
  onGenerateQuestions: () => void
  onDelete: () => Promise<void>
  onSetColor: (color: HighlightColor) => Promise<void>
  onSetNote: (note: string | null) => Promise<void>
}

const SelectedHighlightPopover = ({
  activeId,
  selectedHighlight,
  popover,
  onClose,
  onAskAi,
  onSummarize,
  onExplain,
  onGenerateQuestions,
  onDelete,
  onSetColor,
  onSetNote,
}: Props) => {
  if (!activeId) return null
  if (!selectedHighlight) return null
  if (!popover) return null

  return (
    <HighlightPopover
      key={selectedHighlight.id}
      highlight={selectedHighlight}
      x={popover.x}
      y={popover.y}
      onClose={onClose}
      onAskAi={onAskAi}
      onSummarize={onSummarize}
      onExplain={onExplain}
      onGenerateQuestions={onGenerateQuestions}
      onDelete={onDelete}
      onSetColor={onSetColor}
      onSetNote={onSetNote}
    />
  )
}

export default SelectedHighlightPopover
