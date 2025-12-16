import { describe, expect, it } from 'vitest'
import { loadDraft, saveDraft } from './draftRepo'

describe('draftRepo (localStorage fallback)', () => {
  it('saves and loads a valid TipTap doc', async () => {
    const id = 'book:test'
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] }
    const ok = await saveDraft({ id, editorDoc: doc, updatedAt: Date.now() })
    expect(ok).toBe(true)
    const loaded = await loadDraft(id)
    expect(loaded?.id).toBe(id)
    expect((loaded?.editorDoc as { type?: unknown }).type).toBe('doc')
  })

  it('rejects non-doc payloads', async () => {
    const id = 'book:bad'
    const ok = await saveDraft({ id, editorDoc: { hello: 'world' }, updatedAt: Date.now() })
    expect(ok).toBe(false)
  })
})

