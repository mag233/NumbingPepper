import { describe, expect, it } from 'vitest'
import { cleanPdfCopiedText } from './selectionText'

describe('cleanPdfCopiedText', () => {
  it('joins soft line breaks within a paragraph', () => {
    expect(
      cleanPdfCopiedText('educational institutions, research entities, and \nacademic societies.'),
    ).toBe('educational institutions, research entities, and academic societies.')
  })

  it('preserves paragraph breaks', () => {
    expect(cleanPdfCopiedText('Line one\nLine two\n\nLine three')).toBe(
      'Line one Line two\n\nLine three',
    )
  })

  it('fixes hyphenated line breaks', () => {
    expect(cleanPdfCopiedText('inter-\nnational health')).toBe('international health')
  })
})

