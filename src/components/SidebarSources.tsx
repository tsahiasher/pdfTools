import React from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import type { PdfSource } from '../domain/types'

interface SidebarSourcesProps {
  sources: PdfSource[]
  onRemoveSource: (sourceId: string) => void
  onMoveSource: (sourceId: string, direction: 'up' | 'down') => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const SidebarSources: React.FC<SidebarSourcesProps> = ({
  sources,
  onRemoveSource,
  onMoveSource,
}) => {
  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 bg-[#0f172a] lg:border-r border-slate-800 p-4 flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-slate-200 tracking-wide">
          PDF Source Files
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {sources.length} {sources.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {sources.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs shrink-0">
          No files loaded yet. Click "Add Files" to begin.
        </div>
      ) : (
        <div className="flex flex-col space-y-2.5 overflow-y-auto flex-1 pr-1">
          {sources.map((source, index) => (
            <div
              key={source.id}
              className="bg-[#1e293b]/90 border rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-sm transition-colors"
              style={{ borderColor: source.color }}
            >
              {/* Numbered circular badge */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                style={{ backgroundColor: source.color }}
              >
                {index + 1}
              </div>

              {/* Source Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate" title={source.name}>
                  {source.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {source.pageCount} {source.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(source.size)}
                </div>
              </div>

              {/* Action Buttons: Up, Down, Remove */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => onMoveSource(source.id, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  title="Move file up"
                  aria-label="Move file up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onMoveSource(source.id, 'down')}
                  disabled={index === sources.length - 1}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  title="Move file down"
                  aria-label="Move file down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="p-1 rounded bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition-colors ml-0.5"
                  title={`Remove ${source.name}`}
                  aria-label={`Remove ${source.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
