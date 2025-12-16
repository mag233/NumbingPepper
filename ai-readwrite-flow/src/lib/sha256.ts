const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

export const sha256Hex = async (data: ArrayBuffer): Promise<string> => {
  if (!globalThis.crypto?.subtle) throw new Error('WebCrypto is not available')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
  return toHex(new Uint8Array(digest))
}

