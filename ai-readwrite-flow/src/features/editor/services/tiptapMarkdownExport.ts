type TipTapNode = {
  type?: unknown
  attrs?: unknown
  text?: unknown
  marks?: unknown
  content?: unknown
}

type ListKind = 'bullet' | 'ordered'

type ListContext = {
  kind: ListKind
  depth: number
  nextIndex: number
}

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'horizontalRule',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isTipTapNode = (value: unknown): value is TipTapNode => isRecord(value)

const getNodeType = (node: TipTapNode): string | null => (typeof node.type === 'string' ? node.type : null)

const getChildren = (node: TipTapNode): unknown[] => (Array.isArray(node.content) ? node.content : [])

const getHeadingLevel = (node: TipTapNode): number | null => {
  if (!isRecord(node.attrs)) return null
  const level = node.attrs.level
  if (typeof level !== 'number') return null
  if (!Number.isFinite(level)) return null
  if (level < 1 || level > 6) return null
  return level
}

type TipTapMark = { type?: unknown; attrs?: unknown }

const normalizeMarkdownLine = (line: string): string => {
  const headingMatch = /^(#{1,6})([^\s#])/.exec(line)
  if (headingMatch) return `${headingMatch[1]} ${headingMatch[2]}${line.slice(headingMatch[0].length)}`

  const bulletMatch = /^(-)(\S)/.exec(line)
  if (bulletMatch) return `- ${bulletMatch[2]}${line.slice(bulletMatch[0].length)}`

  const orderedMatch = /^(\d+)\.(\S)/.exec(line)
  if (orderedMatch) return `${orderedMatch[1]}. ${orderedMatch[2]}${line.slice(orderedMatch[0].length)}`

  return line
}

const normalizeMarkdownBlock = (text: string): string =>
  text
    .split('\n')
    .map((line) => normalizeMarkdownLine(line))
    .join('\n')

const getMarks = (node: TipTapNode): TipTapMark[] => {
  if (!Array.isArray(node.marks)) return []
  return node.marks.filter((mark) => isRecord(mark))
}

const getMarkType = (mark: TipTapMark): string | null => (typeof mark.type === 'string' ? mark.type : null)

const getLinkHref = (mark: TipTapMark): string | null => {
  if (!isRecord(mark.attrs)) return null
  const href = mark.attrs.href
  return typeof href === 'string' ? href : null
}

const applyMarks = (text: string, marks: TipTapMark[]): string => {
  if (!text) return text
  const types = new Set(marks.map((mark) => getMarkType(mark)).filter((value): value is string => !!value))
  let output = text
  if (types.has('code')) output = `\`${output.replace(/`/g, '\\`')}\``
  if (types.has('bold')) output = `**${output}**`
  if (types.has('italic')) output = `*${output}*`
  const link = marks.find((mark) => getMarkType(mark) === 'link')
  const href = link ? getLinkHref(link) : null
  if (href) output = `[${output}](${href})`
  return output
}

const extractInlineMarkdown = (node: TipTapNode): string => {
  const parts: string[] = []
  const walk = (value: unknown) => {
    if (!isTipTapNode(value)) return
    const type = getNodeType(value)
    if (type === 'hardBreak') {
      parts.push('\n')
      return
    }
    if (typeof value.text === 'string') {
      parts.push(applyMarks(value.text, getMarks(value)))
      return
    }
    for (const child of getChildren(value)) walk(child)
  }
  walk(node)
  return parts.join('')
}

const extractPlainText = (node: TipTapNode): string => {
  const textParts: string[] = []
  const walk = (value: unknown) => {
    if (!isTipTapNode(value)) return
    if (typeof value.text === 'string') textParts.push(value.text)
    const type = getNodeType(value)
    if (type === 'hardBreak') textParts.push('\n')
    for (const child of getChildren(value)) walk(child)
  }
  walk(node)
  return textParts.join('')
}

const nodeToMarkdownBlock = (node: TipTapNode): string | null => {
  const type = getNodeType(node)
  if (!type || !BLOCK_TYPES.has(type)) return null
  if (type === 'bulletList' || type === 'orderedList' || type === 'listItem') return null
  if (type === 'horizontalRule') return '---'

  const text = extractInlineMarkdown(node).trimEnd()
  if (!text) return null

  if (type === 'heading') {
    const level = getHeadingLevel(node) ?? 1
    return `${'#'.repeat(level)} ${text}`
  }
  if (type === 'codeBlock') {
    const raw = extractPlainText(node).trimEnd()
    if (!raw) return null
    return `\`\`\`\n${raw}\n\`\`\``
  }
  if (type === 'blockquote') {
    const normalized = normalizeMarkdownBlock(text)
    return normalized
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
  }

  return normalizeMarkdownBlock(text)
}

const listPrefix = (context: ListContext): string => {
  const indent = '  '.repeat(context.depth)
  if (context.kind === 'ordered') return `${indent}${context.nextIndex}. `
  return `${indent}- `
}

const listContinuationIndent = (context: ListContext): string => {
  const prefix = listPrefix(context)
  return `${' '.repeat(prefix.length)}`
}

const listItemToLines = (node: TipTapNode, context: ListContext): string[] => {
  const prefix = listPrefix(context)
  const continuation = listContinuationIndent(context)
  const lines: string[] = []
  let wroteAny = false

  for (const child of getChildren(node)) {
    if (!isTipTapNode(child)) continue
    const type = getNodeType(child)
    if (type === 'bulletList' || type === 'orderedList') {
      const nested = extractBlocks(child, {
        kind: type === 'orderedList' ? 'ordered' : 'bullet',
        depth: context.depth + 1,
        nextIndex: 1,
      })
      lines.push(...nested)
      continue
    }
    const block = nodeToMarkdownBlock(child)
    if (!block) continue
    const blockLines = block.split('\n')
    for (const line of blockLines) {
      if (!wroteAny) {
        lines.push(`${prefix}${line}`)
        wroteAny = true
        continue
      }
      lines.push(`${continuation}${line}`)
    }
  }

  if (lines.length === 0) return []
  context.nextIndex += 1
  return lines
}

const extractBlocks = (value: unknown, context: ListContext | null): string[] => {
  if (!isTipTapNode(value)) return []
  const type = getNodeType(value)
  if (!type) return []
  if (type === 'bulletList' || type === 'orderedList') {
    const listContext: ListContext = {
      kind: type === 'orderedList' ? 'ordered' : 'bullet',
      depth: context?.depth ?? 0,
      nextIndex: 1,
    }
    const lines: string[] = []
    for (const child of getChildren(value)) {
      if (!isTipTapNode(child)) continue
      if (getNodeType(child) !== 'listItem') continue
      lines.push(...listItemToLines(child, listContext))
    }
    if (lines.length === 0) return []
    return [lines.join('\n')]
  }
  const asBlock = nodeToMarkdownBlock(value)
  if (asBlock) return [asBlock]
  const blocks: string[] = []
  for (const child of getChildren(value)) blocks.push(...extractBlocks(child, context))
  return blocks
}

const isListLine = (value: string): boolean => /^(\s*([-*]|\d+\.))\s+\S/.test(value.trimStart())

const shouldJoinWithSingleNewline = (prev: string, next: string): boolean => {
  const prevFirst = prev.split('\n')[0] ?? ''
  const nextFirst = next.split('\n')[0] ?? ''
  return isListLine(prevFirst) && isListLine(nextFirst)
}

export const tipTapDocToMarkdownSource = (doc: unknown): string => {
  const blocks = extractBlocks(doc, null)
  const merged: string[] = []
  for (const block of blocks) {
    const last = merged[merged.length - 1]
    if (last && shouldJoinWithSingleNewline(last, block)) {
      merged[merged.length - 1] = `${last}\n${block}`
      continue
    }
    merged.push(block)
  }
  return merged.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

