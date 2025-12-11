import { create } from 'zustand'

type MetricsState = {
  lastTokens?: number
  lastLatencyMs?: number
  lastModel?: string
  setMetrics: (payload: { tokens?: number; latencyMs?: number; model?: string }) => void
  reset: () => void
}

const useMetricsStore = create<MetricsState>((set) => ({
  lastTokens: undefined,
  lastLatencyMs: undefined,
  lastModel: undefined,
  setMetrics: ({ tokens, latencyMs, model }) =>
    set({
      lastTokens: tokens,
      lastLatencyMs: latencyMs,
      lastModel: model,
    }),
  reset: () =>
    set({
      lastTokens: undefined,
      lastLatencyMs: undefined,
      lastModel: undefined,
    }),
}))

export default useMetricsStore
