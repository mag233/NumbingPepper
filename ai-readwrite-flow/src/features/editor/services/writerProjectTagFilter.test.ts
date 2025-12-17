import { describe, expect, it } from 'vitest'
import { filterProjectsByTag } from './writerProjectTagFilter'

describe('writerProjectTagFilter', () => {
  it('returns all when no tag filter', () => {
    const projects = [{ id: 'p1', title: 'A', createdAt: 1, updatedAt: 1 }]
    expect(filterProjectsByTag(projects, { p1: ['x'] }, null)).toEqual(projects)
  })

  it('filters by tag', () => {
    const projects = [
      { id: 'p1', title: 'A', createdAt: 1, updatedAt: 1 },
      { id: 'p2', title: 'B', createdAt: 1, updatedAt: 2 },
    ]
    expect(filterProjectsByTag(projects, { p1: ['tag'], p2: [] }, 'tag')).toEqual([projects[0]])
  })
})

