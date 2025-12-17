export const chatSessionIdForProject = (projectId: string | null | undefined) =>
  projectId && projectId.length ? `project:${projectId}` : 'project:global'

