import { useEffect, useMemo, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Command, Sparkles, Wand2 } from 'lucide-react'
import Card from '../../shared/components/Card'

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing. Type "/" to open AI commands; responses will be inserted at the cursor.',
      }),
    ],
    content:
      '<p>Welcome to AI-ReadWrite-Flow: write here, chat on the right, read on the left.</p><p>Try typing / to open commands.</p>',
  })

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
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Command className="size-4" />
          Type "/" to open commands
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
      </div>
    </Card>
  )
}

export default EditorPane
