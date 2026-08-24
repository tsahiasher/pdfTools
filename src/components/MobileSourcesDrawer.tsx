import React, { useRef } from 'react'
import { X, ChevronUp, ChevronDown, Plus, FileText, Trash2 } from 'lucide-react'
import type { PdfSource } from '../domain/types'

interface MobileSourcesDrawerProps {
  isOpen: boolean
  onClose: () => void
  sources: PdfSource[]
  onRemoveSource: (sourceId: string) => void
  onMoveSource: (sourceId: string, direction: 'up' | 'down') => void
  onAddFiles: (files: File[]) => void
  isProcessing: boolean
  isExporting: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const MobileSourcesDrawer: React.FC<MobileSourcesDrawerProps> = ({
  isOpen,
  onClose,
  sources,
  onRemoveSource,
  onMoveSource,
  onAddFiles,
  isProcessing,
  isExporting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative z-10 bg-[#0f172a] border-t border-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Top Handle / Grab Bar */}
        <div className="w-full flex justify-center py-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 pb-3 pt-1 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100">Loaded PDF Documents</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 text-xs font-semibold">
              {sources.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close files drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing || isExporting}
        />

        {/* Sources List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[60vh]">
          {sources.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No files uploaded yet. Tapping "Add Files" below to load documents.
            </div>
          ) : (
            sources.map((source, index) => (
              <div
                key={source.id}
                className="bg-[#1e293b] border rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                style={{ borderColor: source.color }}
              >
                {/* File Number Badge */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: source.color }}
                >
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate" title={source.name}>
                    {source.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {source.pageCount} {source.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(source.size)}
                  </div>
                </div>

                {/* Controls: Up, Down, Remove */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => onMoveSource(source.id, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onMoveSource(source.id, 'down')}
                    disabled={index === sources.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveSource(source.id)}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1324] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isExporting}
            className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add More Files</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
