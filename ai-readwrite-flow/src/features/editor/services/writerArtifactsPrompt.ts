import type { WritingArtifactType, WritingReference } from './writingTypes'
import { formatApaInTextCitation, formatApaReferenceList } from './writerCitations'

export type ArtifactPromptInput = {
  artifactType: WritingArtifactType
  instruction: string
  contentText: string
  contextText: string
  references: WritingReference[]
  citationRequired: boolean
}

const clampText = (text: string, maxChars: number) => {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n\n[...truncated...]`
}

const formatReferenceEvidence = (refs: WritingReference[]) =>
  refs
    .map((ref, idx) => {
      const label = `Source ${idx + 1}`
      const locParts: string[] = []
      if (ref.bookId) locParts.push(`bookId=${ref.bookId}`)
      if (ref.pageLabel) locParts.push(`page=${ref.pageLabel}`)
      if (!ref.pageLabel && typeof ref.pageIndex === 'number') locParts.push(`page=${ref.pageIndex}`)
      const loc = locParts.length ? ` (${locParts.join(', ')})` : ''
      const sourceTitle = ref.sourceTitle?.trim() ? ref.sourceTitle.trim() : undefined
      const fallbackTitle = ref.title?.trim() ? ref.title.trim() : undefined
      const title = sourceTitle ?? fallbackTitle
      const titlePart = title ? ` — ${title}` : ''
      return `${label}${titlePart}${loc}\n${ref.snippetText.trim()}`
    })
    .join('\n\n')

const formatApaRefs = (refs: WritingReference[]) => formatApaReferenceList(refs).join('\n')

const defaultTitleForType = (type: WritingArtifactType) => {
  switch (type) {
    case 'kickoff':
      return 'Kickoff'
    case 'definition':
      return 'Definitions'
    case 'explanation':
      return 'Explanation'
    case 'rewrite':
      return 'Rewrite'
    case 'polish':
      return 'Polish'
  }
}

const taskForType = (type: WritingArtifactType, instruction: string) => {
  const extra = instruction.trim() ? `\n\nUser instruction:\n${instruction.trim()}` : ''
  switch (type) {
    case 'kickoff':
      return (
        `Write a strong opening for this writing project.\n` +
        `Output: 1–2 paragraphs, then 3–5 bullet points for “What this piece will cover”.` +
        extra
      )
    case 'definition':
      return (
        `Extract and define key terms and acronyms that appear in the draft.\n` +
        `Output: a Markdown list of definitions. If a term is not supported by references, say so.` +
        extra
      )
    case 'explanation':
      return (
        `Explain the main idea(s) in the draft in a clear, teachable way.\n` +
        `Output: short explanation + 3–5 bullet takeaways + optional analogy/example.` +
        extra
      )
    case 'rewrite':
      return (
        `Rewrite the draft to improve clarity and flow while preserving meaning.\n` +
        `Output: revised draft in Markdown. Keep citations inline.` +
        extra
      )
    case 'polish':
      return (
        `Polish the draft for grammar, concision, and readability.\n` +
        `Output: revised draft in Markdown. Keep citations inline.` +
        extra
      )
  }
}

export const buildWriterArtifactMessages = (input: ArtifactPromptInput) => {
  const refs = input.references
  const systemParts: string[] = [
    `You are an expert writing assistant.`,
    `Write in Markdown.`,
    `Do not invent citations or sources.`,
  ]
  if (input.citationRequired) {
    systemParts.push(
      `All factual or specific claims must be supported by the provided references.`,
      `Use APA 7 author-date citations (e.g., ${formatApaInTextCitation(input.references[0] ?? {
        id: 'ref',
        projectId: 'project',
        sourceType: 'manual',
        snippetText: 'Example',
        createdAt: Date.now(),
        title: 'Example Reference',
      } as WritingReference)}).`,
      `Include a References section formatted in APA 7.`,
      `If the references do not support a claim, explicitly say: "Not supported by provided references."`,
    )
  }

  const userParts: string[] = [
    `Artifact: ${defaultTitleForType(input.artifactType)}`,
    `Task:\n${taskForType(input.artifactType, input.instruction)}`,
    `\nDraft (may be incomplete):\n${clampText(input.contentText.trim(), 12000) || '(empty)'}`,
  ]

  if (input.contextText.trim()) {
    userParts.push(`\nWriter Context:\n${clampText(input.contextText.trim(), 8000)}`)
  }

  if (refs.length > 0) {
    userParts.push(`\nReference Evidence:\n${clampText(formatReferenceEvidence(refs), 12000)}`)
    userParts.push(`\nAPA References:\n${clampText(formatApaRefs(refs), 4000)}`)
  } else if (input.citationRequired) {
    userParts.push(`\nAPA References:\n(none provided)`)
  }

  return {
    system: systemParts.join('\n'),
    user: userParts.join('\n'),
    defaultTitle: defaultTitleForType(input.artifactType),
  }
}
