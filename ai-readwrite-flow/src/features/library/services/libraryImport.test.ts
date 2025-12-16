import { describe, expect, it, beforeEach } from 'vitest'
import { importFilesWeb } from './libraryImport'
import { findBookByHash, loadBooks, loadDeletedBooks, persistBook, restoreBook, softDeleteBook } from '../../../lib/db'
import { sha256Hex } from '../../../lib/sha256'

describe('libraryImport (web)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const fileLike = (bytes: Uint8Array, name: string) => {
    const file = {
      name,
      size: bytes.byteLength,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    }
    return file as unknown as File
  }

  it('dedupes by sha256 and reuses existing record', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4])
    const file = fileLike(bytes, 'sample.pdf')
    const hash = await sha256Hex(await file.arrayBuffer())

    await persistBook({
      id: 'existing',
      title: 'Existing',
      filePath: 'data:application/pdf;base64,AAAA',
      format: 'pdf',
      fileHash: hash,
      fileSize: bytes.byteLength,
      addedAt: 1,
    })

    const result = await importFilesWeb([file])
    expect(result.summary.deduped).toBe(1)
    expect(result.summary.imported).toBe(0)
    expect(result.imported[0]?.id).toBe('existing')
  })

  it('restores a trashed book when importing the same file', async () => {
    const bytes = new Uint8Array([5, 6, 7, 8])
    const file = fileLike(bytes, 'trash.pdf')
    const hash = await sha256Hex(await file.arrayBuffer())

    await persistBook({
      id: 'trashed',
      title: 'Trashed',
      filePath: 'data:application/pdf;base64,AAAA',
      format: 'pdf',
      fileHash: hash,
      fileSize: bytes.byteLength,
      addedAt: 1,
    })
    await softDeleteBook('trashed', 111)
    expect((await loadBooks()).length).toBe(0)
    expect((await loadDeletedBooks()).length).toBe(1)

    const result = await importFilesWeb([file])
    expect(result.summary.deduped).toBe(1)
    expect(result.imported[0]?.id).toBe('trashed')

    await restoreBook('trashed')
    expect((await loadBooks()).length).toBe(1)
  })

  it('imports a new file and persists by hash', async () => {
    const bytes = new Uint8Array([9, 8, 7])
    const file = fileLike(bytes, 'new.pdf')
    const hash = await sha256Hex(await file.arrayBuffer())

    const result = await importFilesWeb([file])
    expect(result.summary.imported).toBe(1)
    const found = await findBookByHash(hash)
    expect(found?.title).toBe('new')
  })

  it('allows different PDFs with the same filename', async () => {
    const a = fileLike(new Uint8Array([1, 1, 1, 1]), 'same-name.pdf')
    const b = fileLike(new Uint8Array([2, 2, 2, 2]), 'same-name.pdf')
    const hashA = await sha256Hex(await a.arrayBuffer())
    const hashB = await sha256Hex(await b.arrayBuffer())

    const result = await importFilesWeb([a, b])
    expect(result.summary.imported).toBe(2)
    expect(result.summary.deduped).toBe(0)

    const loaded = await loadBooks()
    expect(loaded.length).toBe(2)
    expect(loaded.map((x) => x.fileHash).sort()).toEqual([hashA, hashB].sort())
  })
})
