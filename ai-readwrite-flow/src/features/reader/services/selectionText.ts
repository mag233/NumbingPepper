const normalizeNewlines = (text: string) => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

const collapseSpaces = (text: string) => text.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n')

const joinParagraphLines = (lines: string[]) => {
  const out: string[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() ?? ''
    if (!line) continue
    const next = lines[i + 1]?.trim()
    if (!next) {
      out.push(line)
      continue
    }

    if (line.endsWith('-') && /[a-zA-Z]$/.test(line.slice(0, -1))) {
      out.push(`${line.slice(0, -1)}${next}`)
      i += 1
      continue
    }

    out.push(`${line} ${next}`)
    i += 1
  }
  return out.join(' ')
}

export const cleanPdfCopiedText = (text: string) => {
  const input = collapseSpaces(normalizeNewlines(text)).trim()
  if (!input) return ''

  const paragraphs = input.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean)
  const cleaned = paragraphs.map((p) => joinParagraphLines(p.split('\n').map((l) => l.trim())))
  return cleaned.join('\n\n').replace(/[ \t]+/g, ' ').trim()
}

