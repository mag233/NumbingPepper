import { useEffect } from 'react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import useWriterSelectionApplyStore from '../stores/writerSelectionApplyStore'
import {
  insertPlainTextAsParagraphsAt,
  insertPlainTextAsParagraphsAtWithLeadingBlankLine,
  replaceRangeWithPlainTextAsParagraphs,
  type EditorInsertedRange,
} from '../services/editorCommands'

type Args = {
  editor: TipTapEditor | null
  onApplied: (range: EditorInsertedRange | null) => void
}

export const useWriterSelectionApplyEffect = ({ editor, onApplied }: Args) => {
  const consumeSelectionApply = useWriterSelectionApplyStore((s) => s.consume)
  const pendingSelectionApply = useWriterSelectionApplyStore((s) => s.pending)

  useEffect(() => {
    if (!pendingSelectionApply) return
    if (!editor) return
    const req = consumeSelectionApply()
    if (!req) return
    if (req.mode === 'replace') {
      const range = replaceRangeWithPlainTextAsParagraphs(editor, {
        from: req.selection.from,
        to: req.selection.to,
        text: req.text,
      })
      onApplied(range)
      return
    }
    if (req.insertLeadingBlankLine) {
      const range = insertPlainTextAsParagraphsAtWithLeadingBlankLine(editor, { pos: req.selection.to, text: req.text })
      onApplied(range)
      return
    }
    const range = insertPlainTextAsParagraphsAt(editor, { pos: req.selection.to, text: req.text })
    onApplied(range)
  }, [consumeSelectionApply, editor, onApplied, pendingSelectionApply])
}

