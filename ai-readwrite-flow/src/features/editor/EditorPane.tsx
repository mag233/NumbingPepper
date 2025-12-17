import { useEffect, useMemo, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Command, Sparkles, Wand2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import { useDraftPersistence } from './hooks/useDraftPersistence'
import { draftIdForProject } from './services/draftIds'
import WriterProjectPicker from './components/WriterProjectPicker'
import useWriterProjectStore from './stores/writerProjectStore'
import useWriterContextStore from './stores/writerContextStore'
import WriterContextPanel from './components/WriterContextPanel'
import useWriterReferencesStore from './stores/writerReferencesStore'
import WriterReferencesPanel from './components/WriterReferencesPanel'
import { extractTagPathsFromTipTapDoc } from './services/writerTags'

type Props = {
  onCommand: (prompt: string) => void
}

const commands = [
  { label: 'Continue Writing', prompt: 'Continue writing from this context.' },
  { label: 'Fix Grammar', prompt: 'Check and correct grammar.' },
  { label: 'Summarize', prompt: 'Summarize the key points above.' },
]

const EditorPane = ({ onCommand }: Props) => {
  const [showMenu, setShowMenu] = useState(false)
  const { hydrate, activeProjectId } = useWriterProjectStore()
  const setProjectTags = useWriterProjectStore((s) => s.setProjectTags)
  const hydrateContext = useWriterContextStore((s) => s.hydrate)
  const flushContext = useWriterContextStore((s) => s.flush)
  const hydrateReferences = useWriterReferencesStore((s) => s.hydrate)
  useEffect(() => {
    void hydrate()
  }, [hydrate])
  useEffect(() => {
    void hydrateContext(activeProjectId)
    void hydrateReferences(activeProjectId)
    return () => {
      void flushContext()
    }
  }, [activeProjectId, flushContext, hydrateContext, hydrateReferences])
  const draftId = useMemo(() => draftIdForProject(activeProjectId), [activeProjectId])
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Start writing. Type "/" to open AI commands; responses will be inserted at the cursor.',
        }),
      ],
      content: '<p></p>',
    },
    [draftId],
  )

  useDraftPersistence({ editor, draftId })

  useEffect(() => {
    if (!editor) return
    if (!activeProjectId) return
    const timerRef = { current: 0 as number | null }
    const schedule = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const tags = extractTagPathsFromTipTapDoc(editor.getJSON())
        setProjectTags(activeProjectId, tags)
      }, 400)
    }
    editor.on('update', schedule)
    schedule()
    return () => {
      editor.off('update', schedule)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [activeProjectId, editor, setProjectTags])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === '/' && editor?.isFocused) {
        setShowMenu(true)
        setTimeout(() => setShowMenu(false), 3500)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editor])

  const slashCommands = useMemo(
    () =>
      commands.map((command) => (
        <button
          key={command.label}
          onClick={() => {
            onCommand(command.prompt)
            editor?.commands.insertContent(`<p class="text-slate-200">/ ${command.prompt}</p>`)
            setShowMenu(false)
          }}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-100 hover:border-sky-500"
        >
          <span>{command.label}</span>
          <Wand2 className="size-4 text-sky-300" />
        </button>
      )),
    [editor, onCommand],
  )

  return (
    <Card
      title="Writer / TipTap"
      action={
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <WriterProjectPicker />
          <span className="inline-flex items-center gap-2">
            <Command className="size-4" />
            Type "/" to open commands
          </span>
        </div>
      }
    >
      <div className="relative rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
        <EditorContent editor={editor} className="prose prose-invert max-w-none text-slate-100" />
        {showMenu && (
          <div className="absolute left-3 top-3 z-10 grid gap-2 rounded-xl border border-slate-800/70 bg-slate-950/90 p-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
              <Sparkles className="size-4 text-amber-300" />
              Quick Commands
            </div>
            {slashCommands}
          </div>
        )}
        <WriterContextPanel />
        <WriterReferencesPanel />
      </div>
    </Card>
  )
}

export default EditorPane
