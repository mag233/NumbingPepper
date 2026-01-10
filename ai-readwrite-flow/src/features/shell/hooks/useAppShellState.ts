import { useEffect, useState, type CSSProperties } from 'react'
import { useMediaQuery } from '../../../lib/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '../../../lib/constants'
import useUiStore from '../../../stores/uiStore'
import useSettingsStore from '../../../stores/settingsStore'
import useMetricsStore from '../../../stores/metricsStore'
import useLibraryStore from '../../../stores/libraryStore'
import { normalizeThemePreset } from '../../../lib/theme'
import useReaderShortcutTemplateStore, { type ReaderShortcutAction } from '../../../stores/readerShortcutTemplateStore'
import type { QuickPrompt } from '../../../lib/quickPrompt'
import useWriterLayoutStore, { type WriterLayoutDensity } from '../../../stores/writerLayoutStore'
import useShellLayoutStore from '../../../stores/shellLayoutStore'
import useShellLayoutModeStore from '../../../stores/shellLayoutModeStore'
import useFlomoComposerStore from '../../integrations/flomo/flomoComposerStore'
import { densityVars, type LayoutDensity } from '../appDensity'

const useAppShellHydration = () => {
  const hydrate = useSettingsStore((s) => s.hydrate)
  const hydrateLibrary = useLibraryStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
    void hydrateLibrary()
  }, [hydrate, hydrateLibrary])
}

const useAppShellTheme = () => {
  const themePreset = useSettingsStore((s) => s.themePreset)

  useEffect(() => {
    document.documentElement.dataset.theme = normalizeThemePreset(themePreset)
  }, [themePreset])
}

const useAppShellUiState = () => {
  const activeTab = useUiStore((s) => s.activeTab)
  const setActiveTab = useUiStore((s) => s.setActiveTab)
  const mobileChatOpen = useUiStore((s) => s.mobileChatOpen)
  const openMobileChat = useUiStore((s) => s.openMobileChat)
  const closeMobileChat = useUiStore((s) => s.closeMobileChat)
  const settingsOpen = useUiStore((s) => s.settingsOpen)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const showNav = useUiStore((s) => s.showNav)
  const setShowNav = useUiStore((s) => s.setShowNav)
  const desktopView = useUiStore((s) => s.desktopView)
  const setDesktopView = useUiStore((s) => s.setDesktopView)
  const writerChatCollapsed = useUiStore((s) => s.writerChatCollapsed)
  const setWriterChatCollapsed = useUiStore((s) => s.setWriterChatCollapsed)
  const writerIsPreview = useUiStore((s) => s.writerIsPreview)
  const setWriterIsPreview = useUiStore((s) => s.setWriterIsPreview)

  return {
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
  }
}

const useShellLayoutState = () => {
  const readerSidebarWidthPx = useShellLayoutStore((s) => s.readerSidebarWidthPx)
  const writerSidebarWidthPx = useShellLayoutStore((s) => s.writerSidebarWidthPx)
  const readerMainSplitRatio = useShellLayoutStore((s) => s.readerMainSplitRatio)
  const setReaderSidebarWidthPx = useShellLayoutStore((s) => s.setReaderSidebarWidthPx)
  const setWriterSidebarWidthPx = useShellLayoutStore((s) => s.setWriterSidebarWidthPx)
  const setReaderMainSplitRatio = useShellLayoutStore((s) => s.setReaderMainSplitRatio)
  const resetReaderLayout = useShellLayoutStore((s) => s.resetReaderLayout)
  const resetWriterSidebarLayout = useShellLayoutStore((s) => s.resetWriterLayout)
  const readerDensity = useShellLayoutStore((s) => s.readerDensity)
  const setReaderDensity = useShellLayoutStore((s) => s.setReaderDensity)

  return {
    readerSidebarWidthPx,
    writerSidebarWidthPx,
    readerMainSplitRatio,
    setReaderSidebarWidthPx,
    setWriterSidebarWidthPx,
    setReaderMainSplitRatio,
    resetReaderLayout,
    resetWriterSidebarLayout,
    readerDensity,
    setReaderDensity,
  }
}

const useWriterLayoutState = () => {
  const writerDensity = useWriterLayoutStore((s) => s.density)
  const setWriterDensity = useWriterLayoutStore((s) => s.setDensity)
  const resetWriterLayout = useWriterLayoutStore((s) => s.reset)

  return { writerDensity, setWriterDensity, resetWriterLayout }
}

const useLayoutModeState = () => {
  const layoutAdjusting = useShellLayoutModeStore((s) => s.adjusting)
  const toggleLayoutAdjusting = useShellLayoutModeStore((s) => s.toggle)

  return { layoutAdjusting, toggleLayoutAdjusting }
}

const useAppShellLayoutState = (desktopView: 'reader' | 'writer') => {
  const shell = useShellLayoutState()
  const writer = useWriterLayoutState()
  const mode = useLayoutModeState()
  const currentDensity: LayoutDensity = desktopView === 'writer' ? (writer.writerDensity as LayoutDensity) : shell.readerDensity
  const onSetCurrentDensity = (density: LayoutDensity) => {
    if (desktopView === 'writer') {
      writer.setWriterDensity(density as WriterLayoutDensity)
      return
    }
    shell.setReaderDensity(density)
  }

  return { ...shell, ...writer, ...mode, currentDensity, onSetCurrentDensity }
}

const useAppShellQuickPrompt = (isMobile: boolean, openMobileChat: () => void) => {
  const buildReaderQuickPrompt = useReaderShortcutTemplateStore((s) => s.buildQuickPrompt)
  const [quickPrompt, setQuickPrompt] = useState<QuickPrompt>()
  const setQuickPromptWithChat = (prompt?: QuickPrompt) => {
    setQuickPrompt(prompt)
    if (isMobile && prompt) openMobileChat()
  }
  const handleReaderAction = (action: ReaderShortcutAction, text: string) => {
    setQuickPromptWithChat(buildReaderQuickPrompt(action, text))
  }
  const consumeQuickPrompt = () => setQuickPrompt(undefined)

  return { quickPrompt, setQuickPromptWithChat, handleReaderAction, consumeQuickPrompt }
}

const useAppShellMetrics = () => {
  const { lastLatencyMs, lastTokens, lastModel } = useMetricsStore()
  const model = useSettingsStore((s) => s.model)

  return { model, lastLatencyMs, lastTokens, lastModel }
}

const useAppShellFlomo = () => {
  const flomoDraft = useFlomoComposerStore((s) => s.draft)
  const closeFlomoComposer = useFlomoComposerStore((s) => s.close)

  return { flomoDraft, closeFlomoComposer }
}

const useAppShellScrollLock = (isMobile: boolean, mobileChatOpen: boolean) => {
  useEffect(() => {
    if (!isMobile) return
    if (!mobileChatOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, mobileChatOpen])
}

const useAppShellState = () => {
  const ui = useAppShellUiState()
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY, (matches) => {
    if (!matches) ui.closeMobileChat()
  })
  const layout = useAppShellLayoutState(ui.desktopView)
  const quickPrompt = useAppShellQuickPrompt(isMobile, ui.openMobileChat)
  const metrics = useAppShellMetrics()
  const flomo = useAppShellFlomo()
  const appStyle: CSSProperties | undefined = !isMobile ? (densityVars(layout.currentDensity) as CSSProperties) : undefined

  useAppShellHydration()
  useAppShellTheme()
  useAppShellScrollLock(isMobile, ui.mobileChatOpen)

  return { ...ui, ...layout, ...quickPrompt, ...metrics, ...flomo, isMobile, appStyle }
}

export default useAppShellState
