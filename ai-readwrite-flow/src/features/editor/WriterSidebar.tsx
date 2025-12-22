import Card from '../../shared/components/Card'
import WriterProjectPicker from './components/WriterProjectPicker'
import WriterOutlinePanel from './components/WriterOutlinePanel'
import WriterReferencesPanel from './components/WriterReferencesPanel'

const WriterSidebar = () => {
  return (
    <Card title="Writer" className="flex h-full flex-col">
      <div className="mb-3">
        <WriterProjectPicker variant="sidebar" />
      </div>
      <div className="min-h-0 flex-1 overflow-auto space-y-3">
        <WriterOutlinePanel noTopMargin />
        <WriterReferencesPanel noTopMargin listClassName="max-h-none overflow-visible" />
      </div>
    </Card>
  )
}

export default WriterSidebar
