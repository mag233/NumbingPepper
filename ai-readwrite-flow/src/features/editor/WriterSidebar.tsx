import { useState } from 'react'
import Card from '../../shared/components/Card'
import WriterProjectPicker from './components/WriterProjectPicker'
import WriterOutlinePanel from './components/WriterOutlinePanel'
import WriterReferencesPanel from './components/WriterReferencesPanel'
import WriterSnapshotSaveDialog from './components/WriterSnapshotSaveDialog'
import WriterSnapshotModal from './components/WriterSnapshotModal'
import useWriterSnapshotsStore from './stores/writerSnapshotsStore'
import useWriterProjectStore from './stores/writerProjectStore'
import { markdownSourceToTipTapDoc, tipTapDocToMarkdownSource } from './services/tiptapMarkdown'
import type { Editor } from '@tiptap/react'
import type { WritingSnapshot } from './services/writingTypes'
import { useEffect } from 'react'

type Props = {
  isPreview?: boolean
  editor?: Editor
  flushNow?: () => Promise<boolean>
}

const WriterSidebar = ({ isPreview, editor, flushNow }: Props) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const snapshots = useWriterSnapshotsStore((s) => s.snapshots)
  const hydrateSnapshots = useWriterSnapshotsStore((s) => s.hydrate)
  const createSnapshot = useWriterSnapshotsStore((s) => s.createSnapshot)
  const deleteSnapshot = useWriterSnapshotsStore((s) => s.deleteSnapshot)
  const duplicateSnapshot = useWriterSnapshotsStore((s) => s.duplicateSnapshot)

  useEffect(() => {
    void hydrateSnapshots()
  }, [hydrateSnapshots])

  const projectSnapshots = snapshots.filter((s) => s.projectId === activeProjectId)

  const handleSaveSnapshot = async (title: string, note?: string) => {
    if (!editor) return
    const contentMarkdown = tipTapDocToMarkdownSource(editor.getJSON())
    await createSnapshot(activeProjectId ?? '', contentMarkdown, title, note)
    setShowSaveDialog(false)
  }

  const handleRestore = (snapshot: WritingSnapshot) => {
    if (!editor) return
    const nextDoc = markdownSourceToTipTapDoc(snapshot.contentMarkdown)
    editor.commands.setContent(nextDoc)
    editor.commands.focus('start')
    void flushNow?.()
  }

  const handleDuplicate = async (snapshot: WritingSnapshot, newTitle: string, newNote?: string) => {
    await duplicateSnapshot(snapshot.id, newTitle, newNote)
  }

  return (
    <Card title="Writer" className="flex h-full flex-col">
      <div className="mb-3">
        <WriterProjectPicker
          variant="sidebar"
          onSnapshotActions={{
            onSaveSnapshot: () => setShowSaveDialog(true),
            onShowHistory: () => setShowHistory(true),
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto space-y-3">
        <WriterOutlinePanel noTopMargin isPreview={isPreview} />
        <WriterReferencesPanel noTopMargin listClassName="max-h-none overflow-visible" />
      </div>

      {showSaveDialog && <WriterSnapshotSaveDialog onSave={handleSaveSnapshot} onCancel={() => setShowSaveDialog(false)} />}
      <WriterSnapshotModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        snapshots={projectSnapshots}
        onRestore={handleRestore}
        onDuplicate={handleDuplicate}
        onDelete={deleteSnapshot}
      />
    </Card>
  )
}

export default WriterSidebar
