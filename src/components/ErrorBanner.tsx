import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { PdfLoadError } from '../domain/types'

interface ErrorBannerProps {
  errors: PdfLoadError[]
  onDismiss: (errorId: string) => void
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ errors, onDismiss }) => {
  if (errors.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {errors.map((error) => (
        <div
          key={error.id}
          className="flex items-start justify-between p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs shadow-md"
        >
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{error.fileName}: </span>
              <span>{error.message}</span>
            </div>
          </div>
          <button
            onClick={() => onDismiss(error.id)}
            className="p-1 rounded hover:bg-amber-900/60 text-amber-400 hover:text-amber-200 transition-colors ml-3"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
