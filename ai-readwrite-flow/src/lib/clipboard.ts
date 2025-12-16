export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  const payload = text.trim()
  if (!payload) return false

  const clipboardApi = navigator.clipboard
  if (clipboardApi?.writeText) {
    try {
      await clipboardApi.writeText(payload)
      return true
    } catch {
      // fall through to legacy approach
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = payload
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  textarea.style.left = '-1000px'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    return document.execCommand?.('copy') === true
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

