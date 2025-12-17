export const draftIdForBook = (bookId: string | null | undefined) =>
  bookId && bookId.length ? `book:${bookId}` : 'global'

export const draftIdForProject = (projectId: string | null | undefined) =>
  projectId && projectId.length ? `project:${projectId}` : 'project:global'
