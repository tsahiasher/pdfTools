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
    maxWidth = 300,
    pageDesc?: import('../domain/types').PageDescriptor
  ): Promise<string> {
    const cacheKey = this.getCacheKey(sourceId, pageIndex)

    if (this.thumbnailCache.has(cacheKey)) {
      return this.thumbnailCache.get(cacheKey)!
    }

    // If page has form values, drawings, or signatures, render full composited canvas
    if (
      pageDesc &&
      ((pageDesc.formValues && Object.keys(pageDesc.formValues).length > 0) ||
        pageDesc.drawingDataUrl ||
        (pageDesc.signatures && pageDesc.signatures.length > 0) ||
        (pageDesc.customTextFields && pageDesc.customTextFields.length > 0))
    ) {
      try {
        const scale = Math.min(maxWidth / (pageDesc.width || 600), 1.5)
        const canvas = await this.renderPageToCanvas(pageDesc, undefined, scale)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        this.thumbnailCache.set(cacheKey, dataUrl)
        canvas.width = 0
        canvas.height = 0
        return dataUrl
      } catch (e) {
        console.warn('Composited thumbnail failed, falling back to base render:', e)
      }
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
   * Renders the raw PDF or image page without any drawing or signature overlays.
   */
  async renderRawPageBlob(
    page: import('../domain/types').PageDescriptor,
    source?: import('../domain/types').PdfSource,
    scale = 2.0
  ): Promise<Blob> {
    const baseCanvas = document.createElement('canvas')
    const baseCtx = baseCanvas.getContext('2d')
    if (!baseCtx) throw new Error('Failed to create canvas context')

    if (page.sourceType === 'pdf') {
      const pdfJsDoc = this.sourceManager.getPdfJsDocument(page.sourceId)
      if (!pdfJsDoc) throw new Error(`Source PDF ${page.sourceId} not found`)

      const pdfPage = await pdfJsDoc.getPage(page.sourcePageIndex + 1)
      const rot = ((page.rotation % 360) + 360) % 360
      const viewport = pdfPage.getViewport({ scale, rotation: rot })

      baseCanvas.width = Math.floor(viewport.width)
      baseCanvas.height = Math.floor(viewport.height)

      baseCtx.fillStyle = '#ffffff'
      baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height)

      await pdfPage.render({ canvasContext: baseCtx, viewport }).promise
    } else {
      const imageUrl = page.imagePreviewUrl || source?.imagePreviewUrl
      if (!imageUrl) throw new Error('Image URL missing')

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Failed to load image'))
        image.src = imageUrl
      })

      const rot = ((page.rotation % 360) + 360) % 360
      const is90or270 = rot === 90 || rot === 270
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height

      baseCanvas.width = is90or270 ? h : w
      baseCanvas.height = is90or270 ? w : h

      baseCtx.fillStyle = '#ffffff'
      baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height)

      baseCtx.save()
      baseCtx.translate(baseCanvas.width / 2, baseCanvas.height / 2)
      baseCtx.rotate((rot * Math.PI) / 180)
      baseCtx.drawImage(img, -w / 2, -h / 2, w, h)
      baseCtx.restore()
    }

    return new Promise<Blob>((resolve, reject) => {
      baseCanvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to generate raw page blob'))
      }, 'image/png')
    })
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

    // Step 2a: Composite custom text fields onto base canvas
    if (page.customTextFields && page.customTextFields.length > 0) {
      for (const field of page.customTextFields) {
        if (!field.text) continue
        const fx = (baseW * field.xPercent) / 100
        const fy = (baseH * field.yPercent) / 100
        const fw = (baseW * field.widthPercent) / 100

        baseCtx.save()
        const fontSizePx = Math.max(12, Math.round((field.fontSize || 14) * (scale / 1.5)))
        const fontStyle = `${field.isItalic ? 'italic ' : ''}${field.isBold ? 'bold ' : ''}`
        baseCtx.font = `${fontStyle}${fontSizePx}px ${field.fontFamily || 'sans-serif'}`
        baseCtx.fillStyle = field.color || '#000000'
        baseCtx.textBaseline = 'top'

        // Render text with word wrap
        const words = field.text.split(' ')
        let line = ''
        let currentY = fy + 4
        const lineHeight = fontSizePx * 1.25

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' '
          const metrics = baseCtx.measureText(testLine)
          if (metrics.width > fw && n > 0) {
            baseCtx.fillText(line, fx + 4, currentY)
            line = words[n] + ' '
            currentY += lineHeight
          } else {
            line = testLine
          }
        }
        baseCtx.fillText(line, fx + 4, currentY)
        baseCtx.restore()
      }
    }

    // Step 2a-2: Composite AcroForm field values onto base canvas
    if (page.formValues && Object.keys(page.formValues).length > 0 && page.sourceType === 'pdf') {
      try {
        const fields = await this.sourceManager.extractPageFormFields(page.sourceId, page.sourcePageIndex, 0)
        for (const f of fields) {
          const val = page.formValues[f.name]
          if (val === undefined || val === '') continue

          const fx = (baseW * f.xPercent) / 100
          const fy = (baseH * f.yPercent) / 100
          const fw = (baseW * f.widthPercent) / 100
          const fh = (baseH * f.heightPercent) / 100

          baseCtx.save()
          if (typeof val === 'boolean' || f.type === 'checkbox' || f.type === 'radio') {
            const isChecked =
              typeof val === 'boolean'
                ? val
                : String(val).toLowerCase() !== 'off' &&
                  String(val).toLowerCase() !== '/off' &&
                  String(val).toLowerCase() !== 'false' &&
                  String(val) !== ''
            if (isChecked) {
              baseCtx.fillStyle = '#000000'
              baseCtx.font = `bold ${Math.round(Math.min(fw, fh) * 0.85)}px sans-serif`
              baseCtx.textAlign = 'center'
              baseCtx.textBaseline = 'middle'
              baseCtx.fillText('✓', fx + fw / 2, fy + fh / 2)
            }
          } else {
            const textVal = String(val)
            const lines = textVal.split('\n')
            const maxLines = Math.max(1, lines.length)
            const fontSizePx = Math.max(8, Math.min(18, Math.round((fh / maxLines) * 0.7)))
            baseCtx.fillStyle = '#000000'
            baseCtx.font = `${fontSizePx}px sans-serif`
            baseCtx.textBaseline = 'top'
            const lineHeight = fontSizePx * 1.25

            lines.forEach((lineText, lIdx) => {
              const lineY = fy + 2 + lIdx * lineHeight
              if (lineY + fontSizePx <= fy + fh + 4) {
                baseCtx.fillText(lineText, fx + 3, lineY, fw - 6)
              }
            })
          }
          baseCtx.restore()
        }
      } catch (e) {
        console.warn('Could not composite form fields on thumbnail:', e)
      }
    }

    // Step 2b: Composite freehand drawings & highlighters layer onto base canvas
    if (page.drawingDataUrl) {
      try {
        const drawingImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('Failed to load drawing layer'))
          image.src = page.drawingDataUrl!
        })
        baseCtx.drawImage(drawingImg, 0, 0, baseW, baseH)
      } catch (e) {
        console.warn('Could not composite drawing layer on canvas:', e)
      }
    }

    // Step 2c: Composite all signatures onto the unrotated base canvas
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
