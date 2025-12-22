import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadDraft, saveDraft } from './draftRepo'

vi.mock('../../../lib/sqlite', () => ({
  getSqlite: vi.fn(),
}))

import { getSqlite } from '../../../lib/sqlite'

const localKey = (id: string) => `ai-readwrite-flow-draft:${id}`

describe('draftRepo (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getSqlite).mockResolvedValue(null)
  })

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

  it('prefers newer local draft when sqlite is stale', async () => {
    const id = 'project:stale'
    const dbDoc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'FROM_DB' }] }] }
    const localDoc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'FROM_LOCAL' }] }] }

    const fakeDb = {
      path: 'mock.db',
      close: vi.fn(),
      select: vi.fn().mockResolvedValue([
        { id, editor_doc: JSON.stringify(dbDoc), updated_at: 100 },
      ]),
      execute: vi.fn(),
    }

    vi.mocked(getSqlite).mockResolvedValue(fakeDb)
    localStorage.setItem(localKey(id), JSON.stringify({ id, editorDoc: localDoc, updatedAt: 200 }))

    const loaded = await loadDraft(id)
    expect(JSON.stringify(loaded?.editorDoc)).toContain('FROM_LOCAL')
  })

  it('writes local draft even when sqlite is available', async () => {
    const id = 'project:write-through'
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] }
    const fakeDb = {
      path: 'mock.db',
      close: vi.fn(),
      select: vi.fn(),
      execute: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(getSqlite).mockResolvedValue(fakeDb)

    const ok = await saveDraft({ id, editorDoc: doc, updatedAt: 123 })
    expect(ok).toBe(true)
    expect(localStorage.getItem(localKey(id))).toContain('"updatedAt":123')
  })
})
