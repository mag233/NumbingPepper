import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import type { Node as PMNode } from 'prosemirror-model'
import { writerInsertFlashExtension, writerInsertFlashPluginKey } from './writerInsertFlashExtension'

const findTextRange = (doc: PMNode, needle: string): { from: number; to: number } => {
  let found: { from: number; to: number } | null = null
  doc.descendants((node, pos) => {
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

describe('writerInsertFlashExtension', () => {
  let editor: Editor | null = null

  afterEach(() => {
    editor?.destroy()
    editor = null
  })

  it('sets and clears decorations via commands', () => {
    editor = new Editor({
      extensions: [StarterKit, writerInsertFlashExtension],
      content: '<p>Hello world</p>',
    })

    const range = findTextRange(editor.state.doc, 'world')
    editor.commands.setWriterInsertFlash(range)

    const set = writerInsertFlashPluginKey.getState(editor.state)
    expect(set?.find().length ?? 0).toBeGreaterThan(0)

    editor.commands.clearWriterInsertFlash()
    const cleared = writerInsertFlashPluginKey.getState(editor.state)
    expect(cleared?.find().length ?? 0).toBe(0)
  })
})
