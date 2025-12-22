import type { BookRecord } from './books'
import { bookRecordSchema } from './booksSchemas'

const LOCAL_LIBRARY_KEY = 'ai-readwrite-flow-library'

export const readLocalBooks = (): BookRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LIBRARY_KEY)
    if (!raw) return []
    const json: unknown = JSON.parse(raw)
    if (!Array.isArray(json)) return []
    const out: BookRecord[] = []
    for (const entry of json) {
      const parsed = bookRecordSchema.safeParse(entry)
      if (parsed.success) out.push(parsed.data)
    }
    return out
  } catch (error) {
    console.warn('Local library read failed', error)
    return []
  }
}

export const writeLocalBooks = (books: BookRecord[]) => {
  try {
    localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(books))
  } catch (error) {
    console.warn('Local library write failed', error)
  }
}

