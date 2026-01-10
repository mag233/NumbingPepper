export const buildChatBubbleClass = (baseClass: string, roleClass: string, extraClass?: string) =>
  [baseClass, extraClass, roleClass].filter(Boolean).join(' ')
