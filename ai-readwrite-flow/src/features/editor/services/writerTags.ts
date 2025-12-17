import type { JSONContent } from '@tiptap/core'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const readArray = (value: unknown): unknown[] | null => (Array.isArray(value) ? value : null)

const normalizeTag = (tag: string) => tag.trim().toLowerCase()

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

const expandPrefixes = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  const out: string[] = []
  for (let i = 0; i < parts.length; i += 1) {
    out.push(parts.slice(0, i + 1).join('/'))
  }
  return out
}

export const extractTagPathsFromText = (text: string) => {
  const out: string[] = []
  const regex = /(^|[^\p{L}\p{N}_-])#([\p{L}\p{N}][\p{L}\p{N}_-]*(?:\/[\p{L}\p{N}_-]+)*)/gu
  for (const match of text.matchAll(regex)) {
    const raw = match[2]
    if (!raw) continue
    const normalized = normalizeTag(raw)
    if (!normalized) continue
    out.push(...expandPrefixes(normalized))
  }
  return uniqueSorted(out).slice(0, 100)
}

export const extractTagPathsFromTipTapDoc = (doc: JSONContent) => {
  const texts: string[] = []
  const visit = (node: unknown) => {
    if (!isRecord(node)) return
    const type = readString(node.type)
    if (type === 'text') {
      const text = readString(node.text)
      if (text) texts.push(text)
      return
    }
    if (type === 'hardBreak') {
      texts.push('\n')
      return
    }
    const content = readArray(node.content)
    if (!content) return
    for (const child of content) visit(child)
    if (type === 'paragraph') texts.push('\n')
  }
  visit(doc)
  return extractTagPathsFromText(texts.join(''))
}

