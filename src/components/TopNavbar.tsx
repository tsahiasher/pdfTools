import React, { useRef, useState } from 'react'
import {
  Layers,
  Plus,
  Undo2,
  Trash2,
  Image as ImageIcon,
  FileCheck2,
  Save,
  Printer,
  Scissors,
  Bookmark,
  Loader2,
  Folder,
  MoreVertical,
  X,
} from 'lucide-react'

interface TopNavbarProps {
  pageCount: number
  selectedCount: number
  sourceCount: number
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
  onOpenMobileSources?: () => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  pageCount,
  selectedCount,
  sourceCount,
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
  onOpenMobileSources,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Title: pdfTools */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight whitespace-nowrap">
            pdfTools
          </h1>
        </div>

        {/* DESKTOP Action Controls (hidden on mobile, visible lg and up) */}
        <div className="hidden lg:flex items-center space-x-2 sm:space-x-2.5 py-1">
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
            <Undo2 className="w-3.5 h-3.5 text-amber-400/90" />
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
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium select-none transition-colors shrink-0 cursor-default ${
              pageCount === 0 || isProcessing || isExporting
                ? 'opacity-40 border-slate-800 bg-slate-900/40 text-slate-500'
                : 'border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white'
            }`}
            title="Preserve and generate PDF Bookmarks / Outlines in merged output"
          >
            <input
              type="checkbox"
              checked={includeBookmarks}
              onChange={(e) => onToggleBookmarks(e.target.checked)}
              disabled={isProcessing || isExporting || pageCount === 0}
              className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-600 text-[#0284c7] focus:ring-0 focus:ring-offset-0 cursor-default accent-[#0284c7]"
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

        {/* MOBILE Action Bar (visible on < lg) */}
        <div className="flex lg:hidden items-center space-x-1.5">
          {/* Files Drawer Trigger */}
          <button
            onClick={onOpenMobileSources}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            title="View loaded PDF files"
          >
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Files</span>
            {sourceCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-semibold">
                {sourceCount}
              </span>
            )}
          </button>

          {/* Add Files */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isExporting}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
            title="Add Files"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Merge & Save */}
          <button
            onClick={onMergeSaveAll}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-md transition-colors disabled:opacity-40"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Merge</span>
          </button>

          {/* More Tools Dropdown Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="More Options"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Tools Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0b1324] px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Document Tools
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Save Selected */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                onSaveSelected()
              }}
              disabled={isProcessing || isExporting || selectedCount === 0}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">Save Selected ({selectedCount})</span>
            </button>

            {/* Split PDF */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                onOpenSplitModal()
              }}
              disabled={isProcessing || isExporting || pageCount === 0}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
            >
              <Scissors className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Split PDF</span>
            </button>

            {/* Export Images */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                onExportImages()
              }}
              disabled={isProcessing || isExporting || pageCount === 0}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Export Images</span>
            </button>

            {/* Print */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                onOpenPrintModal()
              }}
              disabled={isProcessing || isExporting || pageCount === 0}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Print PDF</span>
            </button>

            {/* Bookmarks Toggle */}
            <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBookmarks}
                onChange={(e) => onToggleBookmarks(e.target.checked)}
                disabled={isProcessing || isExporting || pageCount === 0}
                className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-600 text-[#0284c7] accent-[#0284c7]"
              />
              <Bookmark className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Bookmarks</span>
            </label>

            {/* Revert All */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                onRevertAll()
              }}
              disabled={isProcessing || isExporting || pageCount === 0}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
            >
              <Undo2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Revert All</span>
            </button>
          </div>

          {/* Clear All Button Full Width */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              onOpenClearModal()
            }}
            disabled={isProcessing || isExporting || pageCount === 0}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-semibold transition-colors disabled:opacity-40 mt-1"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Clear All Documents</span>
          </button>
        </div>
      )}
    </header>
  )
}

