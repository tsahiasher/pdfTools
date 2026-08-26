import { PdfSourceManager } from '../managers/PdfSourceManager'
import { ThumbnailRenderManager } from '../managers/ThumbnailRenderManager'
import { PdfExportManager } from '../managers/PdfExportManager'
import type { DocumentState, PageDescriptor, PdfLoadError, PdfSource } from '../domain/types'

type StateListener = (state: DocumentState) => void

export class PdfCoordinator {
  private sourceManager: PdfSourceManager
  private thumbnailManager: ThumbnailRenderManager
  private exportManager: PdfExportManager

  // Keep a reference to original initial pages per source for Revert All functionality
  private originalPagesBySource = new Map<string, PageDescriptor[]>()

  private state: DocumentState = {
    sources: new Map<string, PdfSource>(),
    pages: [],
    selectedPageIds: new Set<string>(),
    isProcessing: false,
    isExporting: false,
    includeBookmarks: false,
    errors: [],
  }

  private listeners = new Set<StateListener>()
  private lastSelectedPageId: string | null = null

  constructor() {
    this.sourceManager = new PdfSourceManager()
    this.thumbnailManager = new ThumbnailRenderManager(this.sourceManager)
    this.exportManager = new PdfExportManager(this.sourceManager)
  }

  getState(): DocumentState {
    return this.state
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    const snapshot: DocumentState = {
      ...this.state,
      sources: new Map(this.state.sources),
      pages: [...this.state.pages],
      selectedPageIds: new Set(this.state.selectedPageIds),
      errors: [...this.state.errors],
    }
    this.state = snapshot
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  /**
   * Adds multiple PDF or image files to the working document.
   */
  async addFiles(files: File[]): Promise<void> {
    if (files.length === 0) return

    this.state.isProcessing = true
    this.notify()

    const newErrors: PdfLoadError[] = []
    const newPages: PageDescriptor[] = []

    for (const file of files) {
      const result = await this.sourceManager.loadFile(file)

      if (result.success) {
        this.state.sources.set(result.source.id, result.source)
        this.originalPagesBySource.set(
          result.source.id,
          result.pages.map((p) => ({ ...p }))
        )
        newPages.push(...result.pages)
      } else {
        newErrors.push({
          id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          fileName: result.fileName,
          message: result.error,
          timestamp: Date.now(),
        })
      }
    }

    this.state.pages.push(...newPages)
    this.state.errors.push(...newErrors)
    this.state.isProcessing = false
    this.notify()
  }

  /**
   * Reverts all page changes (order, rotations, deletions) back to original source files state.
   */
  revertAll(): void {
    const restoredPages: PageDescriptor[] = []
    for (const [sourceId] of this.state.sources) {
      const initialPages = this.originalPagesBySource.get(sourceId)
      if (initialPages) {
        restoredPages.push(...initialPages.map((p) => ({ ...p, rotation: 0 })))
      }
    }
    this.state.pages = restoredPages
    this.state.selectedPageIds.clear()
    this.lastSelectedPageId = null
    this.notify()
  }

  /**
   * Reorders the source documents, which groups and reorders their corresponding pages.
   */
  moveSource(sourceId: string, direction: 'left' | 'right' | 'up' | 'down'): void {
    const sourceIds = Array.from(this.state.sources.keys())
    const currentIndex = sourceIds.indexOf(sourceId)
    if (currentIndex === -1) return

    const targetIndex =
      direction === 'left' || direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sourceIds.length) return

    // Swap source ids
    const temp = sourceIds[currentIndex]
    sourceIds[currentIndex] = sourceIds[targetIndex]
    sourceIds[targetIndex] = temp

    // Rebuild sources map with new order
    const newSourcesMap = new Map<string, PdfSource>()
    for (const id of sourceIds) {
      const src = this.state.sources.get(id)
      if (src) newSourcesMap.set(id, src)
    }
    this.state.sources = newSourcesMap

    // Re-group and reorder pages by source order
    const pagesBySource = new Map<string, PageDescriptor[]>()
    for (const id of sourceIds) {
      pagesBySource.set(id, [])
    }
    for (const page of this.state.pages) {
      const list = pagesBySource.get(page.sourceId)
      if (list) {
        list.push(page)
      }
    }

    const reorderedPages: PageDescriptor[] = []
    for (const id of sourceIds) {
      const list = pagesBySource.get(id)
      if (list) {
        list.sort((a, b) => a.sourcePageIndex - b.sourcePageIndex)
        reorderedPages.push(...list)
      }
    }

    this.state.pages = reorderedPages
    this.notify()
  }

  /**
   * Checks whether the current page ordering differs from the default file sequence.
   */
  hasCustomPageOrder(): boolean {
    const sourceIds = Array.from(this.state.sources.keys())
    if (sourceIds.length === 0 || this.state.pages.length === 0) return false

    let expectedIdx = 0
    let currentSourceIdx = 0

    for (const page of this.state.pages) {
      const expectedSourceId = sourceIds[currentSourceIdx]
      if (page.sourceId !== expectedSourceId) {
        const foundSourceIdx = sourceIds.indexOf(page.sourceId)
        if (foundSourceIdx > currentSourceIdx) {
          currentSourceIdx = foundSourceIdx
          expectedIdx = 0
        } else {
          return true
        }
      }
      if (page.sourcePageIndex !== expectedIdx) {
        return true
      }
      expectedIdx++
    }
    return false
  }

  /**
   * Moves a list of pages (single or multiple) to a target index position.
   */
  reorderMultiplePages(draggedIds: string[], targetIndex: number): void {
    if (draggedIds.length === 0) return
    const draggedSet = new Set(draggedIds)
    const draggedPages = this.state.pages.filter((p) => draggedSet.has(p.id))
    if (draggedPages.length === 0) return

    const remainingPages = this.state.pages.filter((p) => !draggedSet.has(p.id))
    const clampedIndex = Math.max(0, Math.min(targetIndex, remainingPages.length))

    remainingPages.splice(clampedIndex, 0, ...draggedPages)
    this.state.pages = remainingPages
    this.notify()
  }

  /**
   * Rotates an individual page by deltaDegrees (-90 for CCW, +90 for CW).
   * Signatures are anchored in intrinsic coordinates and rotate smoothly with the page.
   */
  rotatePage(pageId: string, deltaDegrees: number): void {
    this.state.pages = this.state.pages.map((p) => {
      if (p.id === pageId) {
        const newRotation = ((p.rotation + deltaDegrees) % 360 + 360) % 360
        return { ...p, rotation: newRotation }
      }
      return p
    })
    this.notify()
  }

  /**
   * Rotates all currently selected pages (or all pages if none selected).
   */
  rotateSelectedPages(deltaDegrees: number): void {
    const targetIds =
      this.state.selectedPageIds.size > 0
        ? this.state.selectedPageIds
        : new Set(this.state.pages.map((p) => p.id))

    this.state.pages = this.state.pages.map((p) => {
      if (targetIds.has(p.id)) {
        const newRotation = ((p.rotation + deltaDegrees) % 360 + 360) % 360
        return { ...p, rotation: newRotation }
      }
      return p
    })
    this.notify()
  }

  /**
   * Updates all editor annotations (form values, drawings, and signatures) on a page.
   */
  updatePageEditorData(
    pageId: string,
    data: {
      formValues?: Record<string, string | boolean>
      drawingDataUrl?: string
      signatures?: import('../domain/types').SignatureOverlay[]
    }
  ): void {
    const page = this.state.pages.find((p) => p.id === pageId)
    if (!page) return

    this.state.pages = this.state.pages.map((p) => {
      if (p.id === pageId) {
        return {
          ...p,
          formValues: data.formValues !== undefined ? { ...data.formValues } : p.formValues,
          drawingDataUrl: data.drawingDataUrl !== undefined ? data.drawingDataUrl : p.drawingDataUrl,
          signatures: data.signatures !== undefined ? [...data.signatures] : p.signatures,
        }
      }
      return p
    })

    // Invalidate cached thumbnail so page card reflects the new drawing and form edits
    this.thumbnailManager.clearCacheForSource(page.sourceId)
    this.notify()
  }

  /**
   * Extracts form fields for a given source page.
   */
  async extractPageFormFields(sourceId: string, pageIndex: number, rotation = 0): Promise<import('../domain/types').FormFieldDescriptor[]> {
    return this.sourceManager.extractPageFormFields(sourceId, pageIndex, rotation)
  }

  /**
   * Extracts text items bounding boxes in percentage coordinates for smart text highlighting.
   */
  async extractPageTextBlocks(sourceId: string, pageIndex: number, rotation = 0) {
    return this.sourceManager.extractPageTextBlocks(sourceId, pageIndex, rotation)
  }

  /**
   * Deletes an individual page.
   */
  deletePage(pageId: string): void {
    const page = this.state.pages.find((p) => p.id === pageId)
    this.state.pages = this.state.pages.filter((p) => p.id !== pageId)
    this.state.selectedPageIds.delete(pageId)

    if (page) {
      const remainingForSource = this.state.pages.some((p) => p.sourceId === page.sourceId)
      if (!remainingForSource) {
        this.sourceManager.removeSource(page.sourceId)
        this.thumbnailManager.clearCacheForSource(page.sourceId)
        this.state.sources.delete(page.sourceId)
      }
    }

    this.notify()
  }

  /**
   * Deletes all currently selected pages.
   */
  deleteSelectedPages(): void {
    if (this.state.selectedPageIds.size === 0) return

    const deletedIds = new Set(this.state.selectedPageIds)
    this.state.pages = this.state.pages.filter((p) => !deletedIds.has(p.id))
    this.state.selectedPageIds.clear()

    for (const [sourceId] of this.state.sources) {
      const hasPages = this.state.pages.some((p) => p.sourceId === sourceId)
      if (!hasPages) {
        this.sourceManager.removeSource(sourceId)
        this.thumbnailManager.clearCacheForSource(sourceId)
        this.state.sources.delete(sourceId)
      }
    }

    this.notify()
  }

  /**
   * Direct multi-select toggle: clicking any page directly toggles its selection without Ctrl.
   * Shift-click still performs contiguous range selection.
   */
  togglePageSelection(pageId: string, isRange = false): void {
    const newSelected = new Set(this.state.selectedPageIds)

    if (isRange && this.lastSelectedPageId) {
      const lastIdx = this.state.pages.findIndex((p) => p.id === this.lastSelectedPageId)
      const currentIdx = this.state.pages.findIndex((p) => p.id === pageId)

      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx)
        const end = Math.max(lastIdx, currentIdx)
        for (let i = start; i <= end; i++) {
          newSelected.add(this.state.pages[i].id)
        }
      } else {
        newSelected.add(pageId)
      }
    } else {
      // Toggle directly without needing ctrl
      if (newSelected.has(pageId)) {
        newSelected.delete(pageId)
      } else {
        newSelected.add(pageId)
      }
      this.lastSelectedPageId = pageId
    }

    this.state.selectedPageIds = newSelected
    this.notify()
  }

  selectAllPages(): void {
    const allIds = new Set(this.state.pages.map((p) => p.id))
    this.state.selectedPageIds = allIds
    this.notify()
  }

  clearSelection(): void {
    this.state.selectedPageIds.clear()
    this.lastSelectedPageId = null
    this.notify()
  }

  /**
   * Removes a source PDF or image and all its pages.
   */
  removeSource(sourceId: string): void {
    this.sourceManager.removeSource(sourceId)
    this.thumbnailManager.clearCacheForSource(sourceId)
    this.originalPagesBySource.delete(sourceId)

    this.state.sources.delete(sourceId)
    this.state.pages = this.state.pages.filter((p) => p.sourceId !== sourceId)
    this.state.selectedPageIds = new Set(
      Array.from(this.state.selectedPageIds).filter((id) =>
        this.state.pages.some((p) => p.id === id)
      )
    )
    this.notify()
  }

  /**
   * Dismisses an error notification.
   */
  dismissError(errorId: string): void {
    this.state.errors = this.state.errors.filter((e) => e.id !== errorId)
    this.notify()
  }

  /**
   * Clears all documents, caches, and errors.
   */
  clearAll(): void {
    this.sourceManager.clearAll()
    this.thumbnailManager.clearAll()
    this.originalPagesBySource.clear()
    this.state.sources.clear()
    this.state.pages = []
    this.state.selectedPageIds.clear()
    this.state.errors = []
    this.state.isProcessing = false
    this.state.isExporting = false
    this.lastSelectedPageId = null
    this.notify()
  }

  setIncludeBookmarks(include: boolean): void {
    this.state.includeBookmarks = include
    this.notify()
  }

  /**
   * Exports merged PDF of all pages.
   */
  async exportMergedPdf(filename?: string): Promise<void> {
    if (this.state.pages.length === 0) {
      throw new Error('No pages to export.')
    }

    this.state.isExporting = true
    this.notify()

    try {
      const defaultName =
        this.state.sources.size === 1
          ? `${Array.from(this.state.sources.values())[0].name.replace(/\.[^/.]+$/, '')}_merged.pdf`
          : `merged_${this.state.pages.length}_pages.pdf`

      await this.exportManager.exportMergedPdf(
        this.state.pages,
        this.state.sources,
        filename || defaultName,
        this.state.includeBookmarks
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.state.errors.push({
        id: `err_${Date.now()}`,
        fileName: 'Export',
        message: `Failed to export merged PDF: ${message}`,
        timestamp: Date.now(),
      })
      throw err
    } finally {
      this.state.isExporting = false
      this.notify()
    }
  }

  /**
   * Exports a PDF containing only the selected pages.
   */
  async exportSelectedPdf(filename?: string): Promise<void> {
    const pagesToExport =
      this.state.selectedPageIds.size > 0
        ? this.state.pages.filter((p) => this.state.selectedPageIds.has(p.id))
        : this.state.pages

    if (pagesToExport.length === 0) {
      throw new Error('No pages selected to export.')
    }

    this.state.isExporting = true
    this.notify()

    try {
      const defaultName = `selected_${pagesToExport.length}_pages.pdf`
      await this.exportManager.exportMergedPdf(
        pagesToExport,
        this.state.sources,
        filename || defaultName,
        this.state.includeBookmarks
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.state.errors.push({
        id: `err_${Date.now()}`,
        fileName: 'Export Selected',
        message: `Failed to export selected pages: ${message}`,
        timestamp: Date.now(),
      })
      throw err
    } finally {
      this.state.isExporting = false
      this.notify()
    }
  }

  /**
   * Exports split PDF parts (individually or as a single ZIP archive).
   */
  async exportSplitPdf(
    parts: { name: string; pages: PageDescriptor[] }[],
    asZip = false
  ): Promise<void> {
    if (parts.length === 0) {
      throw new Error('No split parts to export.')
    }

    this.state.isExporting = true
    this.notify()

    try {
      await this.exportManager.exportSplitPdfParts(parts, this.state.sources, asZip)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.state.errors.push({
        id: `err_${Date.now()}`,
        fileName: 'Split PDF',
        message: `Failed to split and export document: ${message}`,
        timestamp: Date.now(),
      })
      throw err
    } finally {
      this.state.isExporting = false
      this.notify()
    }
  }

  /**
   * Exports selected pages (or all pages) as pure PNG or JPG image files.
   * Fully composites page rotations and applied digital signatures/stamps.
   * Downloads files directly to the browser with chosen base filename and format.
   */
  async exportImages(
    format: 'png' | 'jpeg' = 'png',
    scope: 'selected' | 'all' = 'selected',
    baseFilename = 'ExportedPage'
  ): Promise<void> {
    const pagesToExport =
      scope === 'selected' && this.state.selectedPageIds.size > 0
        ? this.state.pages.filter((p) => this.state.selectedPageIds.has(p.id))
        : this.state.pages

    if (pagesToExport.length === 0) {
      throw new Error('No pages to export as images.')
    }

    this.state.isExporting = true
    this.notify()

    try {
      const ext = format === 'png' ? 'png' : 'jpg'
      const cleanName =
        baseFilename.trim().replace(/\.(png|jpe?g|webp|pdf)$/i, '') || 'ExportedPage'

      // Pre-render all high-resolution blobs (with rotation and signatures) upfront in parallel
      const blobs = await Promise.all(
        pagesToExport.map((page) =>
          this.thumbnailManager.renderHighResBlob(
            page,
            this.state.sources.get(page.sourceId),
            format,
            2.0
          )
        )
      )

      // Direct browser download for all pages
      for (let i = 0; i < pagesToExport.length; i++) {
        const numSuffix = pagesToExport.length > 1 ? `_${i + 1}` : ''
        const filename = `${cleanName}${numSuffix}.${ext}`
        const url = URL.createObjectURL(blobs[i])
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 1000 + i * 200)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.state.errors.push({
        id: `err_${Date.now()}`,
        fileName: 'Export Images',
        message: `Failed to export images: ${message}`,
        timestamp: Date.now(),
      })
      throw err
    } finally {
      this.state.isExporting = false
      this.notify()
    }
  }

  /**
   * Helper to render a page at high resolution to a Blob for print or export.
   */
  async renderPageBlob(
    page: PageDescriptor,
    format: 'png' | 'jpeg' = 'png',
    scale = 2.0
  ): Promise<Blob> {
    return this.thumbnailManager.renderHighResBlob(
      page,
      this.state.sources.get(page.sourceId),
      format,
      scale
    )
  }

  /**
   * Helper to render the raw un-annotated page for the full-screen editor.
   */
  async renderRawPageBlob(page: PageDescriptor, scale = 2.0): Promise<Blob> {
    return this.thumbnailManager.renderRawPageBlob(
      page,
      this.state.sources.get(page.sourceId),
      scale
    )
  }

  async getThumbnail(
    sourceId: string,
    pageIndex: number,
    maxWidth = 300,
    pageDesc?: PageDescriptor
  ): Promise<string> {
    const desc =
      pageDesc ||
      this.state.pages.find(
        (p) => p.sourceId === sourceId && p.sourcePageIndex === pageIndex
      )
    return this.thumbnailManager.renderThumbnail(sourceId, pageIndex, maxWidth, desc)
  }

  getCachedThumbnail(sourceId: string, pageIndex: number): string | undefined {
    return this.thumbnailManager.getCachedThumbnail(sourceId, pageIndex)
  }

  cancelThumbnail(sourceId: string, pageIndex: number): void {
    this.thumbnailManager.cancelRender(sourceId, pageIndex)
  }
}

export const globalCoordinator = new PdfCoordinator()
