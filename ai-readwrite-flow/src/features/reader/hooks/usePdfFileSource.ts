import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { isTauri } from '../../../lib/isTauri'

type ActiveItem = {
  id: string
  filePath?: string
  url?: string
}

type Result = {
  fileSrc?: string
  blockedReason?: string
}

const normalizePath = (path: string) => path.replace(/\\/g, '/')

export const usePdfFileSource = (activeItem?: ActiveItem): Result => {
  const [fileSrc, setFileSrc] = useState<string | undefined>(undefined)
  const [blockedReason, setBlockedReason] = useState<string | undefined>(undefined)
  const [loadedForId, setLoadedForId] = useState<string | null>(null)

  const normalizedPath = (() => {
    if (!activeItem?.filePath) return undefined
    if (activeItem.filePath.startsWith('data:')) return activeItem.filePath
    if (activeItem.filePath.startsWith('blob:')) return activeItem.filePath
    return normalizePath(activeItem.filePath)
  })()

  const resolvedFile = activeItem?.url ?? normalizedPath

  const activeId = activeItem?.id
  const tauri = isTauri()

  const isWebBlocked =
    !tauri &&
    normalizedPath !== undefined &&
    !normalizedPath.startsWith('data:') &&
    !normalizedPath.startsWith('blob:')

  const effectiveBlockedReason =
    activeId && isWebBlocked
      ? 'This file was imported in the app; re-import in web to view.'
      : loadedForId === activeId
        ? blockedReason
        : undefined

  const effectiveFileSrc = (() => {
    if (!activeId) return undefined
    if (!tauri) return isWebBlocked ? undefined : resolvedFile
    if (normalizedPath?.startsWith('data:') || normalizedPath?.startsWith('blob:')) return resolvedFile
    if (!normalizedPath) return resolvedFile
    return loadedForId === activeId ? fileSrc : undefined
  })()

  useEffect(() => {
    if (!activeId) return
    if (!tauri) return
    if (normalizedPath?.startsWith('data:') || normalizedPath?.startsWith('blob:')) return
    if (!normalizedPath) return

    void invoke<string>('read_file_base64', { path: normalizedPath })
      .then((data) => {
        setLoadedForId(activeId)
        setBlockedReason(undefined)
        setFileSrc(`data:application/pdf;base64,${data}`)
      })
      .catch((error) => {
        console.error('[usePdfFileSource] read_file_base64 failed', error)
        try {
          setLoadedForId(activeId)
          setBlockedReason(undefined)
          setFileSrc(convertFileSrc(normalizedPath))
        } catch (fallbackError) {
          console.error('[usePdfFileSource] convertFileSrc failed', fallbackError)
          setLoadedForId(activeId)
          setFileSrc(undefined)
          setBlockedReason('Failed to resolve PDF path.')
        }
      })
  }, [activeId, normalizedPath, tauri])

  return { fileSrc: effectiveFileSrc, blockedReason: effectiveBlockedReason }
}
