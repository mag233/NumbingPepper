import type { ReactNode } from 'react'

type CardProps = {
  title?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

const Card = ({ title, action, className = '', children }: CardProps) => (
  <section
    className={`rounded-2xl border border-chrome-border/80 bg-surface-raised/80 p-4 shadow-card backdrop-blur ${className}`}
  >
    {(title || action) && (
      <header className="mb-3 flex items-center justify-between gap-2">
        {title && <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>}
        {action}
      </header>
    )}
    {children}
  </section>
)

export default Card
