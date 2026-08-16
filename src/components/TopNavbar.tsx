import React, { useRef } from 'react'
import {
  Layers,
  Plus,
  RotateCcw,
  Trash2,
  Image as ImageIcon,
  FileCheck2,
  Save,
  Printer,
  Scissors,
  Bookmark,
  Loader2,
} from 'lucide-react'

interface TopNavbarProps {
  pageCount: number
  selectedCount: number
  isExporting: boolean
  isProcessing: boolean
  includeBookmarks: boolean
  onToggleBookmarks: (include: boolean) => void
  onAddFiles: (files: File[]) => void
  onRevertAll: () => void
  onOpenClearModal: () => void
  onOpenSplitModal: () => void
  onExportImages: () => void
  onOpenPrintModal: () => void
  onSaveSelected: () => void
  onMergeSaveAll: () => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  pageCount,
  selectedCount,
  isExporting,
  isProcessing,
  includeBookmarks,
  onToggleBookmarks,
  onAddFiles,
  onRevertAll,
  onOpenClearModal,
  onOpenSplitModal,
  onExportImages,
  onOpenPrintModal,
  onSaveSelected,
  onMergeSaveAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-[#0f172a] border-b border-slate-800 text-white shadow-md">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing || isExporting}
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title: pdfTools */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight whitespace-nowrap">
            pdfTools
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 py-1">
          {/* Add Files */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isExporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Files</span>
          </button>

          {/* Revert All */}
          <button
            onClick={onRevertAll}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 shrink-0"
            title="Revert all changes to original uploaded files"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revert All</span>
          </button>

          {/* Clear All */}
          <button
            onClick={onOpenClearModal}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-40 shrink-0"
            title="Clear all documents"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          {/* Split PDF */}
          <button
            onClick={onOpenSplitModal}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 shrink-0"
            title="Open Split PDF Document tool"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-400" />
            <span>Split PDF</span>
          </button>

          {/* Print */}
          <button
            onClick={onOpenPrintModal}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 shrink-0"
            title="Open Print Preview and Settings"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print</span>
          </button>

          {/* Export Images Button */}
          <button
            onClick={onExportImages}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 shrink-0"
            title="Export pages as image files"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Export Images</span>
          </button>

          {/* Save Selected */}
          <button
            onClick={onSaveSelected}
            disabled={isProcessing || isExporting || selectedCount === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-30 shrink-0"
            title="Save selected pages as a merged PDF"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Save Selected ({selectedCount})</span>
          </button>

          {/* Bookmarks Checkbox near Merge & Save All button */}
          <label
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium select-none transition-colors shrink-0 ${
              pageCount === 0 || isProcessing || isExporting
                ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500'
                : 'cursor-pointer border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title="Preserve and generate PDF Bookmarks / Outlines in merged output"
          >
            <input
              type="checkbox"
              checked={includeBookmarks}
              onChange={(e) => onToggleBookmarks(e.target.checked)}
              disabled={isProcessing || isExporting || pageCount === 0}
              className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-600 text-[#0284c7] focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed accent-[#0284c7]"
            />
            <Bookmark
              className={`w-3.5 h-3.5 ${
                pageCount === 0
                  ? 'text-slate-500'
                  : includeBookmarks
                  ? 'text-sky-400 fill-sky-400'
                  : 'text-slate-400'
              }`}
            />
            <span>Bookmarks</span>
          </label>

          {/* Merge & Save All (Green Button) */}
          <button
            onClick={onMergeSaveAll}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-900/30 transition-colors disabled:opacity-40 shrink-0"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Merge & Save All</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
