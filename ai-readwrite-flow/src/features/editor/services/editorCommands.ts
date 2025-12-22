import type { Editor as TipTapEditor, JSONContent } from '@tiptap/core'
import { TextSelection } from 'prosemirror-state'

export const insertPlainTextAsParagraphs = (editor: TipTapEditor, text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return
  const paragraphs = normalized.split(/\n{2,}/g)
  const content: JSONContent[] = paragraphs.map((p) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: p }],
  }))
  editor.chain().focus().insertContent(content).run()
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
