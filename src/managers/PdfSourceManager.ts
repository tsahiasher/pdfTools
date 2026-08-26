import { PDFDocument } from '@cantoo/pdf-lib'
import { pdfjsLib } from '../lib/pdfjs-worker'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PdfSource, PageDescriptor, LoadFileResult, FormFieldDescriptor } from '../domain/types'

// Curated distinctive color palette for source tagging
const SOURCE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
]

export class PdfSourceManager {
  // Retain loaded PDFDocument instances for fast export without reloading
  private pdfLibDocs = new Map<string, PDFDocument>()
  // Retain pdf.js document proxies for rendering thumbnails
  private pdfJsDocs = new Map<string, PDFDocumentProxy>()
  private colorIndex = 0

  /**
   * Loads a PDF or image file into memory.
   */
  async loadFile(file: File): Promise<LoadFileResult> {
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'

    if (isImage) {
      return this.loadImageFile(file)
    } else if (isPdf) {
      return this.loadPdfFile(file)
    } else {
      return {
        success: false,
        fileName: file.name,
        error: 'Unsupported file format. Please upload PDF or image files (PNG, JPG, WebP).'
      }
    }
  }

  /**
   * Loads an image file into memory as a page source.
   */
  private async loadImageFile(file: File): Promise<LoadFileResult> {
    const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    try {
      const arrayBuffer = await file.arrayBuffer()
      let originalBytes: Uint8Array = new Uint8Array(arrayBuffer)
      let mimeType = file.type || 'image/jpeg'

      // Convert WebP / other image formats to PNG so pdf-lib can embed it directly
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType.toLowerCase())) {
        const converted = await this.convertImageToPng(file)
        originalBytes = new Uint8Array(converted.bytes)
        mimeType = 'image/png'
      }

      // Read dimensions using an HTML Image object
      const blob = new Blob([originalBytes.buffer as ArrayBuffer], { type: mimeType })
      const previewUrl = URL.createObjectURL(blob)
      const dimensions = await this.getImageDimensions(previewUrl)

      const color = SOURCE_COLORS[this.colorIndex % SOURCE_COLORS.length]
      this.colorIndex++

      const source: PdfSource = {
        id: sourceId,
        name: file.name,
        type: 'image',
        size: file.size,
        pageCount: 1,
        originalBytes,
        color,
        loadedAt: Date.now(),
        imageMimeType: mimeType,
        imagePreviewUrl: previewUrl,
      }

      const page: PageDescriptor = {
        id: `pg_${sourceId}_0`,
        sourceId,
        sourceType: 'image',
        sourcePageIndex: 0,
        sourceName: file.name,
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: dimensions.width / dimensions.height,
        rotation: 0,
        imagePreviewUrl: previewUrl,
      }

      return {
        success: true,
        source,
        pages: [page],
      }
    } catch (err: unknown) {
      return {
        success: false,
        fileName: file.name,
        error: `Failed to load image: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  }

  /**
   * Helper to get intrinsic image dimensions.
   */
  private getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width || 600,
          height: img.naturalHeight || img.height || 800,
        })
      }
      img.onerror = () => reject(new Error('Failed to decode image dimensions.'))
      img.src = url
    })
  }

  /**
   * Helper to convert non-standard images (e.g. WebP) to PNG bytes.
   */
  private async convertImageToPng(file: File): Promise<{ bytes: Uint8Array }> {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Failed to load image for conversion.'))
        image.src = objectUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get 2d context for image conversion.')
      ctx.drawImage(img, 0, 0)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Failed to export converted PNG blob.')

      const arrayBuf = await blob.arrayBuffer()
      return { bytes: new Uint8Array(arrayBuf) }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  /**
   * Loads a PDF file into memory.
   * Preserves pristine bytes for export and passes a detached copy to pdf.js.
   */
  private async loadPdfFile(file: File): Promise<LoadFileResult> {
    const sourceId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    try {
      const arrayBuffer = await file.arrayBuffer()
      const originalBytes = new Uint8Array(arrayBuffer)

      if (originalBytes.length === 0) {
        return {
          success: false,
          fileName: file.name,
          error: 'File is empty (0 bytes).'
        }
      }

      // 1. Load into @cantoo/pdf-lib using original bytes
      let pdfLibDoc: PDFDocument
      try {
        pdfLibDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: false })
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('encrypt')) {
          return {
            success: false,
            fileName: file.name,
            error: 'Password-protected or encrypted PDFs are not supported.'
          }
        }
        return {
          success: false,
          fileName: file.name,
          error: `Corrupted or invalid PDF: ${errorMsg}`
        }
      }

      // 2. Load into pdf.js using a CLONED slice of original bytes to prevent buffer detachment
      const pdfJsData = originalBytes.slice()
      let pdfJsDoc: PDFDocumentProxy
      try {
        const baseUrl = typeof window !== 'undefined' && window.location ? `${window.location.origin}/` : './'
        const loadingTask = pdfjsLib.getDocument({
          data: pdfJsData,
          cMapUrl: `${baseUrl}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${baseUrl}standard_fonts/`,
        })
        pdfJsDoc = await loadingTask.promise
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        if (errorMsg.toLowerCase().includes('password')) {
          return {
            success: false,
            fileName: file.name,
            error: 'Password-protected or encrypted PDFs are not supported.'
          }
        }
        return {
          success: false,
          fileName: file.name,
          error: `Failed to parse PDF for preview: ${errorMsg}`
        }
      }

      const pageCount = pdfJsDoc.numPages
      if (pageCount === 0) {
        return {
          success: false,
          fileName: file.name,
          error: 'PDF contains 0 pages.'
        }
      }

      // Cache the document instances
      this.pdfLibDocs.set(sourceId, pdfLibDoc)
      this.pdfJsDocs.set(sourceId, pdfJsDoc)

      // 3. Extract page descriptors
      const pages: PageDescriptor[] = []
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const page = await pdfJsDoc.getPage(pageIndex + 1)
        const viewport = page.getViewport({ scale: 1.0 })
        const width = viewport.width
        const height = viewport.height
        const aspectRatio = width / height

        pages.push({
          id: `pg_${sourceId}_${pageIndex}`,
          sourceId,
          sourceType: 'pdf',
          sourcePageIndex: pageIndex,
          sourceName: file.name,
          width,
          height,
          aspectRatio,
          rotation: 0,
        })
      }

      // Assign consistent theme color to this source
      const color = SOURCE_COLORS[this.colorIndex % SOURCE_COLORS.length]
      this.colorIndex++

      const source: PdfSource = {
        id: sourceId,
        name: file.name,
        type: 'pdf',
        size: file.size,
        pageCount,
        originalBytes,
        color,
        loadedAt: Date.now(),
      }

      return {
        success: true,
        source,
        pages,
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred while reading file'
      return {
        success: false,
        fileName: file.name,
        error: errorMsg,
      }
    }
  }

  getPdfLibDocument(sourceId: string): PDFDocument | undefined {
    return this.pdfLibDocs.get(sourceId)
  }

  getPdfJsDocument(sourceId: string): PDFDocumentProxy | undefined {
    return this.pdfJsDocs.get(sourceId)
  }

  /**
   * Extracts interactive PDF AcroForm fields (text, checkbox, radio, choice) for a given page.
   */
  async extractPageFormFields(sourceId: string, pageIndex: number, rotation = 0): Promise<FormFieldDescriptor[]> {
    const pdfJsDoc = this.pdfJsDocs.get(sourceId)
    if (!pdfJsDoc) return []

    try {
      const page = await pdfJsDoc.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: 1.0, rotation: ((rotation % 360) + 360) % 360 })
      const annotations = await page.getAnnotations()

      const fields: FormFieldDescriptor[] = []

      for (const annot of annotations) {
        if (annot.subtype !== 'Widget') continue

        const rawRect = annot.rect
        if (!rawRect || rawRect.length < 4) continue

        const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle(rawRect)
        const left = Math.min(vx1, vx2)
        const top = Math.min(vy1, vy2)
        const w = Math.abs(vx2 - vx1)
        const h = Math.abs(vy2 - vy1)

        const xPercent = (left / viewport.width) * 100
        const yPercent = (top / viewport.height) * 100
        const widthPercent = (w / viewport.width) * 100
        const heightPercent = (h / viewport.height) * 100

        let fieldType: FormFieldDescriptor['type'] = 'text'
        if (annot.fieldType === 'Btn') {
          if (annot.radioButton) {
            fieldType = 'radio'
          } else if (annot.checkBox) {
            fieldType = 'checkbox'
          } else {
            fieldType = 'checkbox'
          }
        } else if (annot.fieldType === 'Ch') {
          fieldType = 'choice'
        } else if (annot.fieldType === 'Sig') {
          fieldType = 'signature'
        }

        const fieldName = annot.fieldName || annot.id || `field_${fields.length + 1}`

        let initialValue: string | boolean = ''
        if (fieldType === 'checkbox' || fieldType === 'radio') {
          const rawVal = annot.fieldValue
          if (typeof rawVal === 'boolean') {
            initialValue = rawVal
          } else if (typeof rawVal === 'string') {
            const norm = rawVal.trim().toLowerCase()
            initialValue = norm !== 'off' && norm !== '/off' && norm !== '' && norm !== 'false' && norm !== '0'
          } else {
            initialValue = false
          }
        } else {
          initialValue = typeof annot.fieldValue === 'string' ? annot.fieldValue : (annot.fieldValue != null ? String(annot.fieldValue) : '')
        }

        fields.push({
          id: annot.id || `fld_${pageIndex}_${fields.length}`,
          name: fieldName,
          type: fieldType,
          rect: [rawRect[0], rawRect[1], rawRect[2], rawRect[3]],
          xPercent,
          yPercent,
          widthPercent,
          heightPercent,
          value: initialValue,
          options: annot.options ? annot.options.map((o: any) => (typeof o === 'string' ? o : o?.displayValue || o?.exportValue || '')) : undefined,
          readOnly: !!annot.readOnly,
          multiline:
            !!annot.multiLine ||
            (typeof annot.fieldFlags === 'number' && (annot.fieldFlags & 4096) !== 0) ||
            heightPercent >= 2.5 ||
            (typeof initialValue === 'string' && initialValue.includes('\n')),
          fontSize: annot.fontSize,
        })
      }

      return fields
    } catch (err) {
      console.warn('Error extracting form fields:', err)
      return []
    }
  }

  /**
   * Extracts text items bounding boxes in percentage coordinates for smart text highlighting.
   */
  async extractPageTextBlocks(sourceId: string, pageIndex: number, rotation = 0): Promise<{
    xPercent: number
    yPercent: number
    widthPercent: number
    heightPercent: number
    str: string
  }[]> {
    const pdfJsDoc = this.pdfJsDocs.get(sourceId)
    if (!pdfJsDoc) return []

    try {
      const page = await pdfJsDoc.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale: 1.0, rotation: ((rotation % 360) + 360) % 360 })
      const textContent = await page.getTextContent()
      const rawBlocks: {
        left: number
        top: number
        right: number
        bottom: number
        str: string
      }[] = []

      for (const item of textContent.items as any[]) {
        if (!item.str || !item.transform) continue
        const tx = item.transform[4]
        const ty = item.transform[5]
        const w = item.width || 0
        const fontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12

        // Tight PDF text bounding box with ascent and descent
        const rawRect = [tx, ty - fontSize * 0.15, tx + w, ty + fontSize * 0.85]
        const [vx1, vy1, vx2, vy2] = viewport.convertToViewportRectangle(rawRect)
        const left = Math.min(vx1, vx2)
        const top = Math.min(vy1, vy2)
        const right = Math.max(vx1, vx2)
        const bottom = Math.max(vy1, vy2)

        if (right > left && bottom > top) {
          rawBlocks.push({ left, top, right, bottom, str: item.str })
        }
      }

      // Sort by vertical position (top-to-bottom), then horizontal (left-to-right)
      rawBlocks.sort((a, b) => (Math.abs(a.top - b.top) > 4 ? a.top - b.top : a.left - b.left))

      // Merge contiguous text fragments on the same line
      const mergedLines: {
        xPercent: number
        yPercent: number
        widthPercent: number
        heightPercent: number
        str: string
      }[] = []

      for (const block of rawBlocks) {
        const last = mergedLines[mergedLines.length - 1]
        if (last) {
          const lastTopPx = (last.yPercent * viewport.height) / 100
          const lastBottomPx = ((last.yPercent + last.heightPercent) * viewport.height) / 100
          const lastRightPx = ((last.xPercent + last.widthPercent) * viewport.width) / 100
          const lastLeftPx = (last.xPercent * viewport.width) / 100

          const sameLine = Math.abs(block.top - lastTopPx) < 5 && Math.abs(block.bottom - lastBottomPx) < 5
          const isNearby = block.left >= lastLeftPx - 2 && block.left <= lastRightPx + 24

          if (sameLine && isNearby) {
            const newRight = Math.max(lastRightPx, block.right)
            const newBottom = Math.max(lastBottomPx, block.bottom)
            const newTop = Math.min(lastTopPx, block.top)

            last.xPercent = (lastLeftPx / viewport.width) * 100
            last.yPercent = (newTop / viewport.height) * 100
            last.widthPercent = ((newRight - lastLeftPx) / viewport.width) * 100
            last.heightPercent = ((newBottom - newTop) / viewport.height) * 100
            last.str += ' ' + block.str
            continue
          }
        }

        mergedLines.push({
          xPercent: (block.left / viewport.width) * 100,
          yPercent: (block.top / viewport.height) * 100,
          widthPercent: ((block.right - block.left) / viewport.width) * 100,
          heightPercent: ((block.bottom - block.top) / viewport.height) * 100,
          str: block.str,
        })
      }

      return mergedLines
    } catch {
      return []
    }
  }


  /**
   * Extracts the full bookmark outline hierarchy from a PDF source using pdf.js.
   */
  async extractBookmarks(sourceId: string): Promise<import('../domain/types').BookmarkItem[]> {
    const pdfJsDoc = this.pdfJsDocs.get(sourceId)
    if (!pdfJsDoc) return []

    try {
      const outline = (await pdfJsDoc.getOutline()) as Array<{
        title?: string
        dest?: unknown
        items?: unknown[]
      }> | null

      if (!outline || outline.length === 0) return []

      const processNode = async (
        item: { title?: string; dest?: unknown; items?: unknown[] },
        parentId?: string
      ): Promise<import('../domain/types').BookmarkItem | null> => {
        const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        let pageIndex = -1
        let destination: import('../domain/types').BookmarkDestinationInfo = { fitType: '/Fit' }

        if (item.dest) {
          try {
            let destArray: unknown = item.dest
            if (typeof destArray === 'string') {
              destArray = await pdfJsDoc.getDestination(destArray)
            }

            if (Array.isArray(destArray) && destArray.length > 0) {
              const pageRef = destArray[0]
              if (pageRef) {
                pageIndex = await pdfJsDoc.getPageIndex(pageRef)
              }
              destination = parsePdfJsDestination(destArray)
            }
          } catch {
            pageIndex = -1
            destination = { fitType: '/Fit' }
          }
        }

        const children: import('../domain/types').BookmarkItem[] = []
        if (item.items && Array.isArray(item.items)) {
          for (const child of item.items) {
            const processedChild = await processNode(
              child as { title?: string; dest?: unknown; items?: unknown[] },
              id
            )
            if (processedChild) children.push(processedChild)
          }
        }

        if (pageIndex >= 0 || children.length > 0) {
          return {
            id,
            title: item.title || 'Untitled',
            sourceId,
            sourcePageIndex: pageIndex,
            parentId,
            children: children.length > 0 ? children : undefined,
            fitType: destination.fitType,
            left: destination.left,
            top: destination.top,
            zoom: destination.zoom,
            bottom: destination.bottom,
            right: destination.right,
          }
        }

        return null
      }

      const results: import('../domain/types').BookmarkItem[] = []
      for (const item of outline) {
        const processed = await processNode(item)
        if (processed) results.push(processed)
      }
      return results
    } catch {
      return []
    }
  }

  removeSource(sourceId: string): void {
    const pdfJsDoc = this.pdfJsDocs.get(sourceId)
    if (pdfJsDoc) {
      pdfJsDoc.destroy().catch(() => {})
      this.pdfJsDocs.delete(sourceId)
    }
    this.pdfLibDocs.delete(sourceId)
  }

  clearAll(): void {
    for (const [, doc] of this.pdfJsDocs) {
      doc.destroy().catch(() => {})
    }
    this.pdfJsDocs.clear()
    this.pdfLibDocs.clear()
    this.colorIndex = 0
  }
}

function parsePdfJsDestination(dest: unknown[]): import('../domain/types').BookmarkDestinationInfo {
  const rawName = getDestinationName(dest[1])
  const fitType = rawName ? `/${rawName.replace(/^\//, '')}` : '/Fit'

  const value = (index: number): number | null | undefined => {
    if (index >= dest.length) return undefined
    const v = dest[index]
    if (v === null) return null
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined
  }

  switch (fitType.toUpperCase()) {
    case '/XYZ':
      return {
        fitType: '/XYZ',
        left: value(2),
        top: value(3),
        zoom: value(4),
      }
    case '/FITH':
      return { fitType: '/FitH', top: value(2) }
    case '/FITBH':
      return { fitType: '/FitBH', top: value(2) }
    case '/FITV':
      return { fitType: '/FitV', left: value(2) }
    case '/FITBV':
      return { fitType: '/FitBV', left: value(2) }
    case '/FITR':
      return {
        fitType: '/FitR',
        left: value(2),
        bottom: value(3),
        right: value(4),
        top: value(5),
      }
    case '/FITB':
      return { fitType: '/FitB' }
    case '/FIT':
    default:
      return { fitType: '/Fit' }
  }
}

function getDestinationName(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name
    return typeof name === 'string' ? name : undefined
  }
  return undefined
}
