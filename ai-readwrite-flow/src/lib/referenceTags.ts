export type ReferenceDefaultTags = {
  book: boolean
  author: boolean
  year: boolean
}

export const defaultReferenceDefaultTags: ReferenceDefaultTags = {
  book: true,
  author: true,
  year: true,
}

const SYSTEM_TAG_NAMESPACE = 'ai_reader'
const SYSTEM_TAG_FIELDS = new Set(['title', 'author', 'year'])

const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, ' ')

export const normalizeUserTag = (value: string) => normalizeWhitespace(value).replace(/^#+/, '')

export const normalizeTag = (value: string) => normalizeUserTag(value)

export const stripAiReaderPrefix = (value: string) => {
  const normalized = normalizeUserTag(value)
  if (!normalized) return ''
  const lower = normalized.toLowerCase()
  if (!lower.startsWith(`${SYSTEM_TAG_NAMESPACE}/`)) return normalized
  return normalized.slice(`${SYSTEM_TAG_NAMESPACE}/`.length)
}

export const prefixReferenceUserTag = (value: string) => {
  const normalized = normalizeUserTag(value)
  if (!normalized) return null
  const lower = normalized.toLowerCase()
  if (lower.startsWith(`${SYSTEM_TAG_NAMESPACE}/`)) return normalized
  return `${SYSTEM_TAG_NAMESPACE}/${normalized}`
}

export const splitTagsInput = (raw: string): string[] => {
  const parts = raw
    .split(/[,\n]/)
    .map((item) => normalizeUserTag(item))
    .filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of parts) {
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out
}

export const formatTagsInput = (tags: string[]) => tags.join('\n')

export const formatTagDisplay = (tag: string) => {
  const trimmed = tag.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

const shortenTitleForTag = (value: string, max = 48) => {
  const trimmed = normalizeWhitespace(value)
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, Math.max(0, max - 3)).trimEnd()}...`
}

const compactAuthorTag = (value: string) => {
  const normalized = normalizeWhitespace(value)
  const first = normalized.split(/,| and | & /i)[0]?.trim()
  if (!first) return normalized
  const parts = first.split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : first
}

const normalizeTagValue = (value: string) =>
  normalizeWhitespace(value)
    .replace(/[#\r\n]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '')

const normalizeSystemReferenceTag = (tag: string) => {
  const trimmed = tag.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/^#+/, '')
  const lower = normalized.toLowerCase()
  if (lower.startsWith(`${SYSTEM_TAG_NAMESPACE}/`)) {
    const parts = normalized.split('/')
    if (parts.length < 3) return null
    const field = parts[1]?.toLowerCase()
    if (!field || !SYSTEM_TAG_FIELDS.has(field)) return null
    const value = normalizeTagValue(parts.slice(2).join('/'))
    if (!value) return null
    return `${SYSTEM_TAG_NAMESPACE}/${field}/${value}`
  }
  const legacy = normalized.match(/^(book|author|year)\s*:\s*(.+)$/i)
  if (!legacy) return null
  const field = legacy[1].toLowerCase() === 'book' ? 'title' : legacy[1].toLowerCase()
  const value = normalizeTagValue(legacy[2] ?? '')
  if (!value) return null
  return `${SYSTEM_TAG_NAMESPACE}/${field}/${value}`
}

export const parseSystemReferenceTag = (tag: string) => {
  const normalized = normalizeSystemReferenceTag(tag)
  if (!normalized) return null
  const parts = normalized.split('/')
  if (parts.length < 3) return null
  const field = parts[1] ?? ''
  const value = parts.slice(2).join('/')
  if (!field || !value) return null
  return { field, value }
}

export const isSystemReferenceTag = (tag: string) => Boolean(parseSystemReferenceTag(tag))

export const formatSystemTagLabel = (tag: string) => {
  const parsed = parseSystemReferenceTag(tag)
  if (!parsed) return ''
  const value = parsed.value.replace(/-/g, ' ')
  return `${parsed.field} ${value}`.trim()
}

export const splitReferenceTags = (tags: string[]) => {
  const systemTags: string[] = []
  const userTags: string[] = []
  const seenSystem = new Set<string>()
  const seenUser = new Set<string>()
  for (const tag of tags) {
    const system = normalizeSystemReferenceTag(tag)
    if (system) {
      const key = system.toLowerCase()
      if (!seenSystem.has(key)) {
        seenSystem.add(key)
        systemTags.push(system)
      }
      continue
    }
    const user = normalizeUserTag(tag)
    if (!user) continue
    const key = user.toLowerCase()
    if (seenUser.has(key)) continue
    seenUser.add(key)
    userTags.push(user)
  }
  return { systemTags, userTags }
}

export const normalizeExplicitTags = (tags: string[]) => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of tags) {
    const normalized = normalizeUserTag(tag)
    if (!normalized) continue
    if (isSystemReferenceTag(normalized)) continue
    const stripped = stripAiReaderPrefix(normalized)
    if (!stripped) continue
    const key = stripped.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(stripped.toLowerCase())
  }
  return out
}

export const buildAiReaderTagLines = (tags: string[]) =>
  normalizeExplicitTags(tags).map((tag) => formatTagDisplay(`${SYSTEM_TAG_NAMESPACE}/${tag}`))

export const buildReferenceFlomoTagLines = (tags: string[]) => {
  const { systemTags, userTags } = splitReferenceTags(tags)
  const prefixedUsers = userTags
    .map(prefixReferenceUserTag)
    .filter((tag): tag is string => Boolean(tag))
  return [...systemTags, ...prefixedUsers].map(formatTagDisplay)
}

export const buildSystemReferenceTags = (args: {
  title?: string
  author?: string
  year?: number
  defaults: ReferenceDefaultTags
}): string[] => {
  const tags: string[] = []
  if (args.defaults.book && args.title) {
    const value = normalizeTagValue(shortenTitleForTag(args.title))
    if (value) tags.push(`${SYSTEM_TAG_NAMESPACE}/title/${value}`)
  }
  if (args.defaults.author && args.author) {
    const value = normalizeTagValue(compactAuthorTag(args.author))
    if (value) tags.push(`${SYSTEM_TAG_NAMESPACE}/author/${value}`)
  }
  if (args.defaults.year && typeof args.year === 'number') {
    const value = normalizeTagValue(String(args.year))
    if (value) tags.push(`${SYSTEM_TAG_NAMESPACE}/year/${value}`)
  }
  return tags
}

export const normalizeReferenceTags = (tags: string[]) => {
  const { systemTags, userTags } = splitReferenceTags(tags)
  return mergeTags(systemTags, userTags)
}

export const mergeTags = (systemTags: string[], userTags: string[]) => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of [...systemTags, ...userTags]) {
    const normalized = normalizeTag(tag)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
  }
  return out
}
