import { writingSnapshotSchema } from '../services/writingTypes'
import type { WritingSnapshot } from '../services/writingTypes'
import { isTauri } from '../../../lib/isTauri'

const SNAPSHOTS_STORAGE_KEY = 'writer-snapshots'

export const writerSnapshotsRepo = {
  async hydrate(): Promise<WritingSnapshot[]> {
    if (!isTauri()) {
      const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY)
      if (!raw) return []
      try {
        const data = JSON.parse(raw)
        return Array.isArray(data) ? data.filter((item) => writingSnapshotSchema.safeParse(item).success) : []
      } catch {
        return []
      }
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const rows = await invoke<{ snapshot_json: string }[]>('plugin:sqlite|query_writing_snapshots', {})
      return rows
        .map((row) => {
          try {
            return JSON.parse(row.snapshot_json)
          } catch {
            return null
          }
        })
        .filter((item): item is WritingSnapshot => item && writingSnapshotSchema.safeParse(item).success)
    } catch {
      // Fallback to localStorage if Tauri query fails
      const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY)
      if (!raw) return []
      try {
        const data = JSON.parse(raw)
        return Array.isArray(data) ? data.filter((item) => writingSnapshotSchema.safeParse(item).success) : []
      } catch {
        return []
      }
    }
  },

  async create(snapshot: WritingSnapshot): Promise<void> {
    const existing = await this.hydrate()
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify([...existing, snapshot]))

    if (!isTauri()) return

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('plugin:sqlite|insert_writing_snapshot', {
        id: snapshot.id,
        project_id: snapshot.projectId,
        title: snapshot.title,
        note: snapshot.note ?? null,
        content_markdown: snapshot.contentMarkdown,
        created_at: snapshot.createdAt,
        snapshot_json: JSON.stringify(snapshot),
      })
    } catch {
      // Silently fail and rely on localStorage fallback
    }
  },

  async delete(snapshotId: string): Promise<void> {
    if (!isTauri()) {
      const snapshots = await this.hydrate()
      const filtered = snapshots.filter((s) => s.id !== snapshotId)
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(filtered))
      return
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('plugin:sqlite|delete_writing_snapshot', { id: snapshotId })
    } catch {
      // Fallback: update localStorage
      const snapshots = await this.hydrate()
      const filtered = snapshots.filter((s) => s.id !== snapshotId)
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(filtered))
    }
  },
}
