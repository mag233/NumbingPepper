const normalizeHashtag = (raw: string) => {
  const trimmed = raw.trim().replace(/^#+/, '')
  if (!trimmed) return null
  const compact = trimmed.replace(/\s+/g, '-')
  return `#${compact}`
}

const tagFromPath = (prefix: string, name: string) => {
  const safe = name.trim().replace(/\s+/g, '-').replace(/[#\r\n]+/g, '')
  const joined = `${prefix}/${safe}`.replace(/\/+/g, '/').replace(/\/$/, '')
  return normalizeHashtag(joined)
}

const joinTagLines = (tags: string[]) => {
  const seen = new Set<string>()
  const lines = tags
    .map(normalizeHashtag)
    .filter((tag): tag is string => Boolean(tag))
    .filter((tag) => {
      if (seen.has(tag)) return false
      seen.add(tag)
      return true
    })
  return lines.length ? lines.join('\n') : ''
}

const joinContentLines = (lines: string[]) => {
  const next = [...lines]
  while (next.length && next[0] === '') next.shift()
  while (next.length && next[next.length - 1] === '') next.pop()
  return next.join('\n')
}

export const buildReaderFlomoContent = (args: {
  quote: string
  note: string
  bookTitle: string
  tags?: string[]
}) => {
  const defaultTag = tagFromPath('books', args.bookTitle) ?? '#books'
  const allTags = [defaultTag, ...(args.tags ?? [])]
  const tagLines = joinTagLines(allTags)
  return joinContentLines([
    'Quote:',
    args.quote.trim(),
    '',
    'Note:',
    args.note.trim(),
    '',
    'Tags:',
    tagLines,
  ])
}

export const defaultBookTag = (bookTitle: string) => tagFromPath('books', bookTitle) ?? '#books'

export const buildWriterFlomoContent = (args: {
  selection: string
  context: string
  projectTitle: string
  tags?: string[]
}) => {
  const defaultTag = tagFromPath('写作', args.projectTitle) ?? '#写作'
  const allTags = [defaultTag, ...(args.tags ?? [])]
  const tagLines = joinTagLines(allTags)
  return joinContentLines([
    'Selection:',
    args.selection.trim(),
    '',
    'Context:',
    args.context.trim(),
    '',
    'Tags:',
    tagLines,
  ])
}

export const defaultProjectTag = (projectTitle: string) => tagFromPath('写作', projectTitle) ?? '#写作'
