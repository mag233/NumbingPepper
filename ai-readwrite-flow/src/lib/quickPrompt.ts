import { z } from 'zod'

export type QuickPrompt = {
  text: string
  autoSend?: boolean
  meta?: unknown
}

const writerSelectionMetaSchema = z.object({
  type: z.literal('writer-selection'),
  action: z.string(),
  selection: z.object({
    from: z.number().int().nonnegative(),
    to: z.number().int().nonnegative(),
  }),
  rewriteTone: z.string().optional(),
  translateTargetLanguage: z.string().optional(),
})

export type WriterSelectionQuickPromptMeta = z.infer<typeof writerSelectionMetaSchema>

export const parseWriterSelectionQuickPromptMeta = (value: unknown): WriterSelectionQuickPromptMeta | null => {
  const parsed = writerSelectionMetaSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

