import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

const MobileOverlay = ({ children }: Props) => (
  <div className="fixed inset-0 z-50 bg-black/60">
    <div className="absolute inset-x-0 bottom-0 top-10 overflow-hidden rounded-t-2xl bg-surface-base/95 shadow-2xl">
      {children}
    </div>
  </div>
)

export default MobileOverlay
