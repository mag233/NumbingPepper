import { z } from 'zod'
import type { BookRecord, LastReadPosition } from './books'

export const lastReadPositionSchema: z.ZodType<LastReadPosition> = z.object({
  page: z.coerce.number().int().nonnegative(),
  scroll_y: z.coerce.number().optional(),
  zoom: z.coerce.number().optional(),
  fit_mode: z.union([z.literal('manual'), z.literal('fitWidth'), z.literal('fitPage')]).optional(),
})

export const bookRecordSchema: z.ZodType<BookRecord> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().optional(),
  coverPath: z.string().optional(),
  filePath: z.string().min(1),
  format: z.string().min(1),
  fileHash: z.string().optional(),
  fileSize: z.coerce.number().int().nonnegative(),
  mtime: z.coerce.number().int().nonnegative().optional(),
  lastOpenedAt: z.coerce.number().int().nonnegative().optional(),
  deletedAt: z.coerce.number().int().nonnegative().optional(),
  processedForSearch: z.boolean().optional(),
  addedAt: z.coerce.number().int().nonnegative(),
  lastReadPosition: lastReadPositionSchema.optional(),
})

