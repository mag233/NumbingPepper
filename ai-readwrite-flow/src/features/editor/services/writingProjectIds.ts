export const ACTIVE_PROJECT_KEY = 'ai-readwrite-flow-writing-active-project'
export const ACTIVE_PROJECT_NONE = '__none__'

export const readActiveProjectSelection = (): { id: string | null; explicitNone: boolean } => {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY)
    if (!raw || !raw.trim()) return { id: null, explicitNone: false }
    if (raw === ACTIVE_PROJECT_NONE) return { id: null, explicitNone: true }
    return { id: raw, explicitNone: false }
  } catch {
    return { id: null, explicitNone: false }
  }
}

export const readActiveProjectId = (): string | null => readActiveProjectSelection().id

export const writeActiveProjectId = (id: string | null, explicitNone?: boolean) => {
  try {
    if (!id) {
      if (explicitNone) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, ACTIVE_PROJECT_NONE)
        return
      }
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
      return
    }
    localStorage.setItem(ACTIVE_PROJECT_KEY, id)
  } catch {
    // ignore
  }
}

export const generateProjectId = () => {
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID()
  return `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}
