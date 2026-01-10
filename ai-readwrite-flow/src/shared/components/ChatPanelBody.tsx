import type { ReactNode } from 'react'

type Props = {
  helper?: ReactNode
  messages: ReactNode
  error?: ReactNode
  form: ReactNode
  className?: string
}

const ChatPanelBody = ({ helper, messages, error, form, className }: Props) => (
  <div className={className}>
    {helper}
    {messages}
    {error}
    {form}
  </div>
)

export default ChatPanelBody
