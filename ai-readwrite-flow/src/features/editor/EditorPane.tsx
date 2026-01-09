import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Sparkles } from 'lucide-react'
import Card from '../../shared/components/Card'
import { useDraftPersistence } from './hooks/useDraftPersistence'
import { draftIdForProject } from './services/draftIds'
import { insertPlainTextAsParagraphs, scrollEditorToNeedle } from './services/editorCommands'
import { writerInsertFlashExtension } from './extensions/writerInsertFlashExtension'
import { useWriterInsertFlash } from './hooks/useWriterInsertFlash'
import { useWriterSelectionApplyEffect } from './hooks/useWriterSelectionApplyEffect'
import useWriterProjectStore from './stores/writerProjectStore'
import useWriterReferencesStore from './stores/writerReferencesStore'
import { extractTagPathsFromTipTapDoc } from './services/writerTags'
import useWriterArtifactsStore from './stores/writerArtifactsStore'
import { tipTapDocToMarkdownSource } from './services/tiptapMarkdown'
import useWriterOutlineStore from './stores/writerOutlineStore'
import useWriterEditorCommandStore from './stores/writerEditorCommandStore'
import WriterSelectionBubbleMenu from './components/WriterSelectionBubbleMenu'
import useWriterSelectionApplyStore from './stores/writerSelectionApplyStore'
import WriterSlashCommands from './components/WriterSlashCommands'
import WriterMarkdownPreview from './components/WriterMarkdownPreview'
import WriterSelectionApplyNotice from './components/WriterSelectionApplyNotice'
import WriterEditorActionBar from './components/WriterEditorActionBar'
import WriterSearchModal from './components/WriterSearchModal'

type Props = {
  onQuickPrompt: (prompt: { text: string; autoSend: boolean; meta?: unknown }) => void
  isPreview: boolean
  onIsPreviewChange: (isPreview: boolean) => void
  onEditorChange?: (state: { editor: Editor | null; flushNow: () => Promise<boolean> }) => void
}

const EditorPane = forwardRef<{ editor: Editor | null }, Props>(
  function EditorPane({ onQuickPrompt, isPreview, onIsPreviewChange, onEditorChange }, ref) {
  const [showMenu, setShowMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const { hydrate, activeProjectId } = useWriterProjectStore()
  const projects = useWriterProjectStore((s) => s.projects)
  const setProjectTags = useWriterProjectStore((s) => s.setProjectTags)
  const hydrateReferences = useWriterReferencesStore((s) => s.hydrate)
  const pendingInsert = useWriterArtifactsStore((s) => s.pendingInsert)
  const consumeInsert = useWriterArtifactsStore((s) => s.consumeInsert)
  const setOutlineFromMarkdown = useWriterOutlineStore((s) => s.setFromMarkdown)
  const consumeScrollRequest = useWriterEditorCommandStore((s) => s.consumeScrollRequest)
  const pendingScroll = useWriterEditorCommandStore((s) => s.pendingScroll)
  const selectionApplyNotice = useWriterSelectionApplyStore((s) => s.notice)
  const clearSelectionApplyNotice = useWriterSelectionApplyStore((s) => s.clearNotice)
  useEffect(() => {
    void hydrate()
  }, [hydrate])
  useEffect(() => {
    void hydrateReferences(activeProjectId)
  }, [activeProjectId, hydrateReferences])
  const activeProject = useMemo(() => projects.find((p) => p.id === activeProjectId) ?? null, [activeProjectId, projects])
  const effectiveProjectId = activeProject?.id ?? null
  const draftId = useMemo(() => draftIdForProject(effectiveProjectId), [effectiveProjectId])
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
        writerInsertFlashExtension,
      ],
      content: '<p></p>',
    },
    [draftId],
  )

  const { status: saveStatus, lastSavedAt, flushNow, justSaved } = useDraftPersistence({ editor, draftId })
  const { flash: flashInsertedRange } = useWriterInsertFlash({ editor })
  useWriterSelectionApplyEffect({ editor, onApplied: flashInsertedRange })


  useImperativeHandle(ref, () => ({ editor, flushNow }), [editor, flushNow])

  useEffect(() => {
    onEditorChange?.({ editor, flushNow })
  }, [editor, flushNow, onEditorChange])

  useEffect(() => {
    editor?.setEditable(!isPreview)
  }, [editor, isPreview])

  useEffect(() => {
    if (!pendingInsert) return
    if (!editor) return
    insertPlainTextAsParagraphs(editor, pendingInsert.contentText)
    consumeInsert()
  }, [consumeInsert, editor, pendingInsert])

  const scrollPreviewToHeading = useCallback(
    (req: { needle: string; title: string }) => {
      const host = previewRef.current
      if (!host) return false
      const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()
      const candidates = [req.title, req.needle, req.title.replace(/^#+\s*/, ''), req.needle.replace(/^#+\s*/, '')]
        .map((value) => normalize(value || ''))
        .filter(Boolean)
      if (!candidates.length) return false
      const headings = host.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6')
      for (const heading of headings) {
        const text = normalize(heading.textContent ?? '')
        if (!text) continue
        if (candidates.includes(text)) {
          heading.scrollIntoView({ block: 'center', behavior: 'smooth' })
          heading.classList.add('search-highlight-flash')
          if (typeof window !== 'undefined') {
            window.setTimeout(() => heading.classList.remove('search-highlight-flash'), 2500)
          }
          return true
        }
      }
      return false
    },
    [],
  )

  useEffect(() => {
    if (!pendingScroll) return
    const req = consumeScrollRequest()
    if (!req) return
    if (isPreview) {
      const handled = scrollPreviewToHeading(req)
      if (!handled && editor) {
        scrollEditorToNeedle(editor, req)
      }
      return
    }
    if (editor) {
      scrollEditorToNeedle(editor, req)
    }
  }, [consumeScrollRequest, editor, isPreview, pendingScroll, scrollPreviewToHeading])

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

  const previewSource = isPreview && editor ? tipTapDocToMarkdownSource(editor.getJSON()) : ''

  const activeTitle = activeProject?.title ?? 'No project'

  const saveLabel = useMemo(() => {
    if (saveStatus === 'saving') return 'Saving...'
    if (saveStatus === 'error') return 'Save failed'
    if (!lastSavedAt) return 'Not saved yet'
    const time = new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `Saved ${time}`
  }, [lastSavedAt, saveStatus])

  return (
    <Card
      title="Writer / TipTap"
      action={
        <WriterEditorActionBar
          activeTitle={activeTitle}
          saveLabel={saveLabel}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt ?? null}
          justSaved={justSaved}
          isPreview={isPreview}
          onSave={() => void flushNow()}
          onTogglePreview={() => onIsPreviewChange(!isPreview)}
          onOpenSearch={() => setShowSearch(true)}
        />
      }
      className="flex h-full min-h-0 flex-col"
    >
      <div className="relative flex min-h-0 flex-1 flex-col rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3">
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          {isPreview ? (
            <div ref={previewRef} className="h-full">
              <WriterMarkdownPreview source={previewSource} />
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
          {!isPreview && selectionApplyNotice && editor && (
            <WriterSelectionApplyNotice
              mode={selectionApplyNotice.mode}
              onUndo={() => {
                editor.commands.undo()
                clearSelectionApplyNotice()
                editor.commands.focus()
              }}
            />
          )}
          {showMenu && (
            <div className="absolute left-3 top-3 z-10 grid gap-2 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
                <Sparkles className="size-4 text-amber-300" />
                Quick Commands
              </div>
              <WriterSlashCommands editor={editor} onQuickPrompt={onQuickPrompt} onClose={() => setShowMenu(false)} />
            </div>
          )}
        </div>
      </div>
      <WriterSearchModal open={showSearch} onClose={() => setShowSearch(false)} editor={editor} />
    </Card>
  )

  }
)

export default EditorPane
