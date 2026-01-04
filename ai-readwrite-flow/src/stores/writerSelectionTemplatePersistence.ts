import { z } from 'zod'
import { writerRewriteTones, writerSelectionTemplateIds } from './writerSelectionTemplateModel'
import type {
  WriterRewriteTone,
  WriterRewriteToneProfileOverrides,
  WriterSelectionTemplateId,
  WriterTemplateOverrides,
} from './writerSelectionTemplateModel'

type PersistedState = {
  useDefaults: boolean
  templateOverrides: WriterTemplateOverrides
  rewriteToneProfiles: WriterRewriteToneProfileOverrides
}

const STORAGE_KEY_V1 = 'ai-readwrite-flow-writer-selection-templates-v1'
export const STORAGE_KEY_V2 = 'ai-readwrite-flow-writer-selection-templates-v2'

const templateIdSchema = z.enum(writerSelectionTemplateIds)
const rewriteToneSchema = z.enum(writerRewriteTones)

const boundedString = (max: number) => z.string().max(max)

const rewriteToneProfileOverrideSchema = z.object({
  tone: rewriteToneSchema,
  label: boundedString(40).optional(),
  description: boundedString(500).optional(),
  directive: boundedString(200).optional(),
  examples: z.array(boundedString(300)).max(3).optional(),
})

const persistedV2Schema = z.object({
  useDefaults: z.boolean().optional(),
  templateOverrides: z
    .array(
      z.object({
        id: templateIdSchema,
        instruction: z.string(),
      }),
    )
    .optional(),
  rewriteToneProfiles: z.array(rewriteToneProfileOverrideSchema).optional(),
})

const persistedV1Schema = z.object({
  useDefaults: z.boolean().optional(),
  overrides: z
    .array(
      z.object({
        id: templateIdSchema,
        instruction: z.string(),
      }),
    )
    .optional(),
})

const buildTemplateOverrides = (
  rows: { id: WriterSelectionTemplateId; instruction: string }[] | undefined,
): WriterTemplateOverrides => {
  const overrides: WriterTemplateOverrides = {}
  for (const entry of rows ?? []) {
    overrides[entry.id] = { instruction: entry.instruction }
  }
  return overrides
}

const buildRewriteToneOverrides = (
  rows: { tone: WriterRewriteTone; label?: string; description?: string; directive?: string; examples?: string[] }[] | undefined,
): WriterRewriteToneProfileOverrides => {
  const overrides: WriterRewriteToneProfileOverrides = {}
  for (const entry of rows ?? []) {
    const { tone, ...rest } = entry
    overrides[tone] = rest
  }
  return overrides
}

const safeParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const loadWriterSelectionTemplatesState = (): PersistedState => {
  const empty: PersistedState = { useDefaults: false, templateOverrides: {}, rewriteToneProfiles: {} }
  const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
  if (rawV2) {
    const parsed = persistedV2Schema.safeParse(safeParseJson(rawV2))
    if (!parsed.success) return empty
    return {
      useDefaults: parsed.data.useDefaults ?? false,
      templateOverrides: buildTemplateOverrides(parsed.data.templateOverrides),
      rewriteToneProfiles: buildRewriteToneOverrides(parsed.data.rewriteToneProfiles),
    }
  }

  const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
  if (!rawV1) return empty
  const parsed = persistedV1Schema.safeParse(safeParseJson(rawV1))
  if (!parsed.success) return empty
  const migrated: PersistedState = {
    useDefaults: parsed.data.useDefaults ?? false,
    templateOverrides: buildTemplateOverrides(parsed.data.overrides),
    rewriteToneProfiles: {},
  }
  persistWriterSelectionTemplatesState(migrated)
  return migrated
}

const serializeTemplateOverrides = (overrides: WriterTemplateOverrides) =>
  Object.entries(overrides).flatMap(([id, value]) => (value ? [{ id, instruction: value.instruction }] : []))

const serializeToneOverrides = (overrides: WriterRewriteToneProfileOverrides) =>
  Object.entries(overrides).flatMap(([tone, value]) => (value ? [{ tone, ...value }] : []))

export const persistWriterSelectionTemplatesState = (state: PersistedState) => {
  try {
    localStorage.setItem(
      STORAGE_KEY_V2,
      JSON.stringify({
        useDefaults: state.useDefaults,
        templateOverrides: serializeTemplateOverrides(state.templateOverrides),
        rewriteToneProfiles: serializeToneOverrides(state.rewriteToneProfiles),
      }),
    )
  } catch (error) {
    console.warn('Failed to persist writer selection templates', error)
  }
}

