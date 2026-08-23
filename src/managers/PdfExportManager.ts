import {
  PDFDocument,
  degrees,
  PDFName,
  PDFDict,
  PDFHexString,
  PDFNumber,
  PDFNull,
  PDFRef,
} from '@cantoo/pdf-lib'
import JSZip from 'jszip'
import { getSignatureIntrinsicState } from '../lib/signatureUtils'
import type { PdfSourceManager } from './PdfSourceManager'
import type { PageDescriptor, PdfSource, BookmarkItem } from '../domain/types'

export class PdfExportManager {
  private sourceManager: PdfSourceManager

  constructor(sourceManager: PdfSourceManager) {
    this.sourceManager = sourceManager
  }

  /**
   * Merges pages in the exact order specified by the descriptors array.
   * Performs lossless, object-level page copying and image embedding.
   * Respects non-destructive rotation angles and optional bookmark preservation.
   */
  async exportMergedPdf(
    pages: PageDescriptor[],
    sourcesMap: Map<string, PdfSource>,
    outputFilename = 'merged_document.pdf',
    includeBookmarks = false
  ): Promise<Uint8Array> {
    if (pages.length === 0) {
      throw new Error('Cannot export an empty document. Please add at least one PDF or image page.')
    }

    const mergedDoc = await PDFDocument.create()

    for (let i = 0; i < pages.length; i++) {
      const pageDesc = pages[i]
      const source = sourcesMap.get(pageDesc.sourceId)

      if (!source) {
        throw new Error(`Missing source for page ${i + 1} (${pageDesc.sourceName}).`)
      }

      if (pageDesc.sourceType === 'image') {
        // Embed image directly into the PDF
        const isPng = source.imageMimeType === 'image/png' || source.name.toLowerCase().endsWith('.png')
        let embeddedImage
        if (isPng) {
          embeddedImage = await mergedDoc.embedPng(source.originalBytes)
        } else {
          embeddedImage = await mergedDoc.embedJpg(source.originalBytes)
        }

        const imgWidth = pageDesc.width
        const imgHeight = pageDesc.height

        const newPage = mergedDoc.addPage([imgWidth, imgHeight])
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: imgWidth,
          height: imgHeight,
        })

        if (pageDesc.rotation !== 0) {
          newPage.setRotation(degrees((pageDesc.rotation % 360 + 360) % 360))
        }

        await this.embedSignaturesOnPage(mergedDoc, newPage, pageDesc)
      } else {
        // Copy PDF page from source document
        const sourceDoc = this.sourceManager.getPdfLibDocument(pageDesc.sourceId)
        if (!sourceDoc) {
          throw new Error(
            `Missing source document for page ${i + 1} (${pageDesc.sourceName}). Source may have been removed.`
          )
        }

        const [copiedPage] = await mergedDoc.copyPages(sourceDoc, [pageDesc.sourcePageIndex])

        // Apply rotation if modified
        if (pageDesc.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle || 0
          const finalRotation = ((currentRotation + pageDesc.rotation) % 360 + 360) % 360
          copiedPage.setRotation(degrees(finalRotation))
        }

        const addedPage = mergedDoc.addPage(copiedPage)
        await this.embedSignaturesOnPage(mergedDoc, addedPage, pageDesc)
      }
    }

    // Embed Bookmarks / Outlines if requested
    if (includeBookmarks) {
      await this.buildPdfBookmarks(mergedDoc, pages, sourcesMap)
    }

    // Save to binary PDF format
    const mergedBytes = await mergedDoc.save()

    // Trigger client-side browser download
    this.triggerDownload(mergedBytes, outputFilename)

    return mergedBytes
  }

  /**
   * Exports multiple separate split PDF parts (individually or bundled in a ZIP archive).
   */
  async exportSplitPdfParts(
    parts: { name: string; pages: PageDescriptor[] }[],
    sourcesMap: Map<string, PdfSource>,
    asZip = false
  ): Promise<void> {
    if (parts.length === 0) {
      throw new Error('No split parts to export.')
    }

    const zip = asZip ? new JSZip() : null

    for (let pIdx = 0; pIdx < parts.length; pIdx++) {
      const part = parts[pIdx]
      if (part.pages.length === 0) continue

      const partDoc = await PDFDocument.create()

      for (let i = 0; i < part.pages.length; i++) {
        const pageDesc = part.pages[i]
        const source = sourcesMap.get(pageDesc.sourceId)

        if (!source) continue

        if (pageDesc.sourceType === 'image') {
          const isPng = source.imageMimeType === 'image/png' || source.name.toLowerCase().endsWith('.png')
          const embeddedImage = isPng
            ? await partDoc.embedPng(source.originalBytes)
            : await partDoc.embedJpg(source.originalBytes)

          const imgWidth = pageDesc.width
          const imgHeight = pageDesc.height

          const newPage = partDoc.addPage([imgWidth, imgHeight])
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight,
          })

          if (pageDesc.rotation !== 0) {
            newPage.setRotation(degrees((pageDesc.rotation % 360 + 360) % 360))
          }

          await this.embedSignaturesOnPage(partDoc, newPage, pageDesc)
        } else {
          const sourceDoc = this.sourceManager.getPdfLibDocument(pageDesc.sourceId)
          if (!sourceDoc) continue

          const [copiedPage] = await partDoc.copyPages(sourceDoc, [pageDesc.sourcePageIndex])

          if (pageDesc.rotation !== 0) {
            const currentRotation = copiedPage.getRotation().angle || 0
            const finalRotation = ((currentRotation + pageDesc.rotation) % 360 + 360) % 360
            copiedPage.setRotation(degrees(finalRotation))
          }

          const addedPage = partDoc.addPage(copiedPage)
          await this.embedSignaturesOnPage(partDoc, addedPage, pageDesc)
        }
      }

      const partBytes = await partDoc.save()
      const filename = part.name.endsWith('.pdf') ? part.name : `${part.name}.pdf`

      if (zip) {
        zip.file(filename, partBytes)
      } else {
        setTimeout(() => {
          this.triggerDownload(partBytes, filename)
        }, pIdx * 250)
      }
    }

    if (zip) {
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      this.triggerDownloadBlob(zipBlob, 'split_documents.zip')
    }
  }

  /**
   * Builds and attaches PDF Outlines (Bookmarks) hierarchy to a merged PDF document.
   */
  private async buildPdfBookmarks(
    mergedDoc: PDFDocument,
    pages: PageDescriptor[],
    sourcesMap: Map<string, PdfSource>
  ): Promise<void> {
    try {
      const distinctSourceIds: string[] = []
      for (const p of pages) {
        if (!distinctSourceIds.includes(p.sourceId)) {
          distinctSourceIds.push(p.sourceId)
        }
      }

      const allOutlineTrees: BookmarkItem[] = []

      for (const sourceId of distinctSourceIds) {
        const source = sourcesMap.get(sourceId)
        if (!source) continue

        const sourceBookmarks = await this.sourceManager.extractBookmarks(sourceId)

        // Find index of first page of this source in merged document
        const firstMergedPageIndex = pages.findIndex((p) => p.sourceId === sourceId)
        const sourceFirstPageIndex = pages[firstMergedPageIndex]?.sourcePageIndex ?? 0

        if (sourceBookmarks.length > 0) {
          // If source has internal bookmarks, wrap in a source container node if multiple sources
          if (distinctSourceIds.length > 1) {
            allOutlineTrees.push({
              id: `src_bm_${sourceId}`,
              title: source.name,
              sourceId,
              sourcePageIndex: sourceFirstPageIndex,
              children: sourceBookmarks,
            })
          } else {
            allOutlineTrees.push(...sourceBookmarks)
          }
        } else if (distinctSourceIds.length > 1) {
          // If no internal bookmarks, generate top-level source bookmark
          allOutlineTrees.push({
            id: `src_bm_${sourceId}`,
            title: source.name,
            sourceId,
            sourcePageIndex: sourceFirstPageIndex,
          })
        }
      }

      if (allOutlineTrees.length === 0) return

      const context = mergedDoc.context
      const rootDict = context.obj({
        Type: 'Outlines',
      })
      const rootRef = context.register(rootDict)

      const processLevel = (
        items: BookmarkItem[],
        parentRef: PDFRef
      ): { firstRef?: PDFRef; lastRef?: PDFRef; count: number } => {
        const validNodes: { item: BookmarkItem; itemRef: PDFRef; itemDict: PDFDict }[] = []

        for (const item of items) {
          let pageRef: PDFRef | undefined
          if (item.sourcePageIndex >= 0) {
            const targetIndex = pages.findIndex(
              (p) => p.sourceId === item.sourceId && p.sourcePageIndex === item.sourcePageIndex
            )
            if (targetIndex !== -1) {
              pageRef = mergedDoc.getPage(targetIndex).ref
            }
          }

          const itemDict = context.obj({
            Title: PDFHexString.fromText(item.title || 'Untitled'),
            Parent: parentRef,
          })
          const itemRef = context.register(itemDict)

          if (pageRef) {
            itemDict.set(PDFName.of('Dest'), this.createDestination(context, pageRef, item))
          }

          let childCount = 0
          if (item.children && item.children.length > 0) {
            const childResult = processLevel(item.children, itemRef)
            if (childResult.firstRef && childResult.lastRef) {
              itemDict.set(PDFName.of('First'), childResult.firstRef)
              itemDict.set(PDFName.of('Last'), childResult.lastRef)
              itemDict.set(PDFName.of('Count'), PDFNumber.of(childResult.count))
              childCount = childResult.count
            }
          }

          if (pageRef || childCount > 0) {
            validNodes.push({ item, itemRef, itemDict })
          }
        }

        if (validNodes.length === 0) {
          return { count: 0 }
        }

        // Link siblings (Prev & Next)
        for (let i = 0; i < validNodes.length; i++) {
          if (i > 0) {
            validNodes[i].itemDict.set(PDFName.of('Prev'), validNodes[i - 1].itemRef)
          }
          if (i < validNodes.length - 1) {
            validNodes[i].itemDict.set(PDFName.of('Next'), validNodes[i + 1].itemRef)
          }
        }

        const firstRef = validNodes[0].itemRef
        const lastRef = validNodes[validNodes.length - 1].itemRef

        let totalCount = validNodes.length
        for (const node of validNodes) {
          const countObj = node.itemDict.get(PDFName.of('Count'))
          if (countObj instanceof PDFNumber) {
            totalCount += countObj.asNumber()
          }
        }

        return { firstRef, lastRef, count: totalCount }
      }

      const topResult = processLevel(allOutlineTrees, rootRef)
      if (topResult.firstRef && topResult.lastRef) {
        rootDict.set(PDFName.of('First'), topResult.firstRef)
        rootDict.set(PDFName.of('Last'), topResult.lastRef)
        rootDict.set(PDFName.of('Count'), PDFNumber.of(topResult.count))
        mergedDoc.catalog.set(PDFName.of('Outlines'), rootRef)
      }
    } catch (err) {
      console.warn('Could not generate PDF bookmarks:', err)
    }
  }

  /**
   * Formats a PDF destination array for bookmark items.
   */
  private createDestination(context: any, pageRef: PDFRef, item: BookmarkItem): any {
    const fitType = (item.fitType || '/Fit').toUpperCase()
    if (fitType === '/XYZ') {
      return context.obj([
        pageRef,
        PDFName.of('XYZ'),
        item.left != null ? PDFNumber.of(item.left) : PDFNull,
        item.top != null ? PDFNumber.of(item.top) : PDFNull,
        item.zoom != null ? PDFNumber.of(item.zoom) : PDFNull,
      ])
    } else if (fitType === '/FITH') {
      return context.obj([
        pageRef,
        PDFName.of('FitH'),
        item.top != null ? PDFNumber.of(item.top) : PDFNull,
      ])
    } else if (fitType === '/FITV') {
      return context.obj([
        pageRef,
        PDFName.of('FitV'),
        item.left != null ? PDFNumber.of(item.left) : PDFNull,
      ])
    }
    return context.obj([pageRef, PDFName.of('Fit')])
  }

  /**
   * Embeds transparent signature images onto a PDF page in intrinsic coordinates.
   * Accurately accounts for placedRotation so signatures placed on rotated pages are straight,
   * while post-signing page rotations rotate the signature along with the document.
   */
  private async embedSignaturesOnPage(
    doc: PDFDocument,
    pdfPage: any,
    pageDesc: PageDescriptor
  ): Promise<void> {
    if (!pageDesc.signatures || pageDesc.signatures.length === 0) return

    const { width, height } = pdfPage.getSize()

    for (const sig of pageDesc.signatures) {
      try {
        const base64Data = sig.imageDataUrl.split(',')[1] || sig.imageDataUrl
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        const embeddedPng = await doc.embedPng(bytes)
        const intrinsic = getSignatureIntrinsicState(sig)
        const cx = (width * (intrinsic.xPercent + intrinsic.widthPercent / 2)) / 100
        const cy = (height * (1 - (intrinsic.yPercent + intrinsic.heightPercent / 2) / 100))
        const w = (width * intrinsic.widthPercent) / 100
        const h = (height * intrinsic.heightPercent) / 100
        const placedRot = sig.placedRotation ?? 0
        const pdfDeg = ((placedRot % 360) + 360) % 360

        let drawX = cx - w / 2
        let drawY = cy - h / 2

        if (pdfDeg === 90) {
          drawX = cx + h / 2
          drawY = cy - w / 2
        } else if (pdfDeg === 180) {
          drawX = cx + w / 2
          drawY = cy + h / 2
        } else if (pdfDeg === 270) {
          drawX = cx - h / 2
          drawY = cy + w / 2
        }

        pdfPage.drawImage(embeddedPng, {
          x: drawX,
          y: drawY,
          width: w,
          height: h,
          rotate: degrees(pdfDeg),
        })
      } catch (e) {
        console.error('Failed to embed signature onto page:', e)
      }
    }
  }

  /**
   * Triggers client-side browser download of raw PDF bytes.
   */
  private triggerDownload(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    this.triggerDownloadBlob(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
  }

  /**
   * Triggers client-side browser download of any Blob.
   */
  private triggerDownloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 1000)
  }
}
