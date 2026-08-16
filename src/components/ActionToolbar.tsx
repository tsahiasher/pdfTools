import React, { useRef } from 'react'
import {
  Download,
  Plus,
  Trash2,
  Loader2,
  FileCheck2,
  RotateCcw,
  RotateCw,
  CheckSquare,
  X,
} from 'lucide-react'

interface ActionToolbarProps {
  pageCount: number
  sourceCount: number
  selectedCount: number
  isExporting: boolean
  isProcessing: boolean
  onAddFiles: (files: File[]) => void
  onExport: () => void
  onClearAll: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onRotateSelected: (deltaDegrees: number) => void
  onDeleteSelected: () => void
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  pageCount,
  sourceCount,
  selectedCount,
  isExporting,
  isProcessing,
  onAddFiles,
  onExport,
  onClearAll,
  onSelectAll,
  onClearSelection,
  onRotateSelected,
  onDeleteSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  // When pages are selected, show selection batch actions
  if (selectedCount > 0) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 animate-in fade-in duration-200">
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
            <span className="text-sm font-medium">
              {selectedCount === 1 ? 'page' : 'pages'} selected
            </span>
          </div>

          <button
            onClick={onClearSelection}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 p-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Deselect</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-2">
          <button
            onClick={onSelectAll}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Select All ({pageCount})</span>
          </button>

          <button
            onClick={() => onRotateSelected(-90)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            title="Rotate selected left"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rotate Left</span>
          </button>

          <button
            onClick={() => onRotateSelected(90)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            title="Rotate selected right"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate Right</span>
          </button>

          <button
            onClick={onDeleteSelected}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
            title="Delete selected pages"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete ({selectedCount})</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-lg shadow-slate-900/5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing || isExporting}
      />

      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
          <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong className="text-slate-900">{pageCount}</strong> {pageCount === 1 ? 'page' : 'pages'} ready to merge
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-xs text-slate-500">
            {sourceCount} {sourceCount === 1 ? 'file' : 'files'}
          </span>
        </div>

        <button
          onClick={onClearAll}
          disabled={isProcessing || isExporting}
          className="sm:hidden text-xs text-slate-500 hover:text-red-600 p-1.5 rounded transition-colors"
          title="Clear all files"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
        <button
          onClick={onSelectAll}
          disabled={isProcessing || isExporting || pageCount === 0}
          className="hidden md:inline-flex items-center space-x-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
          <span>Select All</span>
        </button>

        <button
          onClick={onClearAll}
          disabled={isProcessing || isExporting}
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Start Over</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isExporting}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Files</span>
        </button>

        <button
          onClick={onExport}
          disabled={isProcessing || isExporting || pageCount === 0}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 disabled:shadow-none hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.99]"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Merging PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Merge & Download PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
