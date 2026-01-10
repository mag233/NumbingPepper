import { AlertCircle, RotateCcw } from 'lucide-react'

type Props = {
  message: string
  onRetry?: () => void
}

const ChatErrorBanner = ({ message, onRetry }: Props) => (
  <div className="flex items-center gap-2 rounded-lg border border-status-warning/50 bg-status-warning/10 p-2 text-xs text-status-warning">
    <AlertCircle className="size-4" />
    <span>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="ml-auto inline-flex items-center gap-1 rounded border border-status-warning/60 px-2 py-1 text-status-warning hover:border-status-warning/80"
      >
        <RotateCcw className="size-3" />
        Retry
      </button>
    )}
  </div>
)

export default ChatErrorBanner
