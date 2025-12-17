import type { WritingProject } from './writingTypes'

export const filterProjectsByTag = (
  projects: WritingProject[],
  tagsByProjectId: Record<string, string[]>,
  tag: string | null,
) => {
  const trimmed = tag?.trim().toLowerCase() ?? ''
  if (!trimmed) return projects
  return projects.filter((p) => (tagsByProjectId[p.id] ?? []).includes(trimmed))
}

