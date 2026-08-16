import React from 'react'
import {
  ZoomIn,
  ZoomOut,
  CheckSquare,
  X,
  RotateCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'

interface GridSubHeaderProps {
  pageCount: number
  selectedCount: number
  zoomLevel: number // 1 to 5 (or cols 2 to 6)
  onZoomChange: (level: number) => void
  onSelectAll: () => void
  onDeselect: () => void
  onRotateCW: () => void
  onRotateCCW: () => void
  onDeleteSelected: () => void
}

export const GridSubHeader: React.FC<GridSubHeaderProps> = ({
  pageCount,
  selectedCount,
  zoomLevel,
  onZoomChange,
  onSelectAll,
  onDeselect,
  onRotateCW,
  onRotateCCW,
  onDeleteSelected,
}) => {
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
      {/* Left: Counter Badge */}
      <div className="flex items-center space-x-2">
        <span className="px-3 py-1 rounded-full bg-[#1e293b] border border-slate-700 text-sky-400 font-semibold">
          {pageCount} Pages{' '}
          <span className="text-slate-400 font-normal">
            ({selectedCount} selected)
          </span>
        </span>
      </div>

      {/* Center: Zoom Slider */}
      <div className="flex items-center space-x-2 bg-[#1e293b]/60 px-3 py-1 rounded-full border border-slate-700/60">
        <button
          onClick={() => onZoomChange(Math.max(1, zoomLevel - 1))}
          className="text-slate-400 hover:text-sky-400 transition-colors p-0.5"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={zoomLevel}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />

        <button
          onClick={() => onZoomChange(Math.min(5, zoomLevel + 1))}
          className="text-slate-400 hover:text-sky-400 transition-colors p-0.5"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Quick Selection & Rotation Actions */}
      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
        <button
          onClick={onSelectAll}
          disabled={pageCount === 0}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
        >
          <CheckSquare className="w-3 h-3 text-sky-400" />
          <span>Select All</span>
        </button>

        <button
          onClick={onDeselect}
          disabled={selectedCount === 0}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
        >
          <X className="w-3 h-3 text-slate-400" />
          <span>Deselect</span>
        </button>

        <button
          onClick={onRotateCW}
          disabled={pageCount === 0}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="w-3 h-3 text-sky-400" />
          <span>Rotate CW</span>
        </button>

        <button
          onClick={onRotateCCW}
          disabled={pageCount === 0}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1e293b] hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
          title="Rotate 90° Counter-Clockwise"
        >
          <RotateCcw className="w-3 h-3 text-sky-400" />
          <span>Rotate CCW</span>
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white rounded-lg transition-colors disabled:opacity-30"
          title="Delete selected pages"
        >
          <Trash2 className="w-3 h-3" />
          <span>Delete Selected</span>
        </button>
      </div>
    </div>
  )
}
