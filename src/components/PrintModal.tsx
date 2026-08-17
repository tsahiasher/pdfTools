import React, { useState, useMemo } from 'react'
import {
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Minus,
  Square,
} from 'lucide-react'
import { useThumbnail } from '../hooks/useThumbnail'
import { globalCoordinator } from '../coordinator/PdfCoordinator'
import type { PageDescriptor } from '../domain/types'

interface PrintModalProps {
  isOpen: boolean
  pages: PageDescriptor[]
  selectedPageIds: Set<string>
  onClose: () => void
}

const PrintPreviewViewer: React.FC<{
  page: PageDescriptor
  pageNumber: number
}> = ({ page, pageNumber }) => {
  const { dataUrl, isLoading, error } = useThumbnail({
    sourceId: page.sourceId,
    pageIndex: page.sourcePageIndex,
    maxWidth: 800,
    lazy: false,
    imagePreviewUrl: page.imagePreviewUrl,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        <span className="text-xs">Rendering page {pageNumber}...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-amber-400 p-6 text-center py-20">
        <AlertCircle className="w-6 h-6 mb-2" />
        <span className="text-xs">{error}</span>
      </div>
    )
  }

  if (dataUrl) {
    return (
      <div className="max-h-full flex items-center justify-center p-2">
        <img
          src={dataUrl}
          alt={`Preview Page ${pageNumber}`}
          style={{
            transform: `rotate(${page.rotation}deg)`,
          }}
          className="max-h-[60vh] w-auto max-w-full object-contain rounded bg-white shadow-2xl border border-slate-300 transition-all duration-200"
        />
      </div>
    )
  }

  return null
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  pages,
  selectedPageIds,
  onClose,
}) => {
  const [pageScope, setPageScope] = useState<'all' | 'selected' | 'custom'>(
    selectedPageIds.size > 0 ? 'selected' : 'all'
  )
  const [customRange, setCustomRange] = useState<string>('')
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0)
  const [isPrinting, setIsPrinting] = useState<boolean>(false)

  // When dialog opens or selected pages change, initialize pageScope to 'selected' if selection exists, else 'all'
  React.useEffect(() => {
    if (isOpen) {
      if (selectedPageIds.size > 0) {
        setPageScope('selected')
      } else {
        setPageScope('all')
      }
      setCurrentPreviewIndex(0)
    }
  }, [isOpen, selectedPageIds])

  // Determine pages to print based on scope
  const targetPages = useMemo(() => {
    if (pageScope === 'selected' && selectedPageIds.size > 0) {
      return pages.filter((p) => selectedPageIds.has(p.id))
    }
    if (pageScope === 'custom' && customRange.trim()) {
      const parsedIndices = new Set<number>()
      const parts = customRange.split(',')
      for (const part of parts) {
        const trimmed = part.trim()
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-')
          const start = parseInt(startStr, 10)
          const end = parseInt(endStr, 10)
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              if (i >= 1 && i <= pages.length) parsedIndices.add(i - 1)
            }
          }
        } else {
          const num = parseInt(trimmed, 10)
          if (!isNaN(num) && num >= 1 && num <= pages.length) {
            parsedIndices.add(num - 1)
          }
        }
      }
      const list = Array.from(parsedIndices)
        .sort((a, b) => a - b)
        .map((idx) => pages[idx])
      return list.length > 0 ? list : pages
    }
    return pages
  }, [pages, pageScope, selectedPageIds, customRange])

  const safeIndex = Math.min(currentPreviewIndex, Math.max(0, targetPages.length - 1))
  const currentPage = targetPages[safeIndex]

  if (!isOpen || pages.length === 0) return null

  const handlePrint = () => {
    setIsPrinting(true)

    // Create an invisible iframe for native browser printing
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'fixed'
    printFrame.style.top = '-9999px'
    printFrame.style.left = '-9999px'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    document.body.appendChild(printFrame)

    const frameDoc = printFrame.contentWindow?.document
    if (!frameDoc) {
      setIsPrinting(false)
      return
    }

    // Build print HTML containing only the target pages
    frameDoc.open()
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Document</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .page-container {
              page-break-after: always;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div id="print-content">Loading pages for print...</div>
        </body>
      </html>
    `)
    frameDoc.close()

    // Render print images
    setTimeout(async () => {
      try {
        const container = frameDoc.getElementById('print-content')
        if (container) {
          container.innerHTML = ''
          for (const page of targetPages) {
            const pageDiv = frameDoc.createElement('div')
            pageDiv.className = 'page-container'
            const img = frameDoc.createElement('img')
            img.style.transform = `rotate(${page.rotation}deg)`

            if (page.sourceType === 'image' && page.imagePreviewUrl) {
              img.src = page.imagePreviewUrl
            } else {
              const cached = await globalCoordinator.getThumbnail(
                page.sourceId,
                page.sourcePageIndex,
                1200
              )
              img.src = cached
            }

            pageDiv.appendChild(img)
            container.appendChild(pageDiv)
          }
        }

        setTimeout(() => {
          setIsPrinting(false)
          printFrame.contentWindow?.focus()
          printFrame.contentWindow?.print()

          setTimeout(() => {
            document.body.removeChild(printFrame)
          }, 2000)
        }, 300)
      } catch {
        setIsPrinting(false)
      }
    }, 200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Window Title Bar */}
        <div className="px-4 py-2.5 bg-[#0b1120] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-200">Print Preview & Settings</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <button className="p-1 hover:text-white transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <button className="p-1 hover:text-white transition-colors">
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-red-400 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2-Column Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Settings Panel */}
          <div className="w-full md:w-80 lg:w-96 bg-[#131d2a] border-r border-slate-800 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Header Title */}
              <div>
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  <h2 className="text-sm font-bold text-slate-100">Pages to Print</h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select which pages to include in the print job.
                </p>
              </div>

              {/* Pages to Print */}
              <div className="space-y-2">
                <div className="space-y-2 text-xs text-slate-300">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="printPagesScope"
                      checked={pageScope === 'all'}
                      onChange={() => setPageScope('all')}
                      className="text-sky-500 focus:ring-0"
                    />
                    <span>All Pages ({pages.length})</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="printPagesScope"
                      checked={pageScope === 'selected'}
                      onChange={() => setPageScope('selected')}
                      className="text-sky-500 focus:ring-0"
                    />
                    <span>Selected Pages Only ({selectedPageIds.size})</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="printPagesScope"
                        checked={pageScope === 'custom'}
                        onChange={() => setPageScope('custom')}
                        className="text-sky-500 focus:ring-0"
                      />
                      <span>Custom Range</span>
                    </label>

                    {pageScope === 'custom' && (
                      <div className="pl-6">
                        <input
                          type="text"
                          placeholder="e.g. 1-3, 5, 8-10"
                          value={customRange}
                          onChange={(e) => setCustomRange(e.target.value)}
                          className="w-full bg-[#0c131c] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                          autoFocus
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Specify page numbers and/or ranges separated by commas.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800/80 mt-2">
              <p className="text-[11px] text-slate-400 leading-tight">
                Clicking print opens your browser & OS dialog where you can pick any installed printer, network printer, or Save as PDF.
              </p>

              <button
                onClick={handlePrint}
                disabled={isPrinting || targetPages.length === 0}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Print...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Print Document</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Column: Preview Area */}
          <div className="flex-1 bg-[#0c131c] flex flex-col overflow-hidden">
            {/* Preview Sub-bar */}
            <div className="px-6 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#0f172a]">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-200">Print Preview</span>
                {selectedPageIds.size > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1e293b] border border-slate-700 text-sky-400 text-[11px] font-semibold">
                    {selectedPageIds.size} Pages Selected
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <button
                  onClick={() => setCurrentPreviewIndex(Math.max(0, safeIndex - 1))}
                  disabled={safeIndex === 0}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="font-semibold text-slate-200">
                  Page {targetPages.length > 0 ? safeIndex + 1 : 0} of {targetPages.length}
                </span>

                <button
                  onClick={() =>
                    setCurrentPreviewIndex(Math.min(targetPages.length - 1, safeIndex + 1))
                  }
                  disabled={safeIndex >= targetPages.length - 1}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-30"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preview Page Canvas Display */}
            <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
              {targetPages.length === 0 || !currentPage ? (
                <div className="text-slate-500 text-xs">No pages match the print selection.</div>
              ) : (
                <PrintPreviewViewer
                  key={currentPage.id}
                  page={currentPage}
                  pageNumber={safeIndex + 1}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
