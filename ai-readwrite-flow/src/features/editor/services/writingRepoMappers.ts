import { z } from 'zod'
import {
  rectSchema,
  writingContextSchema,
  writingProjectSchema,
  writingReferenceSchema,
  writingSourceTypeSchema,
  type WritingContext,
  type WritingProject,
  type WritingReference,
} from './writingTypes'
import { parseJson } from './writingRepoLocal'

export type ProjectRow = { id: string; title: string; created_at: number; updated_at: number; tags_json?: string | null }
export type ContentRow = { project_id: string; content_text: string; updated_at: number }
export type ContextRow = { project_id: string; context_text: string; updated_at: number }
export type ReferenceRow = {
  id: string
  project_id: string
  source_type: string
  book_id: string | null
  page_index: number | null
  page_label: string | null
  rects_json: string | null
  title: string | null
  author: string | null
  source_title: string | null
  source_author: string | null
  source_year: number | null
  source_file_hash: string | null
  tags_json: string | null
  snippet_text: string
  created_at: number
}

export const mapProjectRow = (row: ProjectRow): WritingProject | null => {
  const tags = row.tags_json ? parseJson(row.tags_json) : null
  const candidate = {
    id: row.id,
    title: row.title,
    tags: Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  const parsed = writingProjectSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

const contentRowSchema = z.object({
  projectId: z.string().min(1),
  contentText: z.string(),
  updatedAt: z.number().int().nonnegative(),
})

export const mapContentRow = (row: ContentRow) => {
  const candidate = { projectId: row.project_id, contentText: row.content_text, updatedAt: row.updated_at }
  const parsed = contentRowSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export const mapContextRow = (row: ContextRow): WritingContext | null => {
  const candidate = { projectId: row.project_id, contextText: row.context_text, updatedAt: row.updated_at }
  const parsed = writingContextSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

const parseRects = (raw: string | null) => {
  if (!raw) return undefined
  const parsed = parseJson(raw)
  const arr = z.array(rectSchema).safeParse(parsed)
  return arr.success ? arr.data : undefined
}

export const mapReferenceRow = (row: ReferenceRow): WritingReference | null => {
  const sourceType = writingSourceTypeSchema.safeParse(row.source_type)
  if (!sourceType.success) return null
  const tags = row.tags_json ? parseJson(row.tags_json) : null
  const candidate: WritingReference = {
    id: row.id,
    projectId: row.project_id,
    sourceType: sourceType.data,
    bookId: row.book_id ?? undefined,
    pageIndex: typeof row.page_index === 'number' ? row.page_index : undefined,
    pageLabel: row.page_label ?? undefined,
    rects: parseRects(row.rects_json),
    title: row.title ?? undefined,
    author: row.author ?? undefined,
    sourceTitle: row.source_title ?? undefined,
    sourceAuthor: row.source_author ?? undefined,
    sourceYear: typeof row.source_year === 'number' ? row.source_year : undefined,
    sourceFileHash: row.source_file_hash ?? undefined,
    tags: Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : undefined,
    snippetText: row.snippet_text,
    createdAt: row.created_at,
  }
  const parsed = writingReferenceSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}
