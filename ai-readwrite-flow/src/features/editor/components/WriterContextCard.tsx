import { useEffect } from 'react'
import Card from '../../../shared/components/Card'
import useWriterProjectStore from '../stores/writerProjectStore'
import useWriterContextStore from '../stores/writerContextStore'
import WriterContextPanel from './WriterContextPanel'

const WriterContextCard = () => {
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const hydrateContext = useWriterContextStore((s) => s.hydrate)
  const flushContext = useWriterContextStore((s) => s.flush)

  useEffect(() => {
    void hydrateContext(activeProjectId)
    return () => {
      void flushContext()
    }
  }, [activeProjectId, flushContext, hydrateContext])

  return (
    <Card title="Context" className="flex h-full min-h-0 flex-col">
      <WriterContextPanel fill noTopMargin embedded />
    </Card>
  )
}

export default WriterContextCard

