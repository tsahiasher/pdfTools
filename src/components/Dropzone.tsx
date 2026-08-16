import React, { useState, useRef } from 'react'
import { UploadCloud, FilePlus2 } from 'lucide-react'

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void
  isProcessing: boolean
  compact?: boolean
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  isProcessing,
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      onFilesSelected(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      onFilesSelected(files)
      e.target.value = ''
    }
  }

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }

  if (compact) {
    return (
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`group cursor-pointer border-2 border-dashed rounded-2xl p-6 pt-6 sm:pt-7 transition-all flex flex-col items-center justify-start text-center gap-3 text-xs font-medium flex-1 w-full h-full min-h-[200px] ${
          isDragOver
            ? 'border-sky-500 bg-sky-500/10 text-sky-400 scale-[1.01] shadow-lg shadow-sky-950/40'
            : 'border-slate-800 hover:border-sky-500/60 bg-[#1e293b]/40 hover:bg-[#1e293b]/80 text-slate-400 hover:text-slate-200'
        } ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-500/20 transition-all duration-200 shadow-sm">
          <FilePlus2 className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-200 text-sm tracking-tight">Add Documents</span>
          <span className="text-[11px] text-slate-400 mt-1 leading-snug max-w-[200px]">
            Click or drop additional PDFs or images here
          </span>
        </div>
        <span className="mt-1 px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-semibold border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-colors">
          Browse Files
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group relative cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-16 flex-1 w-full h-full min-h-[480px] sm:min-h-[calc(100vh-10rem)] transition-all duration-200 text-center flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-sky-500 bg-sky-950/30 scale-[1.002] shadow-2xl shadow-sky-950/50'
          : 'border-slate-700/90 hover:border-sky-500/80 bg-[#0d1522] hover:bg-[#101b2b]'
      } ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isProcessing}
      />

      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500/20 transition-transform duration-200 shadow-lg shadow-sky-950/40">
        <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12" />
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 mb-3 tracking-tight">
        Drop PDFs or images here or choose files
      </h2>
      <p className="text-sm sm:text-base text-slate-400 max-w-xl mb-8 leading-relaxed">
        Select multiple PDF documents or images (PNG, JPG, WebP) to load, preview, organize, sign, and merge into a single document.
      </p>

      <button
        type="button"
        disabled={isProcessing}
        className="inline-flex items-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-sm font-bold shadow-xl shadow-sky-950/60 transition-all group-hover:scale-105 pointer-events-none"
      >
        Select Files
      </button>
    </div>
  )
}
