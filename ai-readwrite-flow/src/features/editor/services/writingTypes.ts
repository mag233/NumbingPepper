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

export const writingArtifactTypeSchema = z.enum(['kickoff', 'definition', 'explanation', 'rewrite', 'polish'])
export type WritingArtifactType = z.infer<typeof writingArtifactTypeSchema>

export const writingArtifactScopeSchema = z.object({
  includeContext: z.boolean(),
  includeIncludedReferences: z.boolean(),
})
export type WritingArtifactScope = z.infer<typeof writingArtifactScopeSchema>

export const writingArtifactInputSnapshotSchema = z.object({
  prompt: z.string(),
  contextText: z.string(),
  references: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().optional(),
      snippetText: z.string().min(1),
      bookId: z.string().optional(),
      pageIndex: z.number().int().positive().optional(),
    }),
  ),
})
export type WritingArtifactInputSnapshot = z.infer<typeof writingArtifactInputSnapshotSchema>

export const writingArtifactSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  type: writingArtifactTypeSchema,
  title: z.string().min(1),
  contentText: z.string(),
  scope: writingArtifactScopeSchema,
  inputSnapshot: writingArtifactInputSnapshotSchema,
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})
export type WritingArtifact = z.infer<typeof writingArtifactSchema>

export const writingSnapshotSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  note: z.string().optional(),
  contentMarkdown: z.string(),
  createdAt: z.number().int().nonnegative(),
})
export type WritingSnapshot = z.infer<typeof writingSnapshotSchema>
