import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = {
  source: string
}

const WriterMarkdownPreview = ({ source }: Props) => {
  return (
    <div className="max-w-none rounded-lg border border-chrome-border/70 bg-surface-base/40 p-4 text-ink-primary [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:text-accent/90 [&_blockquote]:border-l-2 [&_blockquote]:border-chrome-border [&_blockquote]:pl-3 [&_blockquote]:text-ink-primary [&_code]:rounded [&_code]:bg-surface-raised/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-ink-primary [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-surface-raised/70 [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source || '*(empty)*'}</ReactMarkdown>
      {import.meta.env.DEV && (
        <details className="mt-4 rounded-lg border border-chrome-border/70 bg-surface-raised/40 p-3 text-xs text-ink-primary">
          <summary className="cursor-pointer select-none text-ink-muted">Debug: raw markdown</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{source || '(empty)'}</pre>
        </details>
      )}
    </div>
  )
}

export default WriterMarkdownPreview
