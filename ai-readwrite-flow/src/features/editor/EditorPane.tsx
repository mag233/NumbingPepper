import { useEffect, useMemo, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Command, Eye, Pencil, Sparkles, Wand2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import { useDraftPersistence } from './hooks/useDraftPersistence'
import { draftIdForProject } from './services/draftIds'
import {
  insertPlainTextAsParagraphs,
  insertPlainTextAsParagraphsAt,
  replaceRangeWithPlainTextAsParagraphs,
  scrollEditorToNeedle,
} from './services/editorCommands'
import useWriterProjectStore from './stores/writerProjectStore'
import useWriterContextStore from './stores/writerContextStore'
import WriterContextPanel from './components/WriterContextPanel'
import useWriterReferencesStore from './stores/writerReferencesStore'
import { extractTagPathsFromTipTapDoc } from './services/writerTags'
import useWriterArtifactsStore from './stores/writerArtifactsStore'
import { tipTapDocToMarkdownSource } from './services/tiptapMarkdown'
import useWriterOutlineStore from './stores/writerOutlineStore'
import useWriterEditorCommandStore from './stores/writerEditorCommandStore'
import WriterSelectionBubbleMenu from './components/WriterSelectionBubbleMenu'
import useWriterSelectionApplyStore from './stores/writerSelectionApplyStore'

type Props = {
  onQuickPrompt: (prompt: { text: string; autoSend: boolean; meta?: unknown }) => void
}

const commands = [
  { label: 'Continue Writing', prompt: 'Continue writing from this context.' },
  { label: 'Fix Grammar', prompt: 'Check and correct grammar.' },
  { label: 'Summarize', prompt: 'Summarize the key points above.' },
]
const EditorPane = ({ onQuickPrompt }: Props) => {
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
  const setOutlineFromMarkdown = useWriterOutlineStore((s) => s.setFromMarkdown)
  const consumeScrollRequest = useWriterEditorCommandStore((s) => s.consumeScrollRequest)
  const pendingScroll = useWriterEditorCommandStore((s) => s.pendingScroll)
  const consumeSelectionApply = useWriterSelectionApplyStore((s) => s.consume)
  const pendingSelectionApply = useWriterSelectionApplyStore((s) => s.pending)
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
          horizontalRule: false,
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

  const { status: saveStatus, lastSavedAt, flushNow } = useDraftPersistence({ editor, draftId })

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
    if (!pendingSelectionApply) return
    if (!editor) return
    const req = consumeSelectionApply()
    if (!req) return
    if (req.mode === 'replace') {
      replaceRangeWithPlainTextAsParagraphs(editor, { from: req.selection.from, to: req.selection.to, text: req.text })
      return
    }
    insertPlainTextAsParagraphsAt(editor, { pos: req.selection.to, text: req.text })
  }, [consumeSelectionApply, editor, pendingSelectionApply])

  useEffect(() => {
    if (!editor) return
    if (!pendingScroll) return
    const req = consumeScrollRequest()
    if (!req) return
    scrollEditorToNeedle(editor, req)
  }, [consumeScrollRequest, editor, pendingScroll])

  useEffect(() => {
    if (!editor) return
    if (!activeProjectId) return
    const timerRef = { current: 0 as number | null }
    const schedule = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const doc = editor.getJSON()
        const tags = extractTagPathsFromTipTapDoc(doc)
        setProjectTags(activeProjectId, tags)
        setOutlineFromMarkdown(activeProjectId, tipTapDocToMarkdownSource(doc))
      }, 400)
    }
    editor.on('update', schedule)
    schedule()
    return () => {
      editor.off('update', schedule)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [activeProjectId, editor, setOutlineFromMarkdown, setProjectTags])

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
            onQuickPrompt({ text: command.prompt, autoSend: false })
            editor?.commands.insertContent(`<p>/ ${command.prompt}</p>`)
            setShowMenu(false)
          }}
          className="flex items-center justify-between gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-left text-sm text-ink-primary hover:border-accent"
        >
          <span>{command.label}</span>
          <Wand2 className="size-4 text-accent" />
        </button>
      )),
    [editor, onQuickPrompt],
  )

  const previewSource = isPreview && editor ? tipTapDocToMarkdownSource(editor.getJSON()) : ''

  const activeTitle = useMemo(() => {
    const active = projects.find((p) => p.id === activeProjectId)
    return active?.title ?? 'No project'
  }, [activeProjectId, projects])

  const saveLabel = useMemo(() => {
    if (saveStatus === 'saving') return 'Saving…'
    if (saveStatus === 'error') return 'Save failed'
    if (!lastSavedAt) return 'Not saved yet'
    const time = new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `Saved ${time}`
  }, [lastSavedAt, saveStatus])

  return (
    <Card
      title="Writer / TipTap"
      action={
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="max-w-[12rem] truncate text-xs text-ink-muted" title={activeTitle}>
            Active: {activeTitle}
          </span>
          <span
            className={`rounded-lg border px-2 py-1 ${
              saveStatus === 'error'
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-chrome-border/70 bg-surface-raised/40 text-ink-muted'
            }`}
            title={lastSavedAt ? new Date(lastSavedAt).toISOString() : undefined}
          >
            {saveLabel}
          </span>
          <button
            type="button"
            onClick={() => void flushNow()}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent"
          >
            Save
          </button>
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
            <>
              {editor && (
                <WriterSelectionBubbleMenu
                  editor={editor}
                  disabled={showMenu || isPreview}
                  onQuickPrompt={onQuickPrompt}
                />
              )}
              <EditorContent
                editor={editor}
                className="h-full max-w-none text-ink-primary [&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
              />
            </>
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
