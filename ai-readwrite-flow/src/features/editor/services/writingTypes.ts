import { z } from 'zod'

export const writingSourceTypeSchema = z.enum(['highlight', 'manual', 'file'])
export type WritingSourceType = z.infer<typeof writingSourceTypeSchema>

export const rectSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite(),
  h: z.number().finite(),
})
export type Rect = z.infer<typeof rectSchema>

export const writingProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})
export type WritingProject = z.infer<typeof writingProjectSchema>

export const writingContentSchema = z.object({
  projectId: z.string().min(1),
  contentText: z.string(),
  updatedAt: z.number().int().nonnegative(),
})
export type WritingContent = z.infer<typeof writingContentSchema>

export const writingContextSchema = z.object({
  projectId: z.string().min(1),
  contextText: z.string(),
  updatedAt: z.number().int().nonnegative(),
})
export type WritingContext = z.infer<typeof writingContextSchema>

export const writingReferenceSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  sourceType: writingSourceTypeSchema,
  bookId: z.string().min(1).optional(),
  pageIndex: z.number().int().positive().optional(),
  rects: z.array(rectSchema).optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  snippetText: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
})
export type WritingReference = z.infer<typeof writingReferenceSchema>

export const writingContextMembershipSchema = z.object({
  projectId: z.string().min(1),
  referenceId: z.string().min(1),
  included: z.boolean(),
  orderIndex: z.number().int().nonnegative(),
})
export type WritingContextMembership = z.infer<typeof writingContextMembershipSchema>

