export type { StoredSettings } from './db/settings'
export { loadSettingsFromStore, persistSettings } from './db/settings'

export type { BookRecord, LastReadPosition } from './db/books'
export {
  findBookByHash,
  loadBooks,
  loadDeletedBooks,
  persistBook,
  removeBook,
  restoreBook,
  softDeleteBook,
  updateLastOpenedAt,
  updateLastReadPosition,
} from './db/books'

export {
  deleteHighlight,
  loadHighlights,
  persistHighlight,
  updateHighlightNote,
} from './db/highlights'
