import { describe, expect, it } from 'vitest'
import { markdownSourceToTipTapDoc, tipTapDocToMarkdownSource } from './tiptapMarkdown'

describe('tipTapDocToMarkdownSource', () => {
  it('extracts paragraphs and headings with stable spacing', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: '#tag/sub' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Line 2' }] },
      ],
    }

    expect(tipTapDocToMarkdownSource(doc)).toBe('## Title\n\nHello #tag/sub\n\nLine 2')
  })

  it('renders bullet lists from list nodes', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '001' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ok?' }] }] },
          ],
        },
      ],
    }

    expect(tipTapDocToMarkdownSource(doc)).toBe('- 001\n- ok?')
  })

  it('normalizes heading and list markers typed as plain text', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '##title' },
            { type: 'hardBreak' },
            { type: 'text', text: '-001' },
          ],
        },
      ],
    }

    expect(tipTapDocToMarkdownSource(doc)).toBe('## title\n- 001')
  })

  it('does not treat leading "**" as a list marker', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '**bold**' }] }],
    }

    expect(tipTapDocToMarkdownSource(doc)).toBe('**bold**')
  })

  it('serializes inline marks as markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'code', marks: [{ type: 'code' }] },
          ],
        },
      ],
    }

    expect(tipTapDocToMarkdownSource(doc)).toBe('Hello **bold** and `code`')
  })

  it('renders code blocks as fenced markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          content: [
            { type: 'text', text: 'const a = 1' },
            { type: 'hardBreak' },
            { type: 'text', text: 'console.log(a)' },
          ],
        },
      ],
    }

    expect(tipTapDocToMarkdownSource(doc)).toBe('```\nconst a = 1\nconsole.log(a)\n```')
  })

  it('returns empty string for unknown input', () => {
    expect(tipTapDocToMarkdownSource(null)).toBe('')
    expect(tipTapDocToMarkdownSource(123)).toBe('')
    expect(tipTapDocToMarkdownSource({})).toBe('')
  })
})

describe('markdownSourceToTipTapDoc', () => {
  it('round-trips markdown-ish text through TipTap doc', () => {
    const md = ['# Title', '', '## Section', 'line 1', 'line 2', '', '- item'].join('\n')
    const doc = markdownSourceToTipTapDoc(md)
    const back = tipTapDocToMarkdownSource(doc)
    expect(back).toContain('# Title')
    expect(back).toContain('## Section')
    expect(back).toContain('line 1\nline 2')
    expect(back).toContain('- item')
  })
})
