const getWebhookUrl = () => {
  const raw = process.env.FLOMO_API || process.env.VITE_FLOMO_API || ''
  const url = raw.trim()
  if (!url) return null
  return url
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const contentIndex = args.findIndex((v) => v === '--content')
  const content = contentIndex >= 0 ? (args[contentIndex + 1] ?? '') : ''
  return { content }
}

const main = async () => {
  const url = getWebhookUrl()
  if (!url) {
    console.error('Missing env: FLOMO_API or VITE_FLOMO_API')
    process.exit(2)
  }

  const { content } = parseArgs()
  const body = {
    content: (content || `Flomo smoke test @ ${new Date().toISOString()}`).trim(),
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    console.error(`Flomo POST failed: HTTP ${resp.status}`)
    process.exit(1)
  }
  console.log('Flomo POST ok')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

