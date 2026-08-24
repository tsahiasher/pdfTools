import React, { useState, useEffect } from 'react'
import { Image as ImageIcon, X, Download, FileCheck } from 'lucide-react'

interface ExportImagesModalProps {
  isOpen: boolean
  pageCount: number
  selectedCount: number
  isExporting: boolean
  onClose: () => void
  onExport: (format: 'png' | 'jpeg', target: 'selected' | 'all', baseFilename: string) => void
}

export const ExportImagesModal: React.FC<ExportImagesModalProps> = ({
  isOpen,
  pageCount,
  selectedCount,
  isExporting,
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [baseFilename, setBaseFilename] = useState<string>('ExportedPage')
  const [target, setTarget] = useState<'selected' | 'all'>('selected')

  useEffect(() => {
    if (isOpen) {
      setTarget(selectedCount > 0 ? 'selected' : 'all')
      setBaseFilename('ExportedPage')
    }
  }, [isOpen, selectedCount])

  if (!isOpen) return null

  const effectivePageCount = target === 'selected' && selectedCount > 0 ? selectedCount : pageCount
  const ext = format === 'png' ? 'png' : 'jpg'
  const cleanName = baseFilename.trim().replace(/\.(png|jpe?g|webp|pdf)$/i, '') || 'ExportedPage'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#131d2a] border border-slate-700 rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Export Images</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Download {effectivePageCount} {effectivePageCount === 1 ? 'image' : 'images'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* File Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">File Name:</label>
            <input
              type="text"
              value={baseFilename}
              onChange={(e) => setBaseFilename(e.target.value)}
              placeholder="ExportedPage"
              className="w-full bg-[#0c131c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Save as type / Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  format === 'png'
                    ? 'border-sky-500 bg-sky-950/40 text-white ring-1 ring-sky-500'
                    : 'border-slate-800 bg-[#0c131c] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">PNG (*.png)</span>
                  {format === 'png' && <FileCheck className="w-4 h-4 text-sky-400" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1">Lossless high-quality</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  format === 'jpeg'
                    ? 'border-sky-500 bg-sky-950/40 text-white ring-1 ring-sky-500'
                    : 'border-slate-800 bg-[#0c131c] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">JPG (*.jpg)</span>
                  {format === 'jpeg' && <FileCheck className="w-4 h-4 text-sky-400" />}
                </div>
                <span className="text-[11px] text-slate-400 mt-1">Smaller file size</span>
              </button>
            </div>
          </div>

          {/* Pages Scope */}
          {selectedCount > 0 && selectedCount < pageCount && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Pages to Export</label>
              <div className="space-y-2 text-xs text-slate-300">
                <label className="flex items-center space-x-2.5 p-2 rounded-xl border border-slate-800 bg-[#0c131c] cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="pageScope"
                    checked={target === 'selected'}
                    onChange={() => setTarget('selected')}
                    className="text-sky-500 focus:ring-0"
                  />
                  <span className="font-medium">Selected Pages Only ({selectedCount} pages)</span>
                </label>

                <label className="flex items-center space-x-2.5 p-2 rounded-xl border border-slate-800 bg-[#0c131c] cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="pageScope"
                    checked={target === 'all'}
                    onChange={() => setTarget('all')}
                    className="text-sky-500 focus:ring-0"
                  />
                  <span className="font-medium">All Pages ({pageCount} pages)</span>
                </label>
              </div>
            </div>
          )}

          {/* Output Filenames Preview */}
          <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="font-semibold text-slate-300 mb-1">Generated file names:</div>
            {effectivePageCount === 1 ? (
              <span className="text-sky-400 font-mono">{cleanName}.{ext}</span>
            ) : (
              <span className="text-sky-400 font-mono">
                {cleanName}_1.{ext}, {cleanName}_2.{ext}
                {effectivePageCount > 2 ? `, ... ${cleanName}_${effectivePageCount}.${ext}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-end space-x-2.5 p-4 sm:p-5 border-t border-slate-800/80 bg-[#0b1324] shrink-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(format, target, cleanName)}
            disabled={isExporting || effectivePageCount === 0}
            className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-md shadow-sky-950/40 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Download ({effectivePageCount} {effectivePageCount === 1 ? 'Image' : 'Images'})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
