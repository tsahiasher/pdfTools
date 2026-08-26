import { useState, useEffect, useCallback } from 'react'
import { globalCoordinator, PdfCoordinator } from '../coordinator/PdfCoordinator'
import type { DocumentState, PageDescriptor } from '../domain/types'

export function usePdfCoordinator(coordinator: PdfCoordinator = globalCoordinator) {
  const [state, setState] = useState<DocumentState>(() => coordinator.getState())

  useEffect(() => {
    return coordinator.subscribe((newState) => {
      setState(newState)
    })
  }, [coordinator])

  const addFiles = useCallback((files: File[]) => {
    return coordinator.addFiles(files)
  }, [coordinator])

  const removeSource = useCallback((sourceId: string) => {
    coordinator.removeSource(sourceId)
  }, [coordinator])

  const moveSource = useCallback((sourceId: string, direction: 'left' | 'right' | 'up' | 'down') => {
    coordinator.moveSource(sourceId, direction)
  }, [coordinator])

  const reorderMultiplePages = useCallback((draggedIds: string[], targetIndex: number) => {
    coordinator.reorderMultiplePages(draggedIds, targetIndex)
  }, [coordinator])

  const rotatePage = useCallback((pageId: string, deltaDegrees: number) => {
    coordinator.rotatePage(pageId, deltaDegrees)
  }, [coordinator])

  const rotateSelectedPages = useCallback((deltaDegrees: number) => {
    coordinator.rotateSelectedPages(deltaDegrees)
  }, [coordinator])

  const deletePage = useCallback((pageId: string) => {
    coordinator.deletePage(pageId)
  }, [coordinator])

  const deleteSelectedPages = useCallback(() => {
    coordinator.deleteSelectedPages()
  }, [coordinator])

  const togglePageSelection = useCallback((pageId: string, isRange = false) => {
    coordinator.togglePageSelection(pageId, isRange)
  }, [coordinator])

  const selectAllPages = useCallback(() => {
    coordinator.selectAllPages()
  }, [coordinator])

  const clearSelection = useCallback(() => {
    coordinator.clearSelection()
  }, [coordinator])

  const clearAll = useCallback(() => {
    coordinator.clearAll()
  }, [coordinator])

  const revertAll = useCallback(() => {
    coordinator.revertAll()
  }, [coordinator])

  const dismissError = useCallback((errorId: string) => {
    coordinator.dismissError(errorId)
  }, [coordinator])

  const exportMergedPdf = useCallback((filename?: string) => {
    return coordinator.exportMergedPdf(filename)
  }, [coordinator])

  const exportSelectedPdf = useCallback((filename?: string) => {
    return coordinator.exportSelectedPdf(filename)
  }, [coordinator])

  const exportImages = useCallback(
    (
      format: 'png' | 'jpeg' = 'png',
      scope: 'selected' | 'all' = 'selected',
      baseFilename = 'ExportedPage'
    ) => {
      return coordinator.exportImages(format, scope, baseFilename)
    },
    [coordinator]
  )

  const exportSplitPdf = useCallback(
    (parts: { name: string; pages: PageDescriptor[] }[], asZip = false) => {
      return coordinator.exportSplitPdf(parts, asZip)
    },
    [coordinator]
  )

  const setIncludeBookmarks = useCallback(
    (include: boolean) => {
      coordinator.setIncludeBookmarks(include)
    },
    [coordinator]
  )

  const hasCustomPageOrder = useCallback(() => {
    return coordinator.hasCustomPageOrder()
  }, [coordinator])

  const updatePageEditorData = useCallback(
    (
      pageId: string,
      data: {
        formValues?: Record<string, string | boolean>
        drawingDataUrl?: string
        signatures?: import('../domain/types').SignatureOverlay[]
      }
    ) => {
      coordinator.updatePageEditorData(pageId, data)
    },
    [coordinator]
  )

  return {
    ...state,
    coordinator,
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
    updatePageEditorData,
    setIncludeBookmarks,
    hasCustomPageOrder,
  }
}
