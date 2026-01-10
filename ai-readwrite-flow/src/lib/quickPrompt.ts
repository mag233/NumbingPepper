import { z } from 'zod'

export type QuickPrompt = {
  text: string
  autoSend?: boolean
  meta?: unknown
}

type ApplyQuickPromptOptions = {
  quickPrompt?: QuickPrompt
  onConsume?: () => void
  setDraft: (text: string) => void
  doSend: (text: string, meta?: unknown) => void
  focusInput: () => void
  afterAutoSendFocus?: boolean
}

export const applyQuickPrompt = ({
  quickPrompt,
  onConsume,
  setDraft,
  doSend,
  focusInput,
  afterAutoSendFocus,
}: ApplyQuickPromptOptions) => {
  if (!quickPrompt) return
  const { text, autoSend, meta } = quickPrompt
  window.setTimeout(() => setDraft(text), 0)
  if (autoSend) {
    window.setTimeout(() => {
      void doSend(text, meta)
      setDraft('')
      if (afterAutoSendFocus) {
        window.setTimeout(focusInput, 0)
      }
    }, 0)
  } else {
    window.setTimeout(focusInput, 0)
  }
  onConsume?.()
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
