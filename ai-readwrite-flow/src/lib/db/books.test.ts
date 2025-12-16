import { describe, expect, it, beforeEach } from 'vitest'
import { findBookByHash, loadBooks, loadDeletedBooks, persistBook, removeBook, restoreBook, softDeleteBook, updateLastOpenedAt } from '../db'

describe('books repo (local fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('finds a book by hash and removes it', async () => {
    await persistBook({
      id: 'a',
      title: 'A',
      filePath: 'data:a',
      format: 'pdf',
      fileHash: 'hash-a',
      fileSize: 10,
      addedAt: 1,
    })
    await persistBook({
      id: 'b',
      title: 'B',
      filePath: 'data:b',
      format: 'pdf',
      fileHash: 'hash-b',
      fileSize: 10,
      addedAt: 2,
    })

    const found = await findBookByHash('hash-b')
    expect(found?.id).toBe('b')

    await removeBook('b')
    const missing = await findBookByHash('hash-b')
    expect(missing).toBeUndefined()
  })

  it('orders by lastOpenedAt then addedAt', async () => {
    await persistBook({
      id: 'a',
      title: 'A',
      filePath: 'data:a',
      format: 'pdf',
      fileHash: 'hash-a',
      fileSize: 10,
      addedAt: 10,
    })
    await persistBook({
      id: 'b',
      title: 'B',
      filePath: 'data:b',
      format: 'pdf',
      fileHash: 'hash-b',
      fileSize: 10,
      addedAt: 20,
    })

    await updateLastOpenedAt('a', 999)
    const ordered = await loadBooks()
    expect(ordered[0]?.id).toBe('a')
    expect(ordered[1]?.id).toBe('b')
  })

  it('soft deletes into trash and restores', async () => {
    await persistBook({
      id: 'a',
      title: 'A',
      filePath: 'data:a',
      format: 'pdf',
      fileHash: 'hash-a',
      fileSize: 10,
      addedAt: 1,
    })

    await softDeleteBook('a', 123)
    const visible = await loadBooks()
    expect(visible.length).toBe(0)
    const trash = await loadDeletedBooks()
    expect(trash[0]?.id).toBe('a')

    await restoreBook('a')
    const restored = await loadBooks()
    expect(restored[0]?.id).toBe('a')
  })
})
