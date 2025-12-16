import type { ReactNode } from 'react'

const CRASH_FLAG_KEY = 'arwf:crash'

const normalizeKey = (value: string) => value.trim().toLowerCase()

const getCrashKey = () => {
  if (!import.meta.env.DEV) return null
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('crash')
    if (fromUrl && fromUrl.length) return normalizeKey(fromUrl)
  } catch {
    // ignore
  }
  try {
    const fromStorage = localStorage.getItem(CRASH_FLAG_KEY)
    if (fromStorage && fromStorage.length) return normalizeKey(fromStorage)
  } catch {
    // ignore
  }
  return null
}

type Props = { title: string; children: ReactNode }

const CrashProbe = ({ title, children }: Props) => {
  const crashKey = getCrashKey()
  if (crashKey && crashKey === normalizeKey(title)) {
    throw new Error(`QA crash: ${title}`)
  }
  return children
}

export default CrashProbe

