import type { WritingReference } from './writingTypes'

const normalizeSpace = (value: string) => value.trim().replace(/\s+/g, ' ')

const resolveTitle = (ref: WritingReference) => {
  const title = ref.sourceTitle ?? ref.title ?? 'Untitled'
  return normalizeSpace(title)
}

const resolveAuthor = (ref: WritingReference) => {
  const author = ref.sourceAuthor ?? ref.author
  return author ? normalizeSpace(author) : undefined
}

const resolveYear = (ref: WritingReference) => (typeof ref.sourceYear === 'number' ? String(ref.sourceYear) : 'n.d.')

const resolvePage = (ref: WritingReference) => {
  if (ref.pageLabel) return ref.pageLabel
  if (typeof ref.pageIndex === 'number') return String(ref.pageIndex)
  return undefined
}

const referenceKey = (ref: WritingReference) =>
  [
    ref.sourceFileHash ?? ref.bookId ?? ref.id,
    ref.pageIndex ?? '',
    resolveTitle(ref),
  ].join('|')

export const formatApaInTextCitation = (ref: WritingReference) => {
  const author = resolveAuthor(ref) ?? resolveTitle(ref)
  const year = resolveYear(ref)
  const page = resolvePage(ref)
  const pagePart = page ? `, p. ${page}` : ''
  return `(${author}, ${year}${pagePart})`
}

export const formatApaReferenceEntry = (ref: WritingReference) => {
  const title = resolveTitle(ref)
  const author = resolveAuthor(ref)
  const year = resolveYear(ref)
  const page = resolvePage(ref)
  const useTitleAsAuthor = !author
  const authorPart = useTitleAsAuthor ? title : author
  const titlePart = useTitleAsAuthor ? '' : title
  const pagePart = page ? ` p. ${page}.` : ''
  return `${authorPart}. (${year}).${titlePart ? ` ${titlePart}.` : ''}${pagePart}`.trim()
}

export const formatApaReferenceList = (refs: WritingReference[]) => {
  const deduped = new Map<string, WritingReference>()
  for (const ref of refs) {
    const key = referenceKey(ref)
    if (!deduped.has(key)) deduped.set(key, ref)
  }
  const ordered = [...deduped.values()].sort((a, b) => {
    const aKey = (resolveAuthor(a) ?? resolveTitle(a)).toLowerCase()
    const bKey = (resolveAuthor(b) ?? resolveTitle(b)).toLowerCase()
    return aKey.localeCompare(bKey)
  })
  return ordered.map((ref) => formatApaReferenceEntry(ref))
}
