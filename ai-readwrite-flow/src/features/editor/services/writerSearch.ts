import type { Node as PMNode } from 'prosemirror-model'

export type WriterSearchArea = 'content' | 'context' | 'references' | 'chat' | 'studio'

export type WriterSearchMatch = {
  id: string
  area: WriterSearchArea
  snippet: string
  start: number
  end: number
  referenceId?: string
  messageId?: string
  artifactId?: string
}

type TextMatch = { start: number; end: number; snippet: string }

const SNIPPET_RADIUS = 40

export const normalizeSearchQuery = (query: string) => query.trim()

const buildSnippet = (text: string, start: number, end: number) => {
  const before = Math.max(0, start - SNIPPET_RADIUS)
  const after = Math.min(text.length, end + SNIPPET_RADIUS)
  const prefix = before > 0 ? '...' : ''
  const suffix = after < text.length ? '...' : ''
  return `${prefix}${text.slice(before, after)}${suffix}`.trim()
}

export const findTextMatches = (text: string, query: string, maxMatches = 20): TextMatch[] => {
  const trimmed = normalizeSearchQuery(query)
  if (!trimmed) return []
  const haystack = text.toLowerCase()
  const needle = trimmed.toLowerCase()
  const matches: TextMatch[] = []
  let cursor = 0
  while (cursor < haystack.length) {
    const index = haystack.indexOf(needle, cursor)
    if (index < 0) break
    const start = index
    const end = index + needle.length
    matches.push({ start, end, snippet: buildSnippet(text, start, end) })
    if (matches.length >= maxMatches) break
    cursor = end
  }
  return matches
}

export const findDocMatches = (doc: PMNode, query: string, maxMatches = 20): TextMatch[] => {
  const trimmed = normalizeSearchQuery(query)
  if (!trimmed) return []
  const needle = trimmed.toLowerCase()
  const matches: TextMatch[] = []
  doc.descendants((node, pos) => {
    if (!node.isText) return true
    const text = node.text ?? ''
    const haystack = text.toLowerCase()
    let cursor = 0
    while (cursor < haystack.length) {
      const index = haystack.indexOf(needle, cursor)
      if (index < 0) break
      const start = pos + index
      const end = start + needle.length
      matches.push({ start, end, snippet: buildSnippet(text, index, index + needle.length) })
      if (matches.length >= maxMatches) return false
      cursor = index + needle.length
    }
    return true
  })
  return matches
}
