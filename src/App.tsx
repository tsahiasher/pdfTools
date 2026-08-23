import React, { useState, useEffect } from 'react'
import { TopNavbar } from './components/TopNavbar'
import { SidebarSources } from './components/SidebarSources'
import { GridSubHeader } from './components/GridSubHeader'
import { PageGrid } from './components/PageGrid'
import { Dropzone } from './components/Dropzone'
import { ErrorBanner } from './components/ErrorBanner'
import { ClearWarningModal } from './components/ClearWarningModal'
import { ExportImagesModal } from './components/ExportImagesModal'
import { PrintModal } from './components/PrintModal'
import { SplitModal } from './components/SplitModal'
import { SignModal } from './components/SignModal'
import { DragOverlay } from './components/DragOverlay'
import { ReorderFilesWarningModal } from './components/ReorderFilesWarningModal'
import { usePdfCoordinator } from './hooks/usePdfCoordinator'
import type { PageDescriptor } from './domain/types'
import { Loader2 } from 'lucide-react'

export const App: React.FC = () => {
  const {
    sources,
    pages,
    selectedPageIds,
    isProcessing,
    isExporting,
    includeBookmarks,
    errors,
    addFiles,
    removeSource,
    moveSource,
    reorderMultiplePages,
    rotatePage,
    rotateSelectedPages,
    deletePage,
    deleteSelectedPages,
    togglePageSelection,
    selectAllPages,
    clearSelection,
    clearAll,
    revertAll,
    dismissError,
    exportMergedPdf,
    exportSelectedPdf,
    exportImages,
    exportSplitPdf,
    addSignatureToPage,
    setIncludeBookmarks,
    hasCustomPageOrder,
  } = usePdfCoordinator()

  const [zoomLevel, setZoomLevel] = useState<number>(3)
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false)
  const [isExportImagesModalOpen, setIsExportImagesModalOpen] = useState<boolean>(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false)
  const [signingPageId, setSigningPageId] = useState<string | null>(null)
  const [pendingSourceMove, setPendingSourceMove] = useState<{
    sourceId: string
    direction: 'up' | 'down'
  } | null>(null)
  const [isReorderWarningOpen, setIsReorderWarningOpen] = useState<boolean>(false)

  const handleMoveSource = (sourceId: string, direction: 'up' | 'down') => {
    if (hasCustomPageOrder()) {
      setPendingSourceMove({ sourceId, direction })
      setIsReorderWarningOpen(true)
    } else {
      moveSource(sourceId, direction)
    }
  }

  const handleConfirmReorder = () => {
    if (pendingSourceMove) {
      moveSource(pendingSourceMove.sourceId, pendingSourceMove.direction)
      setPendingSourceMove(null)
    }
    setIsReorderWarningOpen(false)
  }

  const sourceList = Array.from(sources.values())
  const hasFiles = sourceList.length > 0
  const activeSigningPage = pages.find((p) => p.id === signingPageId) || null

  // Keyboard shortcut listeners (Delete, Escape, Ctrl+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'Escape') {
        if (isClearModalOpen) setIsClearModalOpen(false)
        else if (isSplitModalOpen) setIsSplitModalOpen(false)
        else if (isExportImagesModalOpen) setIsExportImagesModalOpen(false)
        else if (isPrintModalOpen) setIsPrintModalOpen(false)
        else if (signingPageId) setSigningPageId(null)
        else clearSelection()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (
          selectedPageIds.size > 0 &&
          !isClearModalOpen &&
          !isSplitModalOpen &&
          !isExportImagesModalOpen &&
          !isPrintModalOpen &&
          !signingPageId
        ) {
          e.preventDefault()
          deleteSelectedPages()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (
          hasFiles &&
          !isClearModalOpen &&
          !isSplitModalOpen &&
          !isExportImagesModalOpen &&
          !isPrintModalOpen &&
          !signingPageId
        ) {
          e.preventDefault()
          selectAllPages()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedPageIds,
    hasFiles,
    isClearModalOpen,
    isSplitModalOpen,
    isExportImagesModalOpen,
    isPrintModalOpen,
    signingPageId,
    clearSelection,
    deleteSelectedPages,
    selectAllPages,
  ])

  const handleMergeSaveAll = async () => {
    try {
      await exportMergedPdf()
    } catch {
      // Error handled in coordinator
    }
  }

  const handleSaveSelected = async () => {
    try {
      await exportSelectedPdf()
    } catch {
      // Error handled in coordinator
    }
  }

  const handleExportImagesModalConfirm = async (
    format: 'png' | 'jpeg',
    target: 'selected' | 'all',
    baseFilename: string
  ) => {
    try {
      setIsExportImagesModalOpen(false)
      await exportImages(format, target, baseFilename)
    } catch {
      // Error handled in coordinator
    }
  }

  const handleSplitConfirm = async (
    parts: { name: string; pages: PageDescriptor[] }[],
    asZip = false
  ) => {
    try {
      setIsSplitModalOpen(false)
      await exportSplitPdf(parts, asZip)
    } catch {
      // Error handled in coordinator
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0f18] text-slate-100 antialiased selection:bg-sky-500 selection:text-white overflow-hidden">
      {/* Top Navigation Bar */}
      <TopNavbar
        pageCount={pages.length}
        selectedCount={selectedPageIds.size}
        isExporting={isExporting}
        isProcessing={isProcessing}
        includeBookmarks={includeBookmarks}
        onToggleBookmarks={setIncludeBookmarks}
        onAddFiles={addFiles}
        onRevertAll={revertAll}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        onOpenSplitModal={() => setIsSplitModalOpen(true)}
        onExportImages={() => setIsExportImagesModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onSaveSelected={handleSaveSelected}
        onMergeSaveAll={handleMergeSaveAll}
      />

      {/* Main Workspace: Left Sidebar + Right Grid */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1920px] w-full mx-auto overflow-hidden">
        {/* Left Sidebar: PDF Source Files */}
        {hasFiles && (
          <SidebarSources
            sources={sourceList}
            onRemoveSource={removeSource}
            onMoveSource={handleMoveSource}
          />
        )}

        {/* Right Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col h-full">
          {/* Error notifications */}
          <ErrorBanner errors={errors} onDismiss={dismissError} />

          {!hasFiles ? (
            /* Empty State - Full Window Drop Area */
            <div className="flex-1 flex flex-col w-full h-full my-auto">
              <Dropzone onFilesSelected={addFiles} isProcessing={isProcessing} />
            </div>
          ) : (
            /* Active Workflow Grid */
            <div className="space-y-4 max-w-[1600px] mx-auto pb-8">
              {/* Subheader: Selection Summary, Action Buttons, Zoom slider */}
              <GridSubHeader
                pageCount={pages.length}
                selectedCount={selectedPageIds.size}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onSelectAll={selectAllPages}
                onDeselect={clearSelection}
                onRotateCW={() => rotateSelectedPages(90)}
                onRotateCCW={() => rotateSelectedPages(270)}
                onDeleteSelected={deleteSelectedPages}
              />

              {/* Processing Progress Indicator */}
              {isProcessing && (
                <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-950/40 border border-sky-800/50 text-sky-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing source files and generating high-resolution previews...</span>
                </div>
              )}

              {/* Responsive Grid with Interactive Drag-and-Drop */}
              <PageGrid
                pages={pages}
                sources={sources}
                selectedPageIds={selectedPageIds}
                zoomLevel={zoomLevel}
                onToggleSelect={togglePageSelection}
                onRotatePage={rotatePage}
                onSignPage={(id) => setSigningPageId(id)}
                onDeletePage={deletePage}
                onReorderMultiple={reorderMultiplePages}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modal Dialogs */}
      <ClearWarningModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearAll}
      />

      <SplitModal
        isOpen={isSplitModalOpen}
        pages={pages}
        selectedPageIds={selectedPageIds}
        isExporting={isExporting}
        onClose={() => setIsSplitModalOpen(false)}
        onSplit={handleSplitConfirm}
      />

      <ExportImagesModal
        isOpen={isExportImagesModalOpen}
        pageCount={pages.length}
        selectedCount={selectedPageIds.size}
        isExporting={isExporting}
        onClose={() => setIsExportImagesModalOpen(false)}
        onExport={handleExportImagesModalConfirm}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        pages={pages}
        selectedPageIds={selectedPageIds}
        onClose={() => setIsPrintModalOpen(false)}
      />

      <SignModal
        isOpen={!!signingPageId}
        page={activeSigningPage}
        onClose={() => setSigningPageId(null)}
        onApplySignature={addSignatureToPage}
      />

      <ReorderFilesWarningModal
        isOpen={isReorderWarningOpen}
        onClose={() => {
          setIsReorderWarningOpen(false)
          setPendingSourceMove(null)
        }}
        onConfirm={handleConfirmReorder}
      />

      {/* Global Drag-and-Drop Overlay with Background Blur */}
      <DragOverlay onFilesSelected={addFiles} />
    </div>
  )
}

export default App
