export type { StoredSettings } from './db/settings'
export { loadSettingsFromStore, persistSettings } from './db/settings'

export type { BookRecord, LastReadPosition } from './db/books'
export {
  findBookByHash,
  findBookById,
  loadBooks,
  loadDeletedBooks,
  persistBook,
  removeBook,
  restoreBook,
  softDeleteBook,
  updateBookTags,
  updateLastOpenedAt,
  updateLastReadPosition,
} from './db/books'

export {
  deleteHighlight,
  loadHighlights,
  persistHighlight,
  updateHighlightNote,
} from './db/highlights'

export {
  deleteBookmark,
  loadBookmarks,
  persistBookmark,
  updateBookmarkTitle,
} from './db/bookmarks'

export type { ProjectBookMembership } from './db/projectBooks'
export {
  addBookToProject,
  loadAllProjectBooks,
  loadBookProjects,
  loadProjectBooks,
  removeBookFromProject,
  removeProjectBooksForBook,
  removeProjectBooksForProject,
  replaceBookProjects,
} from './db/projectBooks'
