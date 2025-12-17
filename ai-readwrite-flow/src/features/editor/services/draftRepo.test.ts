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

  it('keeps drafts isolated by id', async () => {
    const idA = 'project:a'
    const idB = 'project:b'
    const docA = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AAA' }] }] }
    const docB = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'BBB' }] }] }
    await saveDraft({ id: idA, editorDoc: docA, updatedAt: Date.now() })
    await saveDraft({ id: idB, editorDoc: docB, updatedAt: Date.now() })
    const a = await loadDraft(idA)
    const b = await loadDraft(idB)
    expect(a?.id).toBe(idA)
    expect(b?.id).toBe(idB)
    expect(JSON.stringify(a?.editorDoc)).toContain('AAA')
    expect(JSON.stringify(b?.editorDoc)).toContain('BBB')
  })
})
