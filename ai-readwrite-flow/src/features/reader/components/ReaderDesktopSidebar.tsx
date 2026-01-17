import LibraryPanel from '../../library/LibraryPanel'
import ReaderOutlinePanel from './ReaderOutlinePanel'

type Props = {
  onOpenBook?: () => void
}

const ReaderDesktopSidebar = ({ onOpenBook }: Props) => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex-none max-h-[42vh] overflow-y-auto">
        <LibraryPanel compact onOpen={onOpenBook} scope="project" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-chrome-border/80 bg-surface-raised/80 p-4 shadow-card backdrop-blur">
        <ReaderOutlinePanel />
      </div>
    </div>
  )
}

export default ReaderDesktopSidebar
