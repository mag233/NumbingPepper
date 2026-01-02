import { z } from 'zod'

const webhookUrlSchema = z.string().trim().url()

export type FlomoPostResult = { ok: true } | { ok: false; status?: number; error: string }

export const postToFlomo = async (webhookUrl: string, content: string): Promise<FlomoPostResult> => {
  const parsed = webhookUrlSchema.safeParse(webhookUrl)
  if (!parsed.success) return { ok: false, error: 'Missing or invalid Flomo webhook URL' }
  const trimmed = content.trim()
  if (!trimmed) return { ok: false, error: 'Empty content' }

  try {
    const resp = await fetch(parsed.data, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
    if (!resp.ok) return { ok: false, status: resp.status, error: `HTTP ${resp.status}` }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Request failed' }
  }
}

