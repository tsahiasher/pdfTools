import type { PdfSourceManager } from './PdfSourceManager'
import type { RenderTask } from 'pdfjs-dist'
import { getSignatureIntrinsicState } from '../lib/signatureUtils'

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
   * Renders a page at high resolution with rotation and signatures composited.
   * Supports both PDF sources and Image sources for PNG / JPEG export and print rendering.
   */
  async renderHighResBlob(
    page: import('../domain/types').PageDescriptor,
    source?: import('../domain/types').PdfSource,
    format: 'png' | 'jpeg' = 'png',
    scale = 2.0
  ): Promise<Blob> {
    const canvas = await this.renderPageToCanvas(page, source, scale)
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    const quality = format === 'jpeg' ? 0.92 : undefined

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to generate image blob'))
      }, mimeType, quality)
    })
  }

  /**
   * Renders a page to an HTML5 canvas element with rotation and signatures applied.
   */
  async renderPageToCanvas(
    page: import('../domain/types').PageDescriptor,
    source?: import('../domain/types').PdfSource,
    scale = 2.0
  ): Promise<HTMLCanvasElement> {
    const baseCanvas = document.createElement('canvas')
    const baseCtx = baseCanvas.getContext('2d')
    if (!baseCtx) throw new Error('Failed to create canvas context for page render')

    let baseW = 0
    let baseH = 0

    if (page.sourceType === 'pdf') {
      const pdfJsDoc = this.sourceManager.getPdfJsDocument(page.sourceId)
      if (!pdfJsDoc) throw new Error(`Source document ${page.sourceId} not found`)

      const pageNumber = page.sourcePageIndex + 1
      const pdfPage = await pdfJsDoc.getPage(pageNumber)
      // Render unrotated page content (rotation: 0)
      const viewport = pdfPage.getViewport({ scale, rotation: 0 })

      baseW = Math.floor(viewport.width)
      baseH = Math.floor(viewport.height)
      baseCanvas.width = baseW
      baseCanvas.height = baseH

      baseCtx.fillStyle = '#ffffff'
      baseCtx.fillRect(0, 0, baseW, baseH)

      await pdfPage.render({ canvasContext: baseCtx, viewport }).promise
    } else {
      // Image source
      const imageUrl = page.imagePreviewUrl || source?.imagePreviewUrl
      if (!imageUrl) throw new Error(`Image preview URL missing for source ${page.sourceId}`)

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Failed to load image for rendering.'))
        image.src = imageUrl
      })

      const origW = img.naturalWidth || img.width || 600
      const origH = img.naturalHeight || img.height || 800
      const baseScale = scale / 2.0

      baseW = Math.floor(origW * baseScale)
      baseH = Math.floor(origH * baseScale)
      baseCanvas.width = baseW
      baseCanvas.height = baseH

      baseCtx.fillStyle = '#ffffff'
      baseCtx.fillRect(0, 0, baseW, baseH)
      baseCtx.drawImage(img, 0, 0, baseW, baseH)
    }

    // Step 2: Composite all signatures onto the unrotated base canvas
    if (page.signatures && page.signatures.length > 0) {
      for (const sig of page.signatures) {
        try {
          const sigImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = () => reject(new Error('Failed to load signature overlay'))
            image.src = sig.imageDataUrl
          })

          const intrinsic = getSignatureIntrinsicState(sig)
          const sigX = (baseW * intrinsic.xPercent) / 100
          const sigY = (baseH * intrinsic.yPercent) / 100
          const sigW = (baseW * intrinsic.widthPercent) / 100
          const sigH = (baseH * intrinsic.heightPercent) / 100

          if (intrinsic.intrinsicRotation === 0) {
            baseCtx.drawImage(sigImg, sigX, sigY, sigW, sigH)
          } else {
            baseCtx.save()
            baseCtx.translate(sigX + sigW / 2, sigY + sigH / 2)
            baseCtx.rotate((intrinsic.intrinsicRotation * Math.PI) / 180)
            baseCtx.drawImage(sigImg, -sigW / 2, -sigH / 2, sigW, sigH)
            baseCtx.restore()
          }
        } catch (e) {
          console.warn('Could not composite signature on canvas:', e)
        }
      }
    }

    // Step 3: If unrotated, return baseCanvas directly
    const rot = ((page.rotation % 360) + 360) % 360
    if (rot === 0) {
      return baseCanvas
    }

    // Step 4: Rotate the fully composited base canvas (page + signatures) by page.rotation
    const is90or270 = rot === 90 || rot === 270
    const rotatedCanvas = document.createElement('canvas')
    rotatedCanvas.width = is90or270 ? baseH : baseW
    rotatedCanvas.height = is90or270 ? baseW : baseH

    const rotCtx = rotatedCanvas.getContext('2d')
    if (!rotCtx) return baseCanvas

    rotCtx.fillStyle = '#ffffff'
    rotCtx.fillRect(0, 0, rotatedCanvas.width, rotatedCanvas.height)

    rotCtx.save()
    rotCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2)
    rotCtx.rotate((rot * Math.PI) / 180)
    rotCtx.drawImage(baseCanvas, -baseW / 2, -baseH / 2, baseW, baseH)
    rotCtx.restore()

    return rotatedCanvas
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
