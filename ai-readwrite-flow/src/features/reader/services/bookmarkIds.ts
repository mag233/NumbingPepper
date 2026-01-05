export const generateBookmarkId = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random()}`
}
