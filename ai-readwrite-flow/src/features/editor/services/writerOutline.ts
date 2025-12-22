export type WriterOutlineItem = {
  id: string
  level: number
  title: string
  needle: string
}

const normalizeLine = (line: string) => line.replace(/\t/g, ' ').trimEnd()

const parseHeading = (line: string): { level: number; title: string; needle: string } | null => {
  const trimmed = normalizeLine(line).trimStart()
  if (!trimmed.startsWith('#')) return null

  let level = 0
  let index = 0
  let sawSpaceAfterHash = false
  while (index < trimmed.length) {
    const char = trimmed[index]
    if (char === '#') {
      level += 1
      if (level > 6) return null
      index += 1
      continue
    }
    if (char === ' ') {
      if (level > 0) sawSpaceAfterHash = true
      index += 1
      continue
    }
    break
  }

  if (level < 1) return null
  if (!sawSpaceAfterHash) return null
  const title = trimmed.slice(index).trim()
  if (!title) return null
  return { level, title, needle: `${'#'.repeat(level)} ${title}` }
}

export const buildWriterOutlineFromMarkdown = (markdown: string): WriterOutlineItem[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const items: WriterOutlineItem[] = []
  const seen = new Map<string, number>()

  for (const line of lines) {
    const parsed = parseHeading(line)
    if (!parsed) continue
    const key = parsed.needle.toLowerCase()
    const next = (seen.get(key) ?? 0) + 1
    seen.set(key, next)
    items.push({
      id: `${key}:${next}`,
      level: parsed.level,
      title: parsed.title,
      needle: parsed.needle,
    })
  }

  return items
}
