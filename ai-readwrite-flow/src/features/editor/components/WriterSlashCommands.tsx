import { Wand2 } from 'lucide-react'
import type { Editor } from '@tiptap/core'

type CommandDef = { label: string; prompt: string }

const DEFAULT_COMMANDS: CommandDef[] = [
  { label: 'Continue Writing', prompt: 'Continue writing from this context.' },
  { label: 'Fix Grammar', prompt: 'Check and correct grammar.' },
  { label: 'Summarize', prompt: 'Summarize the key points above.' },
]

type Props = {
  editor: Editor | null
  onQuickPrompt: (prompt: { text: string; autoSend: boolean; meta?: unknown }) => void
  onClose: () => void
  commands?: CommandDef[]
}

const WriterSlashCommands = ({ editor, onQuickPrompt, onClose, commands = DEFAULT_COMMANDS }: Props) => {
  return (
    <>
      {commands.map((command) => (
        <button
          key={command.label}
          onClick={() => {
            onQuickPrompt({ text: command.prompt, autoSend: false })
            editor?.commands.insertContent(`<p>/ ${command.prompt}</p>`)
            onClose()
          }}
          className="flex items-center justify-between gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-left text-sm text-ink-primary hover:border-accent"
        >
          <span>{command.label}</span>
          <Wand2 className="size-4 text-accent" />
        </button>
      ))}
    </>
  )
}

export default WriterSlashCommands

