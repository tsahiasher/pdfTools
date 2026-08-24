import React from 'react'
import { CheckSquare, X, RotateCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react'

interface MobileBottomBarProps {
  pageCount: number
  selectedCount: number
  zoomLevel: number
  onZoomChange: (level: number) => void
  onSelectAll: () => void
  onDeselect: () => void
  onRotateCW: () => void
  onDeleteSelected: () => void
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  pageCount,
  selectedCount,
  zoomLevel,
  onZoomChange,
  onSelectAll,
  onDeselect,
  onRotateCW,
  onDeleteSelected,
}) => {
  if (pageCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 shadow-2xl safe-area-pb">
      <div className="flex items-center justify-between max-w-md mx-auto gap-1 text-xs">
        {/* Select All / Deselect Toggle */}
        {selectedCount > 0 ? (
          <button
            onClick={onDeselect}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Clear ({selectedCount})</span>
          </button>
        ) : (
          <button
            onClick={onSelectAll}
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-sky-400 mb-0.5" />
            <span className="text-[10px] font-medium leading-none">Select All</span>
          </button>
        )}

        {/* Rotate CW */}
        <button
          onClick={onRotateCW}
          disabled={pageCount === 0}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors disabled:opacity-40"
        >
          <RotateCw className="w-4 h-4 text-sky-400 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Rotate CW</span>
        </button>

        {/* Delete Selected */}
        <button
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 rounded-xl transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-4 h-4 text-red-400 mb-0.5" />
          <span className="text-[10px] font-medium leading-none">Delete ({selectedCount})</span>
        </button>

        {/* Zoom Controls */}
        <div className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800/80 rounded-xl border border-slate-700">
          <button
            onClick={() => onZoomChange(Math.max(1, zoomLevel - 1))}
            disabled={zoomLevel <= 1}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-semibold text-sky-400 px-1 select-none">
            {zoomLevel}x
          </span>
          <button
            onClick={() => onZoomChange(Math.min(5, zoomLevel + 1))}
            disabled={zoomLevel >= 5}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
