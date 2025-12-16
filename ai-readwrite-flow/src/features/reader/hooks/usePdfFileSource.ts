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

  const normalizedPath = (() => {
    if (!activeItem?.filePath) return undefined
    if (activeItem.filePath.startsWith('data:')) return activeItem.filePath
    if (activeItem.filePath.startsWith('blob:')) return activeItem.filePath
    return normalizePath(activeItem.filePath)
  })()

  const resolvedFile = activeItem?.url ?? normalizedPath

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileSrc(undefined)
    setBlockedReason(undefined)
    if (!activeItem?.id) return

    const tauri = isTauri()
    const isWebBlocked =
      !tauri &&
      normalizedPath !== undefined &&
      !normalizedPath.startsWith('data:') &&
      !normalizedPath.startsWith('blob:')

    if (!tauri) {
      if (isWebBlocked) {
        setBlockedReason('This file was imported in the app; re-import in web to view.')
        return
      }
      setFileSrc(resolvedFile)
      return
    }

    if (normalizedPath?.startsWith('data:') || normalizedPath?.startsWith('blob:')) {
      setFileSrc(resolvedFile)
      return
    }

    if (!normalizedPath) {
      setFileSrc(resolvedFile)
      return
    }

    void invoke<string>('read_file_base64', { path: normalizedPath })
      .then((data) => setFileSrc(`data:application/pdf;base64,${data}`))
      .catch((error) => {
        console.error('[usePdfFileSource] read_file_base64 failed', error)
        try {
          setFileSrc(convertFileSrc(normalizedPath))
        } catch (fallbackError) {
          console.error('[usePdfFileSource] convertFileSrc failed', fallbackError)
          setBlockedReason('Failed to resolve PDF path.')
        }
      })
  }, [activeItem?.id, activeItem?.filePath, activeItem?.url, normalizedPath, resolvedFile])

  return { fileSrc, blockedReason }
}
