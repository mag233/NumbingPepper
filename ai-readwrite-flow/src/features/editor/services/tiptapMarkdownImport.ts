import type { JSONContent } from '@tiptap/core'

export const markdownSourceToTipTapDoc = (markdown: string): JSONContent => {
  const normalized = markdown.replace(/\r\n/g, '\n').trim()
  if (!normalized) return { type: 'doc', content: [{ type: 'paragraph' }] }

  const paragraphs = normalized.split(/\n{2,}/g).map((p) => p.trimEnd())
  const content: JSONContent[] = []

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n')
    const paragraphContent: JSONContent[] = []
    for (const [index, line] of lines.entries()) {
      if (index > 0) paragraphContent.push({ type: 'hardBreak' })
      if (line.length) paragraphContent.push({ type: 'text', text: line })
    }
    content.push({ type: 'paragraph', content: paragraphContent.length ? paragraphContent : undefined })
  }

  return { type: 'doc', content }
}

