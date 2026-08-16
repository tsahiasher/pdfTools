import type { PdfSourceManager } from './PdfSourceManager'
import type { RenderTask } from 'pdfjs-dist'

export class ThumbnailRenderManager {
  private sourceManager: PdfSourceManager
  private thumbnailCache = new Map<string, string>() // key: `${sourceId}_${pageIndex}`, value: dataUrl
  private activeRenderTasks = new Map<string, RenderTask>()

  constructor(sourceManager: PdfSourceManager) {
    this.sourceManager = sourceManager
  }

  private getCacheKey(sourceId: string, pageIndex: number): string {
    return `${sourceId}_${pageIndex}`
  }

  /**
   * Returns cached data URL if available.
   */
  getCachedThumbnail(sourceId: string, pageIndex: number): string | undefined {
    return this.thumbnailCache.get(this.getCacheKey(sourceId, pageIndex))
  }

  /**
   * Renders a page preview thumbnail into a data URL.
   * Uses preview pixels only (isolated from PDF export).
   */
  async renderThumbnail(
    sourceId: string,
    pageIndex: number,
    maxWidth = 300
  ): Promise<string> {
    const cacheKey = this.getCacheKey(sourceId, pageIndex)

    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!
    }

    const pdfJsDoc = this.sourceManager.getPdfJsDocument(sourceId)
    if (!pdfJsDoc) {
      throw new Error(`Source PDF not found for id: ${sourceId}`)
    }

    // pdf.js page numbers are 1-based
    const pageNumber = pageIndex + 1
    const page = await pdfJsDoc.getPage(pageNumber)

    // Calculate scale to fit target max width while maintaining aspect ratio
    const unscaledViewport = page.getViewport({ scale: 1.0 })
    const scale = Math.min(maxWidth / unscaledViewport.width, 2.0)
    const viewport = page.getViewport({ scale })

    // Create offscreen canvas for rendering
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) {
      throw new Error('Failed to get 2d context for canvas thumbnail')
    }

    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    // Render white background first
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Cancel any ongoing render task for this page
    if (this.activeRenderTasks.has(cacheKey)) {
      try {
        this.activeRenderTasks.get(cacheKey)?.cancel()
      } catch {
        // Ignored
      }
      this.activeRenderTasks.delete(cacheKey)
    }

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    }

    const renderTask = page.render(renderContext)
    this.activeRenderTasks.set(cacheKey, renderTask)

    try {
      await renderTask.promise
      this.activeRenderTasks.delete(cacheKey)

      // Convert to medium quality JPEG/PNG data URL for preview cache
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      this.thumbnailCache.set(cacheKey, dataUrl)

      // Clean up canvas references
      canvas.width = 0
      canvas.height = 0

      return dataUrl
    } catch (err: unknown) {
      this.activeRenderTasks.delete(cacheKey)
      if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
        throw err
      }
      throw new Error(`Thumbnail rendering failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  cancelRender(sourceId: string, pageIndex: number): void {
    const cacheKey = this.getCacheKey(sourceId, pageIndex)
    const task = this.activeRenderTasks.get(cacheKey)
    if (task) {
      try {
        task.cancel()
      } catch {
        // Ignored
      }
      this.activeRenderTasks.delete(cacheKey)
    }
  }

  clearCacheForSource(sourceId: string): void {
    for (const key of Array.from(this.thumbnailCache.keys())) {
      if (key.startsWith(`${sourceId}_`)) {
        this.thumbnailCache.delete(key)
      }
    }
  }

  /**
   * Renders a page at high resolution with rotation applied for image export (PNG / JPEG).
   */
  async renderHighResBlob(
    sourceId: string,
    pageIndex: number,
    rotation: number,
    format: 'png' | 'jpeg' = 'png',
    scale = 2.0
  ): Promise<Blob> {
    const pdfJsDoc = this.sourceManager.getPdfJsDocument(sourceId)
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    const quality = format === 'jpeg' ? 0.92 : undefined

    if (pdfJsDoc) {
      const pageNumber = pageIndex + 1
      const page = await pdfJsDoc.getPage(pageNumber)
      const viewport = page.getViewport({ scale, rotation })

      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Failed to create canvas context for image export')

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({ canvasContext: context, viewport }).promise

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to generate image blob'))
        }, mimeType, quality)
      })
    }

    throw new Error(`Source document ${sourceId} not found`)
  }

  clearAll(): void {
    for (const [, task] of this.activeRenderTasks) {
      try {
        task.cancel()
      } catch {
        // Ignored
      }
    }
    this.activeRenderTasks.clear()
    this.thumbnailCache.clear()
  }
}
