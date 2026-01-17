import { isSystemReferenceTag, normalizeExplicitTags, normalizeUserTag } from '../../../lib/referenceTags'

const SYSTEM_PREFIXES = ['books/', '写作/']

const splitTagInput = (raw: string) =>
  raw
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)

const isSystemLine = (normalized: string) =>
  SYSTEM_PREFIXES.some((prefix) => normalized.toLowerCase().startsWith(prefix))

const dedupeLines = (lines: string[]) => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    const key = withHash.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(withHash)
  }
  return out
}

export const parseFlomoTags = (raw: string) => {
  const lines = splitTagInput(raw)
  const tagLines: string[] = []
  const explicitCandidates: string[] = []

  for (const line of lines) {
    const normalized = normalizeUserTag(line)
    if (!normalized) continue
    if (isSystemLine(normalized)) {
      tagLines.push(`#${normalized}`)
      continue
    }
    const lower = normalized.toLowerCase()
    if (lower.startsWith('ai_reader/')) {
      tagLines.push(`#${normalized}`)
      if (!isSystemReferenceTag(normalized)) {
        explicitCandidates.push(normalized.slice('ai_reader/'.length))
      }
      continue
    }
    tagLines.push(`#ai_reader/${normalized}`)
    explicitCandidates.push(normalized)
  }

  return {
    tagLines: dedupeLines(tagLines),
    explicitTags: normalizeExplicitTags(explicitCandidates),
  }
}

export const dedupeFlomoTagLines = (lines: string[]) => dedupeLines(lines)
