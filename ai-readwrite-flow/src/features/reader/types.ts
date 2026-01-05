import { z } from 'zod'

export const highlightColorSchema = z.enum(['yellow', 'red', 'blue'])
export type HighlightColor = z.infer<typeof highlightColorSchema>

export const highlightRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  normalized: z.literal(true),
})
export type HighlightRect = z.infer<typeof highlightRectSchema>

export const highlightContextRangeSchema = z.object({
  page: z.number().int().min(1),
  rects: z.array(highlightRectSchema).min(1),
  zoom: z.number().nullable().optional(),
})
export type HighlightContextRange = z.infer<typeof highlightContextRangeSchema>

export const highlightSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  content: z.string(),
  color: highlightColorSchema,
  note: z.string().nullable().optional(),
  contextRange: highlightContextRangeSchema,
  createdAt: z.number().int(),
})
export type Highlight = z.infer<typeof highlightSchema>

export type SelectionInfo = {
  text: string
  page: number
  rects: HighlightRect[]
}

export const bookmarkSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  page: z.number().int().min(1),
  pageLabel: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})
export type Bookmark = z.infer<typeof bookmarkSchema>
