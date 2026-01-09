import { create } from 'zustand'
import { writingSnapshotSchema } from '../services/writingTypes'
import type { WritingSnapshot } from '../services/writingTypes'
import { generateSnapshotId } from '../services/writingSnapshotIds'
import { writerSnapshotsRepo } from '../services/writerSnapshotsRepo'

interface WriterSnapshotsState {
  snapshots: WritingSnapshot[]
  hydrate: () => Promise<void>
  createSnapshot: (projectId: string, contentMarkdown: string, title: string, note?: string) => Promise<WritingSnapshot>
  deleteSnapshot: (snapshotId: string) => Promise<void>
  duplicateSnapshot: (snapshotId: string, title: string, note?: string) => Promise<WritingSnapshot | null>
}

const useWriterSnapshotsStore = create<WriterSnapshotsState>((set, get) => ({
  snapshots: [],

  hydrate: async () => {
    const snapshots = await writerSnapshotsRepo.hydrate()
    set({ snapshots })
  },
  createSnapshot: async (projectId, contentMarkdown, title, note) => {
    const snapshot = writingSnapshotSchema.parse({
      id: generateSnapshotId(),
      projectId,
      title: title.trim() || `Snapshot at ${new Date().toLocaleString()}`,
      note: note?.trim() || undefined,
      contentMarkdown,
      createdAt: Date.now(),
    })
    set((state) => ({ snapshots: [...state.snapshots, snapshot] }))
    void writerSnapshotsRepo.create(snapshot)
    return snapshot
  },

  deleteSnapshot: async (snapshotId) => {
    set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== snapshotId) }))
    void writerSnapshotsRepo.delete(snapshotId)
  },

  duplicateSnapshot: async (snapshotId, title, note) => {
    const state = get()
    const source = state.snapshots.find((s) => s.id === snapshotId)
    if (!source) return null

    const duplicate = writingSnapshotSchema.parse({
      id: generateSnapshotId(),
      projectId: source.projectId,
      title: title.trim() || source.title,
      note: note?.trim() || undefined,
      contentMarkdown: source.contentMarkdown,
      createdAt: Date.now(),
    })
    set((prevState) => ({ snapshots: [...prevState.snapshots, duplicate] }))
    void writerSnapshotsRepo.create(duplicate)
    return duplicate
  },
}))

export default useWriterSnapshotsStore
