import type { Editor as TipTapEditor, JSONContent } from '@tiptap/core'
import { TextSelection } from 'prosemirror-state'

const plainTextToParagraphNodes = (text: string): JSONContent[] => {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const paragraphs = normalized.split(/\n{2,}/g)
  return paragraphs.map((p) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: p }],
  }))
}

export const insertPlainTextAsParagraphs = (editor: TipTapEditor, text: string) => {
  const content = plainTextToParagraphNodes(text)
  if (!content.length) return
  editor.chain().focus().insertContent(content).run()
}

export const insertPlainTextAsParagraphsAt = (editor: TipTapEditor, args: { pos: number; text: string }) => {
  const content = plainTextToParagraphNodes(args.text)
  if (!content.length) return
  editor.chain().focus().insertContentAt(args.pos, content).run()
}

export const insertPlainTextAsParagraphsAtWithLeadingBlankLine = (
  editor: TipTapEditor,
  args: { pos: number; text: string },
) => {
  const content = plainTextToParagraphNodes(args.text)
  if (!content.length) return
  const withGap: JSONContent[] = [{ type: 'paragraph' }, ...content]
  editor.chain().focus().insertContentAt(args.pos, withGap).run()
}

export const replaceRangeWithPlainTextAsParagraphs = (
  editor: TipTapEditor,
  args: { from: number; to: number; text: string },
) => {
  const content = plainTextToParagraphNodes(args.text)
  if (!content.length) return
  editor.chain().focus().insertContentAt({ from: args.from, to: args.to }, content).run()
}

const normalizeNeedleCandidates = (args: { needle: string; title: string; level: number }) => {
  const candidates: string[] = []
  const title = args.title.trim()
  if (!title) return candidates
  if (args.needle.trim()) candidates.push(args.needle.trim())
  for (let level = 1; level <= 6; level += 1) {
    candidates.push(`${'#'.repeat(level)} ${title}`)
  }
  candidates.push(title)
  return Array.from(new Set(candidates))
}

const findTextPos = (editor: TipTapEditor, needle: string): number | null => {
  const wanted = needle.trim()
  if (!wanted) return null
  let found: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found !== null) return false
    if (!node.isText) return true
    const text = node.text ?? ''
    const idx = text.indexOf(wanted)
    if (idx >= 0) {
      found = pos + idx
      return false
    }
    return true
  })
  return found
}

export const scrollEditorToNeedle = (editor: TipTapEditor, args: { needle: string; title: string; level: number }) => {
  const candidates = normalizeNeedleCandidates(args)
  const pos = candidates.map((c) => findTextPos(editor, c)).find((p): p is number => typeof p === 'number')
  if (typeof pos !== 'number') return false
  const safePos = Math.min(Math.max(pos, 0), editor.state.doc.content.size)
  editor.commands.focus()
  editor.commands.setTextSelection(safePos)
  const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, safePos)).scrollIntoView()
  editor.view.dispatch(tr)
  return true
}
