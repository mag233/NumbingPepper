export const ACTIVE_PROJECT_KEY = 'ai-readwrite-flow-writing-active-project'

export const readActiveProjectId = (): string | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY)
    return raw && raw.trim() ? raw : null
  } catch {
    return null
  }
}

export const writeActiveProjectId = (id: string | null) => {
  try {
    if (!id) {
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

