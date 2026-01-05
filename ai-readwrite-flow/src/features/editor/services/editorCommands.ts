import type { Editor as TipTapEditor } from '@tiptap/core'
import { Fragment, Slice, type Node as PMNode } from 'prosemirror-model'
import { TextSelection, type Transaction } from 'prosemirror-state'

export type EditorInsertedRange = { from: number; to: number }

const normalizePlainText = (text: string) => text.replace(/\r\n/g, '\n').trim()

const plainTextToParagraphNodes = (editor: TipTapEditor, text: string): PMNode[] => {
  const normalized = normalizePlainText(text)
  if (!normalized) return []
  const paragraph = editor.schema.nodes.paragraph
  if (!paragraph) return []
  const paragraphs = normalized.split(/\n{2,}/g)
  return paragraphs.map((p) => paragraph.create(null, p ? editor.schema.text(p) : undefined))
}

const nodesToSlice = (nodes: PMNode[]) => new Slice(Fragment.fromArray(nodes), 0, 0)

const applySingleHistoryTransaction = (editor: TipTapEditor, build: (tr: Transaction) => void) => {
  editor.commands.command(({ tr, dispatch }) => {
    build(tr)
    tr.setMeta('closeHistory', true)
    dispatch?.(tr)
    return true
  })
}

export const insertPlainTextAsParagraphs = (editor: TipTapEditor, text: string) => {
  const nodes = plainTextToParagraphNodes(editor, text)
  if (!nodes.length) return
  const slice = nodesToSlice(nodes)
  editor.commands.focus()
  const pos = editor.state.selection.to
  applySingleHistoryTransaction(editor, (tr) => {
    tr.replaceRange(pos, pos, slice)
  })
}

export const insertPlainTextAsParagraphsAt = (editor: TipTapEditor, args: { pos: number; text: string }) => {
  const nodes = plainTextToParagraphNodes(editor, args.text)
  if (!nodes.length) return null
  const slice = nodesToSlice(nodes)
  editor.commands.focus()
  applySingleHistoryTransaction(editor, (tr) => {
    tr.replaceRange(args.pos, args.pos, slice)
  })
  return { from: args.pos, to: args.pos + slice.content.size } satisfies EditorInsertedRange
}

export const insertPlainTextAsParagraphsAtWithLeadingBlankLine = (
  editor: TipTapEditor,
  args: { pos: number; text: string },
) => {
  const paragraph = editor.schema.nodes.paragraph
  if (!paragraph) return null
  const nodes = plainTextToParagraphNodes(editor, args.text)
  if (!nodes.length) return null
  const sliceNodes = [paragraph.create(), ...nodes]
  const slice = nodesToSlice(sliceNodes)
  editor.commands.focus()
  applySingleHistoryTransaction(editor, (tr) => {
    tr.replaceRange(args.pos, args.pos, slice)
  })
  return { from: args.pos, to: args.pos + slice.content.size } satisfies EditorInsertedRange
}

export const replaceRangeWithPlainTextAsParagraphs = (
  editor: TipTapEditor,
  args: { from: number; to: number; text: string },
) => {
  const nodes = plainTextToParagraphNodes(editor, args.text)
  if (!nodes.length) return null
  const slice = nodesToSlice(nodes)
  editor.commands.focus()
  applySingleHistoryTransaction(editor, (tr) => {
    tr.replaceRange(args.from, args.to, slice)
  })
  return { from: args.from, to: args.from + slice.content.size } satisfies EditorInsertedRange
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

export const scrollEditorToRange = (editor: TipTapEditor, args: { from: number; to: number }) => {
  const max = editor.state.doc.content.size
  const from = Math.min(Math.max(args.from, 0), max)
  const to = Math.min(Math.max(args.to, from), max)
  editor.commands.focus()
  const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)).scrollIntoView()
  editor.view.dispatch(tr)
}
