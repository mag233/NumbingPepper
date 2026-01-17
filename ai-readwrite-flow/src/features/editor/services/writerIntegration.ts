import type { Highlight } from '../../reader/types'
import type { WritingReference } from './writingTypes'

export const appendContextText = (base: string, snippet: string) => {
  const trimmed = snippet.trim()
  if (!trimmed) return base
  if (!base.trim()) return trimmed
  return `${base.trimEnd()}\n\n${trimmed}`
}

export const referenceTitleFromSnippet = (snippet: string) => {
  const text = snippet.trim().replace(/\s+/g, ' ')
  if (!text) return 'Highlight'
  const max = 48
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

export const buildReferenceFromHighlight = (args: {
  projectId: string
  highlight: Highlight
  now: number
  referenceId: string
  sourceTitle?: string
  sourceAuthor?: string
  sourceYear?: number
  sourceFileHash?: string
  pageLabel?: string
  tags?: string[]
}): WritingReference => {
  const { projectId, highlight, now, referenceId } = args
  return {
    id: referenceId,
    projectId,
    sourceType: 'highlight',
    bookId: highlight.bookId,
    pageIndex: highlight.contextRange.page,
    pageLabel: args.pageLabel,
    rects: highlight.contextRange.rects.map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })),
    title: referenceTitleFromSnippet(highlight.content),
    sourceTitle: args.sourceTitle,
    sourceAuthor: args.sourceAuthor,
    sourceYear: args.sourceYear,
    sourceFileHash: args.sourceFileHash,
    tags: args.tags,
    snippetText: highlight.content,
    createdAt: now,
  }
}
