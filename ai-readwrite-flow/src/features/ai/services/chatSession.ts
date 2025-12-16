export const chatSessionIdForBook = (bookId: string | null | undefined) =>
  bookId && bookId.length ? `book:${bookId}` : 'global'
