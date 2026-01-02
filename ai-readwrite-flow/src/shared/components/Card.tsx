import type { ReactNode } from 'react'

type CardProps = {
  title?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

const Card = ({ title, action, className = '', children }: CardProps) => {
  const hasBody = children !== null && children !== undefined
  return (
    <section
      className={`rounded-2xl border border-chrome-border/80 bg-surface-raised/80 p-[var(--card-pad,1rem)] shadow-card backdrop-blur ${className}`}
    >
      {(title || action) && (
        <header className={`${hasBody ? 'mb-[var(--card-header-mb,0.75rem)]' : 'mb-0'} flex items-center justify-between gap-2`}>
          {title && <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export default Card
