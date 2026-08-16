import React from 'react'
import { FileText, Image as ImageIcon, X, ChevronLeft, ChevronRight, Files } from 'lucide-react'
import type { PdfSource } from '../domain/types'

interface SourceListProps {
  sources: PdfSource[]
  onRemoveSource: (sourceId: string) => void
  onMoveSource: (sourceId: string, direction: 'left' | 'right') => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const SourceList: React.FC<SourceListProps> = ({
  sources,
  onRemoveSource,
  onMoveSource,
}) => {
  if (sources.length === 0) return null

  const totalPages = sources.reduce((acc, src) => acc + src.pageCount, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Files className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            Loaded Files ({sources.length})
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Total: <span className="text-slate-900 font-bold">{totalPages} pages</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {sources.map((source, idx) => (
          <div
            key={source.id}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg pl-2.5 pr-2 py-1.5 transition-colors text-xs text-slate-700 shadow-sm group"
          >
            {/* Reorder Left / Right buttons */}
            <div className="flex items-center -space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onMoveSource(source.id, 'left')}
                disabled={idx === 0}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 disabled:hover:bg-transparent"
                title="Move file left"
                aria-label="Move file left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveSource(source.id, 'right')}
                disabled={idx === sources.length - 1}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-20 disabled:hover:bg-transparent"
                title="Move file right"
                aria-label="Move file right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Color marker */}
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: source.color }}
              title="Color tag for this file"
            />

            {source.type === 'image' ? (
              <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}

            <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[240px]">
              <span className="font-medium truncate text-slate-800" title={source.name}>
                {source.name}
              </span>
              <span className="text-[10px] text-slate-500">
                {source.pageCount} {source.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(source.size)}
              </span>
            </div>

            <button
              onClick={() => onRemoveSource(source.id)}
              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-600 transition-colors ml-1"
              title={`Remove ${source.name}`}
              aria-label={`Remove ${source.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
