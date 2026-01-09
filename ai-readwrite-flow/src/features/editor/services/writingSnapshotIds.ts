export const generateSnapshotId = () => {
  const cryptoObj = globalThis.crypto
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID()
  return `s_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}
