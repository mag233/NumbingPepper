import { type ReactNode, useEffect, useRef } from 'react'

type Props = {
  className?: string
  children: ReactNode
  scrollKey?: number
}

const ChatScrollContainer = ({ className, children, scrollKey }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTop = containerRef.current.scrollHeight
  }, [scrollKey])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export default ChatScrollContainer
