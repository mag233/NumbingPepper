import { invoke } from '@tauri-apps/api/core'
import { sha256Hex } from '../../../lib/sha256'
import { findBookByHash, persistBook, restoreBook, type BookRecord } from '../../../lib/db'
import { isTauri } from '../../../lib/isTauri'
import { extractPdfMetadataFromArrayBuffer, extractPdfMetadataFromDataUrl } from './pdfMetadata'

export type ImportSummary = { imported: number; deduped: number }
export type LibraryItem = BookRecord & { url?: string }

type TauriImportResult = {
  id: string
  file_name: string
  file_path: string
  file_hash: string
  file_size: number
  mtime: number
  format: string
  added_at: number
}

type TauriHashResult = {
  file_name: string
  file_hash: string
  file_size: number
  mtime: number
  format: string
}

const titleFromName = (name: string) => name.replace(/\.[^/.]+$/, '') || name

const mapImportToRecord = (entry: TauriImportResult): BookRecord => ({
  id: entry.id,
  title: titleFromName(entry.file_name),
  filePath: entry.file_path,
  format: entry.format,
  fileHash: entry.file_hash,
  fileSize: entry.file_size,
  mtime: entry.mtime,
  addedAt: entry.added_at,
  processedForSearch: false,
})

const withMetadata = (record: BookRecord, metadata: { title?: string; author?: string; year?: number; keywords?: string[] }): BookRecord => ({
  ...record,
  metadataTitle: metadata.title,
  metadataAuthor: metadata.author,
  metadataYear: metadata.year,
  metadataKeywords: metadata.keywords,
})

const extractMetadataForPath = async (filePath: string): Promise<{ title?: string; author?: string; year?: number; keywords?: string[] }> => {
  if (!isTauri()) return {}
  try {
    const data = await invoke<string>('read_file_base64', { path: filePath })
    const dataUrl = `data:application/pdf;base64,${data}`
    return await extractPdfMetadataFromDataUrl(dataUrl)
  } catch {
    return {}
  }
}

const base64FromBytes = (bytes: Uint8Array) => {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export const importFilesWeb = async (files: File[]): Promise<{ imported: LibraryItem[]; summary: ImportSummary }> => {
  const now = Date.now()
  const imported: LibraryItem[] = []
  let deduped = 0

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const metadata = await extractPdfMetadataFromArrayBuffer(buffer)
    const fileHash = await sha256Hex(buffer)
    const existing = await findBookByHash(fileHash)
    if (existing) {
      imported.push(existing)
      deduped += 1
      continue
    }
    const dataUrl = `data:application/pdf;base64,${base64FromBytes(new Uint8Array(buffer))}`
    const id = crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random()}`
    const record: LibraryItem = {
      id,
      title: titleFromName(file.name),
      filePath: dataUrl,
      format: 'pdf',
      fileHash,
      fileSize: file.size,
      addedAt: now,
      url: dataUrl,
    }
    const withMeta = withMetadata(record, metadata)
    imported.push(withMeta)
    void persistBook(withMeta)
  }

  return { imported, summary: { imported: imported.length - deduped, deduped } }
}

const dedupeHash = (hash: string, seen: Set<string>) => {
  if (!hash) return true
  if (seen.has(hash)) return true
  seen.add(hash)
  return false
}

const collectExistingByHash = async (hash: string, imported: LibraryItem[]) => {
  const existing = await findBookByHash(hash)
  if (!existing) return false
  if (existing.deletedAt) {
    await restoreBook(existing.id)
    imported.push({ ...existing, deletedAt: undefined })
    return true
  }
  imported.push(existing)
  return true
}

const collectPathsToCopy = async (paths: string[], imported: LibraryItem[], seen: Set<string>) => {
  const pathsToCopy: string[] = []
  let deduped = 0
  for (const path of paths) {
    const hashed = await invoke<TauriHashResult>('hash_file', { path })
    if (dedupeHash(hashed.file_hash, seen)) {
      deduped += 1
      continue
    }
    const exists = await collectExistingByHash(hashed.file_hash, imported)
    if (exists) {
      deduped += 1
      continue
    }
    pathsToCopy.push(path)
  }
  return { pathsToCopy, deduped }
}

const buildPayload = async (files: File[], imported: LibraryItem[], seen: Set<string>) => {
  const payload: { name: string; data_base64: string }[] = []
  let deduped = 0
  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const fileHash = await sha256Hex(buffer)
    if (dedupeHash(fileHash, seen)) {
      deduped += 1
      continue
    }
    const exists = await collectExistingByHash(fileHash, imported)
    if (exists) {
      deduped += 1
      continue
    }
    payload.push({ name: file.name, data_base64: base64FromBytes(new Uint8Array(buffer)) })
  }
  return { payload, deduped }
}

const persistResults = async (results: TauriImportResult[], imported: LibraryItem[]) => {
  for (const entry of results) {
    const record = mapImportToRecord(entry)
    const metadata = entry.format === 'pdf' ? await extractMetadataForPath(entry.file_path) : {}
    const withMeta = withMetadata(record, metadata)
    await persistBook(withMeta)
    imported.push(withMeta)
  }
}

export const importFilesTauri = async (
  filesWithoutPath: File[],
  paths: string[],
): Promise<{ imported: LibraryItem[]; summary: ImportSummary }> => {
  const imported: LibraryItem[] = []
  const seen = new Set<string>()
  const fromPaths = await collectPathsToCopy(paths, imported, seen)
  let results: TauriImportResult[] = []
  let deduped = fromPaths.deduped

  if (fromPaths.pathsToCopy.length) {
    results = await invoke<TauriImportResult[]>('copy_to_library', { paths: fromPaths.pathsToCopy })
  }

  await persistResults(results, imported)

  if (filesWithoutPath.length) {
    const next = await buildPayload(filesWithoutPath, imported, seen)
    deduped += next.deduped
    if (next.payload.length) {
      const payloadResults = await invoke<TauriImportResult[]>('copy_files_payload', { files: next.payload })
      await persistResults(payloadResults, imported)
    }
  }

  return { imported, summary: { imported: imported.length - deduped, deduped } }
}
