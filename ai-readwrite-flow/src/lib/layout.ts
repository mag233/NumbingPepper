export const getWriterGridCols = (showNav: boolean, chatCollapsed: boolean): string => {
  if (showNav) {
    if (chatCollapsed) return 'md:grid-cols-[280px_minmax(0,3.5fr)_64px]'
    return 'md:grid-cols-[280px_minmax(0,3.5fr)_1.1fr]'
  }
  if (chatCollapsed) return 'md:grid-cols-[minmax(0,3.5fr)_64px]'
  return 'md:grid-cols-[minmax(0,3.5fr)_1.1fr]'
}
