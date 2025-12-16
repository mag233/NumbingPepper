export type TextOffset = { nodeIndex: number; offset: number }

export const locateTextOffset = (nodeLengths: number[], absoluteOffset: number): TextOffset | null => {
  if (!Number.isFinite(absoluteOffset) || absoluteOffset < 0) return null
  let remaining = absoluteOffset
  for (let i = 0; i < nodeLengths.length; i += 1) {
    const len = nodeLengths[i] ?? 0
    if (remaining <= len) return { nodeIndex: i, offset: remaining }
    remaining -= len
  }
  if (nodeLengths.length === 0) return null
  const lastIdx = nodeLengths.length - 1
  return { nodeIndex: lastIdx, offset: nodeLengths[lastIdx] ?? 0 }
}

