import { useEffect, useMemo, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor as TipTapEditor, JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Command, Eye, Pencil, Sparkles, Wand2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import { useDraftPersistence } from './hooks/useDraftPersistence'
import { draftIdForProject } from './services/draftIds'
import useWriterProjectStore from './stores/writerProjectStore'
import useWriterContextStore from './stores/writerContextStore'
import WriterContextPanel from './components/WriterContextPanel'
import useWriterReferencesStore from './stores/writerReferencesStore'
import { extractTagPathsFromTipTapDoc } from './services/writerTags'
import useWriterArtifactsStore from './stores/writerArtifactsStore'

type Props = {
  onCommand: (prompt: string) => void
}

const commands = [
  { label: 'Continue Writing', prompt: 'Continue writing from this context.' },
  { label: 'Fix Grammar', prompt: 'Check and correct grammar.' },
  { label: 'Summarize', prompt: 'Summarize the key points above.' },
]

const insertPlainTextAsParagraphs = (editor: TipTapEditor, text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return
  const paragraphs = normalized.split(/\n{2,}/g)
  const content: JSONContent[] = paragraphs.map((p) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: p }],
  }))
  editor.chain().focus().insertContent(content).run()
}

const EditorPane = ({ onCommand }: Props) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const { hydrate, activeProjectId } = useWriterProjectStore()
  const projects = useWriterProjectStore((s) => s.projects)
  const setProjectTags = useWriterProjectStore((s) => s.setProjectTags)
  const hydrateContext = useWriterContextStore((s) => s.hydrate)
  const flushContext = useWriterContextStore((s) => s.flush)
  const hydrateReferences = useWriterReferencesStore((s) => s.hydrate)
  const pendingInsert = useWriterArtifactsStore((s) => s.pendingInsert)
  const consumeInsert = useWriterArtifactsStore((s) => s.consumeInsert)
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
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          blockquote: false,
          codeBlock: false,
          bold: false,
          italic: false,
          strike: false,
          code: false,
        }),
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
    editor?.setEditable(!isPreview)
  }, [editor, isPreview])

  useEffect(() => {
    if (!pendingInsert) return
    if (!editor) return
    insertPlainTextAsParagraphs(editor, pendingInsert.contentText)
    consumeInsert()
  }, [consumeInsert, editor, pendingInsert])

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
            editor?.commands.insertContent(`<p>/ ${command.prompt}</p>`)
            setShowMenu(false)
          }}
          className="flex items-center justify-between gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-left text-sm text-ink-primary hover:border-accent"
        >
          <span>{command.label}</span>
          <Wand2 className="size-4 text-accent" />
        </button>
      )),
    [editor, onCommand],
  )

  const previewSource =
    isPreview && editor ? editor.getText({ blockSeparator: '\n' }).trimEnd() : ''

  const activeTitle = useMemo(() => {
    const active = projects.find((p) => p.id === activeProjectId)
    return active?.title ?? 'No project'
  }, [activeProjectId, projects])

  return (
    <Card
      title="Writer / TipTap"
      action={
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="max-w-[12rem] truncate text-xs text-ink-muted" title={activeTitle}>
            Active: {activeTitle}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsPreview((value) => !value)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent"
            aria-pressed={isPreview}
          >
            {isPreview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          <span className="inline-flex items-center gap-2">
            <Command className="size-4" />
            Type "/" to open commands
          </span>
        </div>
      }
      className="flex h-full flex-col"
    >
      <div className="relative flex min-h-0 flex-1 flex-col rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3">
        <div className="min-h-0 flex-[2_1_0%] overflow-auto pr-1">
          {isPreview ? (
            <div className="max-w-none rounded-lg border border-chrome-border/70 bg-surface-base/40 p-4 text-ink-primary [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:text-accent/90 [&_blockquote]:border-l-2 [&_blockquote]:border-chrome-border [&_blockquote]:pl-3 [&_blockquote]:text-ink-primary [&_code]:rounded [&_code]:bg-surface-raised/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-ink-primary [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-surface-raised/70 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewSource || '*(empty)*'}
              </ReactMarkdown>
              {import.meta.env.DEV && (
                <details className="mt-4 rounded-lg border border-chrome-border/70 bg-surface-raised/40 p-3 text-xs text-ink-primary">
                  <summary className="cursor-pointer select-none text-ink-muted">Debug: raw markdown</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">{previewSource || '(empty)'}</pre>
                </details>
              )}
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="h-full max-w-none text-ink-primary [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
            />
          )}
          {showMenu && (
            <div className="absolute left-3 top-3 z-10 grid gap-2 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
                <Sparkles className="size-4 text-amber-300" />
                Quick Commands
              </div>
              {slashCommands}
            </div>
          )}
        </div>
        <div className="min-h-0 flex-[1_1_0%] overflow-auto pr-1">
          <WriterContextPanel fill noTopMargin />
        </div>
      </div>
    </Card>
  )
}

export default EditorPane
