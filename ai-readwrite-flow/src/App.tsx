import useAppShellState from './features/shell/hooks/useAppShellState'
import AppHeader from './features/shell/components/AppHeader'
import AppMainMobile from './features/shell/components/AppMainMobile'
import AppMainDesktop from './features/shell/components/AppMainDesktop'
import AppFooter from './features/shell/components/AppFooter'
import AppOverlays from './features/shell/components/AppOverlays'

const App = () => {
  const {
    isMobile,
    appStyle,
    activeTab,
    setActiveTab,
    mobileChatOpen,
    openMobileChat,
    closeMobileChat,
    settingsOpen,
    setSettingsOpen,
    showNav,
    setShowNav,
    desktopView,
    setDesktopView,
    writerChatCollapsed,
    setWriterChatCollapsed,
    writerIsPreview,
    setWriterIsPreview,
    quickPrompt,
    setQuickPromptWithChat,
    handleReaderAction,
    consumeQuickPrompt,
    readerSidebarWidthPx,
    setReaderSidebarWidthPx,
    writerSidebarWidthPx,
    setWriterSidebarWidthPx,
    readerMainSplitRatio,
    setReaderMainSplitRatio,
    resetReaderLayout,
    resetWriterLayout,
    resetWriterSidebarLayout,
    currentDensity,
    onSetCurrentDensity,
    layoutAdjusting,
    toggleLayoutAdjusting,
    model,
    lastLatencyMs,
    lastTokens,
    lastModel,
    flomoDraft,
    closeFlomoComposer,
  } = useAppShellState()

  return (
    <div
      className={`${isMobile ? 'min-h-screen' : 'h-screen overflow-hidden'} flex flex-col bg-surface-base text-ink-primary`}
      style={appStyle}
    >
      <AppHeader
        isMobile={isMobile}
        model={model}
        desktopView={desktopView}
        layoutAdjusting={layoutAdjusting}
        currentDensity={currentDensity}
        onToggleAdjusting={toggleLayoutAdjusting}
        onSetDensity={onSetCurrentDensity}
        onResetCurrentView={() => {
          if (desktopView === 'reader') {
            resetReaderLayout()
            return
          }
          resetWriterLayout()
          resetWriterSidebarLayout()
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main
        className={`mx-auto flex w-full max-w-screen-3xl flex-1 flex-col gap-[var(--app-gap,1rem)] px-[var(--app-pad-x,1.5rem)] py-[var(--app-pad-y,1.5rem)] min-h-0 ${
          isMobile ? (activeTab === 'editor' ? 'pb-24' : 'pb-6') : 'overflow-x-hidden overflow-y-visible'
        }`}
      >
        {isMobile ? (
          <AppMainMobile
            activeTab={activeTab}
            onSetActiveTab={setActiveTab}
            onReaderAction={handleReaderAction}
            onQuickPrompt={setQuickPromptWithChat}
            openMobileChat={openMobileChat}
          />
        ) : (
          <AppMainDesktop
            showNav={showNav}
            onToggleNav={() => setShowNav(!showNav)}
            desktopView={desktopView}
            onSetDesktopView={setDesktopView}
            onReaderAction={handleReaderAction}
            quickPrompt={quickPrompt}
            onConsumeQuickPrompt={consumeQuickPrompt}
            onSetQuickPrompt={setQuickPromptWithChat}
            writerChatCollapsed={writerChatCollapsed}
            onWriterChatCollapsedChange={setWriterChatCollapsed}
            writerIsPreview={writerIsPreview}
            onWriterIsPreviewChange={setWriterIsPreview}
            readerSidebarWidthPx={readerSidebarWidthPx}
            onReaderSidebarWidthPxChange={setReaderSidebarWidthPx}
            writerSidebarWidthPx={writerSidebarWidthPx}
            onWriterSidebarWidthPxChange={setWriterSidebarWidthPx}
            readerMainSplitRatio={readerMainSplitRatio}
            onReaderMainSplitRatioChange={setReaderMainSplitRatio}
          />
        )}
      </main>

      <AppFooter model={model} lastModel={lastModel} lastTokens={lastTokens} lastLatencyMs={lastLatencyMs} />
      <AppOverlays
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        isMobile={isMobile}
        mobileChatOpen={mobileChatOpen}
        quickPrompt={quickPrompt}
        onConsumeQuickPrompt={consumeQuickPrompt}
        onCloseMobileChat={closeMobileChat}
        flomoDraft={flomoDraft}
        onCloseFlomoComposer={closeFlomoComposer}
      />
    </div>
  )
}

export default App
