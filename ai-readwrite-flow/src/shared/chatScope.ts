export const READER_CHAT_SCOPE = 'reader' as const
export const WRITER_CHAT_SCOPE = 'writer' as const

export type ReaderChatScope = typeof READER_CHAT_SCOPE
export type WriterChatScope = typeof WRITER_CHAT_SCOPE
