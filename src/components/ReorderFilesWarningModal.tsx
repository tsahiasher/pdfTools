import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ReorderFilesWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const ReorderFilesWarningModal: React.FC<ReorderFilesWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">
              Reset Page Order?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-sm text-slate-300 space-y-3">
          <p>
            Reordering the source files will rearrange all pages to follow the new file sequence and will <span className="text-amber-400 font-semibold">reset any custom page ordering</span> you have made.
          </p>
          <p className="text-xs text-slate-400">
            Do you want to proceed with reordering the files?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#131d2a] border-t border-slate-800 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors shadow-sm"
          >
            Reset & Reorder
          </button>
        </div>
      </div>
    </div>
  )
}
