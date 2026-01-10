import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import {
  insertPlainTextAsParagraphsAtWithLeadingBlankLine,
  replaceRangeWithPlainTextAsParagraphs,
} from './editorCommands'

const createEditor = () =>
  new Editor({
    extensions: [StarterKit],
    content: '<p>Hello world</p><p>Second paragraph</p>',
  })

const findTextRange = (editor: Editor, needle: string): { from: number; to: number } => {
  let found: { from: number; to: number } | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found) return false
    if (!node.isText) return true
    const text = node.text ?? ''
    const idx = text.indexOf(needle)
    if (idx < 0) return true
    const from = pos + idx
    found = { from, to: from + needle.length }
    return false
  })
  if (!found) throw new Error(`Could not find "${needle}" in doc`)
  return found
}

describe('editorCommands', () => {
  it('replace is a single undo step', () => {
    const editor = createEditor()
    try {
      const original = editor.getHTML()
      const range = findTextRange(editor, 'world')

      replaceRangeWithPlainTextAsParagraphs(editor, { from: range.from, to: range.to, text: 'planet' })
      editor.commands.undo()

      expect(editor.getHTML()).toBe(original)
    } finally {
      editor.destroy()
    }
  })

  it('insert below adds a blank paragraph and is a single undo step', () => {
    const editor = createEditor()
    try {
      const original = editor.getHTML()
      const range = findTextRange(editor, 'world')

      insertPlainTextAsParagraphsAtWithLeadingBlankLine(editor, { pos: range.to, text: 'Inserted' })

      const doc = editor.getJSON()
      expect(doc.content?.[1]?.type).toBe('paragraph')
      expect(doc.content?.[1]?.content ?? []).toHaveLength(0)

      editor.commands.undo()
      expect(editor.getHTML()).toBe(original)
    } finally {
      editor.destroy()
    }
  })
})
