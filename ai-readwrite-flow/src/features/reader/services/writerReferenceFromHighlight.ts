import useHighlightStore from '../../../stores/highlightStore'
import useLibraryStore from '../../../stores/libraryStore'
import useReaderStore from '../../../stores/readerStore'
import useSettingsStore from '../../../stores/settingsStore'
import useWriterToastStore from '../../editor/stores/writerToastStore'
import { buildSystemReferenceTags, mergeTags, splitReferenceTags } from '../../../lib/referenceTags'
import { buildReferenceFromHighlight } from '../../editor/services/writerIntegration'
import { generateReferenceId } from '../../editor/services/writingReferenceIds'
import { setWritingReferenceIncluded, upsertWritingReference } from '../../editor/services/writingRepo'
import type { Highlight } from '../types'

type Args = {
  projectId: string
  highlight: Highlight
  tags?: string[]
  onClosePopover?: () => void
}

const ensureHighlightExists = async (highlight: Highlight) => {
  const { byBookId, add } = useHighlightStore.getState()
  const existing = byBookId[highlight.bookId] ?? []
  const already = existing.some((item) => item.id === highlight.id)
  if (already) return
  const createdAt = Date.now()
  const next: Highlight = {
    ...highlight,
    id: crypto.randomUUID ? crypto.randomUUID() : `${createdAt}-${Math.random()}`,
    createdAt,
  }
  await add(next)
}

export const saveWriterReferenceFromHighlight = async ({
  projectId,
  highlight,
  tags,
  onClosePopover,
}: Args) => {
  if (!projectId) return false
  await ensureHighlightExists(highlight)
  const now = Date.now()
  const referenceId = generateReferenceId()
  const book = useLibraryStore.getState().items.find((item) => item.id === highlight.bookId)
  const sourceTitle = book?.metadataTitle ?? book?.title
  const sourceAuthor = book?.metadataAuthor ?? book?.author
  const sourceYear = book?.metadataYear
  const sourceFileHash = book?.fileHash
  const defaults = useSettingsStore.getState().referenceDefaultTags
  const systemTags = buildSystemReferenceTags({
    title: sourceTitle,
    author: sourceAuthor,
    year: sourceYear,
    defaults,
  })
  const { userTags } = splitReferenceTags(tags ?? [])
  const mergedTags = mergeTags(systemTags, userTags)
  const pageLabel = useReaderStore.getState().pageLabels?.[highlight.contextRange.page - 1] ?? undefined
  const ref = buildReferenceFromHighlight({
    projectId,
    highlight,
    now,
    referenceId,
    sourceTitle,
    sourceAuthor,
    sourceYear,
    sourceFileHash,
    pageLabel,
    tags: mergedTags,
  })
  const ok = await upsertWritingReference(ref)
  if (!ok) {
    useWriterToastStore.getState().show('Failed to add Reference.')
    return false
  }
  await setWritingReferenceIncluded(projectId, referenceId, false, now)
  useWriterToastStore.getState().show('Added as Reference')
  onClosePopover?.()
  return true
}
