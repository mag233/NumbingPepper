import { z } from 'zod'

export const LOCAL_PROJECTS_KEY = 'ai-readwrite-flow-writing-projects'
export const LOCAL_CONTENT_KEY = (projectId: string) => `ai-readwrite-flow-writing-content:${projectId}`
export const LOCAL_CONTEXT_KEY = (projectId: string) => `ai-readwrite-flow-writing-context:${projectId}`
export const LOCAL_REFS_KEY = (projectId: string) => `ai-readwrite-flow-writing-references:${projectId}`
export const LOCAL_MEMBERSHIP_KEY = (projectId: string) => `ai-readwrite-flow-writing-membership:${projectId}`

export const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const readLocalArray = <T>(key: string, schema: z.ZodType<T>) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = parseJson(raw)
    if (!Array.isArray(parsed)) return []
    const out: T[] = []
    for (const item of parsed) {
      const result = schema.safeParse(item)
      if (result.success) out.push(result.data)
    }
    return out
  } catch {
    return []
  }
}

export const writeLocalArray = (key: string, items: unknown[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export const writeLocalObject = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const removeLocalKey = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

