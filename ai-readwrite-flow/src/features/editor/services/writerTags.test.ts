import { describe, expect, it } from 'vitest'
import { extractTagPathsFromText } from './writerTags'

describe('writerTags', () => {
  it('extracts simple tags', () => {
    expect(extractTagPathsFromText('hello #Tag world')).toEqual(['tag'])
  })

  it('extracts nested tags and prefixes', () => {
    expect(extractTagPathsFromText('#a/b/c')).toEqual(['a', 'a/b', 'a/b/c'])
  })

  it('ignores invalid tag starts', () => {
    expect(extractTagPathsFromText('### not a tag')).toEqual([])
    expect(extractTagPathsFromText('#-bad #_bad')).toEqual([])
  })

  it('supports unicode letters', () => {
    expect(extractTagPathsFromText('中文 #健康/研究')).toEqual(['健康', '健康/研究'])
  })
})

