const cjkRegex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

export const estimateTokens = (text: string): number => {
  const trimmed = text.trim()
  if (!trimmed) return 0

  let cjkCount = 0
  for (const ch of trimmed) {
    if (cjkRegex.test(ch)) cjkCount += 1
  }
  const nonCjkCount = Math.max(0, trimmed.length - cjkCount)

  const estimate = cjkCount / 1.5 + nonCjkCount / 4
  return Math.max(1, Math.ceil(estimate))
}

