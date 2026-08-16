import React, { useState, useEffect, useRef } from 'react'
import { UploadCloud } from 'lucide-react'

interface DragOverlayProps {
  onFilesSelected: (files: File[]) => void
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    const isFileDrag = (e: DragEvent): boolean => {
      if (!e.dataTransfer) return false
      return Array.from(e.dataTransfer.types).includes('Files')
    }

    const handleDragEnter = (e: DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current += 1
      if (dragCounter.current === 1) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) {
        setIsDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragging(false)

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files)
        onFilesSelected(files)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [onFilesSelected])

  if (!isDragging) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md transition-all duration-200 pointer-events-none select-none">
      <div className="border-2 border-dashed border-sky-400/90 bg-[#0f172a]/95 rounded-3xl p-10 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl shadow-sky-950/70 max-w-sm mx-4 transform scale-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 shadow-md">
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
          Drop to add PDFs or images
        </p>
      </div>
    </div>
  )
}
