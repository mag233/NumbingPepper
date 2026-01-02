import { create } from 'zustand'

type State = {
  adjusting: boolean
  setAdjusting: (adjusting: boolean) => void
  toggle: () => void
}

const useShellLayoutModeStore = create<State>((set) => ({
  adjusting: false,
  setAdjusting: (adjusting) => set({ adjusting }),
  toggle: () => set((state) => ({ adjusting: !state.adjusting })),
}))

export default useShellLayoutModeStore

