import { getSqlite } from '../../../lib/sqlite'
import { writingContextMembershipSchema, type WritingContextMembership } from './writingTypes'
import { LOCAL_MEMBERSHIP_KEY, readLocalArray, writeLocalArray } from './writingRepoLocal'

type MembershipRow = { project_id: string; reference_id: string; included: number; order_index: number }

export const loadWritingContextMembership = async (projectId: string): Promise<WritingContextMembership[]> => {
  if (!projectId) return []
  const db = await getSqlite()
  if (!db) return readLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), writingContextMembershipSchema)
  try {
    const rows =
      (await db.select<MembershipRow[]>(
        'SELECT project_id, reference_id, included, order_index FROM writing_context_membership WHERE project_id = ? ORDER BY order_index ASC',
        [projectId],
      )) ?? []
    const mapped = rows.map((row) => ({
      projectId: row.project_id,
      referenceId: row.reference_id,
      included: row.included === 1,
      orderIndex: typeof row.order_index === 'number' ? row.order_index : 0,
    }))
    return mapped
      .map((m) => writingContextMembershipSchema.safeParse(m))
      .filter((r) => r.success)
      .map((r) => r.data)
  } catch {
    return []
  }
}

export const setWritingReferenceIncluded = async (projectId: string, referenceId: string, included: boolean, orderIndex: number) => {
  if (!projectId) return false
  if (!referenceId) return false
  const candidate = { projectId, referenceId, included, orderIndex }
  const parsed = writingContextMembershipSchema.safeParse(candidate)
  if (!parsed.success) return false

  const db = await getSqlite()
  if (!db) {
    const existing = readLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), writingContextMembershipSchema).filter(
      (m) => m.referenceId !== referenceId,
    )
    writeLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), [...existing, parsed.data].sort((a, b) => a.orderIndex - b.orderIndex))
    return true
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO writing_context_membership (
        project_id, reference_id, included, order_index
      ) VALUES (?, ?, ?, ?)
    `,
      [projectId, referenceId, included ? 1 : 0, orderIndex],
    )
    return true
  } catch {
    return false
  }
}

