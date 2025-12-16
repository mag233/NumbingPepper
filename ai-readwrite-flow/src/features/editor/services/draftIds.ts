export const draftIdForBook = (bookId: string | null | undefined) =>
  bookId && bookId.length ? `book:${bookId}` : 'global'
