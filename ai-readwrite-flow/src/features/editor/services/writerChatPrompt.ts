import type { WritingReference } from './writingTypes'

const MAX_REF_SNIPPET = 800
const MAX_REF_TOTAL = 4000

const clampText = (text: string, maxChars: number) =>
  text.length <= maxChars ? text : `${text.slice(0, maxChars)}\n...[truncated]`

const referenceMeta = (ref: WritingReference) => {
  const parts: string[] = []
  const author = ref.sourceAuthor ?? ref.author
  if (author) parts.push(author)
  if (typeof ref.sourceYear === 'number') parts.push(String(ref.sourceYear))
  const page = ref.pageLabel ?? (typeof ref.pageIndex === 'number' ? String(ref.pageIndex) : undefined)
  if (page) parts.push(`p.${page}`)
  return parts.length ? ` (${parts.join(', ')})` : ''
}

const referenceTitle = (ref: WritingReference) =>
  (ref.sourceTitle ?? ref.title ?? 'Untitled').trim()

const formatReferenceBlock = (ref: WritingReference, idx: number) => {
  const snippetSource = ref.snippetText.trim()
  if (!snippetSource) return ''
  const title = referenceTitle(ref)
  const header = `[${idx + 1}] ${title}${referenceMeta(ref)}`
  const snippet = clampText(snippetSource, MAX_REF_SNIPPET)
  return `${header}\n${snippet}`
}

const formatReferences = (refs: WritingReference[]) => {
  const blocks: string[] = []
  let used = 0
  for (const [idx, ref] of refs.entries()) {
    const block = formatReferenceBlock(ref, idx)
    if (!block.trim()) continue
    const next = used + block.length
    if (next > MAX_REF_TOTAL) {
      const remaining = Math.max(0, MAX_REF_TOTAL - used)
      if (remaining > 0) {
        blocks.push(clampText(block, remaining))
      }
      break
    }
    blocks.push(block)
    used = next
  }
  return blocks.join('\n\n')
}

export const stripWriterPromptToInstruction = (content: string) => {
  const trimmed = content.trim()
  if (!trimmed) return ''
  const marker = '\n\nInstruction:\n'
  const markerIndex = trimmed.lastIndexOf(marker)
  if (markerIndex >= 0) {
    return trimmed.slice(markerIndex + marker.length).trim()
  }
  const header = 'Instruction:\n'
  if (trimmed.startsWith(header)) {
    return trimmed.slice(header.length).trim()
  }
  return trimmed
}

export const buildWriterUserPrompt = (
  input: string,
  contextText: string,
  includeContext: boolean,
  references: WritingReference[],
  includeReferences: boolean,
) => {
  const trimmed = input.trim()
  if (!trimmed) return ''

  const parts: string[] = []
  const ctx = includeContext ? contextText.trim() : ''
  if (ctx) parts.push(`Context:\n${ctx}`)

  const refs = includeReferences ? formatReferences(references) : ''
  if (refs) parts.push(`References:\n${refs}`)

  if (!parts.length) return trimmed
  parts.push(`Instruction:\n${trimmed}`)
  return parts.join('\n\n')
}
