import type { ReactNode } from 'react'
import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logEvent } from '../../lib/logger'
import CrashProbe from './CrashProbe'

type Props = {
  title: string
  children: ReactNode
}

type State = { errorMessage: string | null }

const DEV_CRASH_KEY = 'arwf:crash'

const clearDevCrashFlag = (panelTitle: string) => {
  if (!import.meta.env.DEV) return
  try {
    const current = localStorage.getItem(DEV_CRASH_KEY)
    if (!current) return
    if (current.trim().toLowerCase() !== panelTitle.trim().toLowerCase()) return
    localStorage.removeItem(DEV_CRASH_KEY)
  } catch {
    // ignore
  }
}

export default class PanelErrorBoundary extends Component<Props, State> {
  state: State = { errorMessage: null }
  private attempt = 0

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { errorMessage: message }
  }

  componentDidCatch(error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    void logEvent('error', 'Panel crashed', { panel: this.props.title, message })
  }

  private reset = () => {
    clearDevCrashFlag(this.props.title)
    this.attempt += 1
    this.setState({ errorMessage: null })
  }

  render() {
    if (!this.state.errorMessage) {
      return (
        <div key={this.attempt} className="contents">
          <CrashProbe title={this.props.title}>{this.props.children}</CrashProbe>
        </div>
      )
    }
    return (
      <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 text-amber-300" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-amber-100">{this.props.title} crashed</p>
            <p className="text-xs text-amber-100/90">{this.state.errorMessage}</p>
            <button
              onClick={this.reset}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-50 hover:border-amber-300/70"
            >
              <RefreshCw className="size-4" />
              Reload panel
            </button>
          </div>
        </div>
      </section>
    )
  }
}
