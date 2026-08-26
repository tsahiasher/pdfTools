import React from 'react'
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Trash2,
  Check,
  PenTool,
  GripVertical,
} from 'lucide-react'
import { useThumbnail } from '../hooks/useThumbnail'
import { getSignatureIntrinsicState } from '../lib/signatureUtils'
import type { PageDescriptor, PdfSource } from '../domain/types'

interface PageCardProps {
  page: PageDescriptor
  sequenceIndex: number // 1-based index in the overall merged document
  source?: PdfSource
  isSelected: boolean
  isDragging?: boolean
  zoomLevel?: number
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  onSelect: (e: React.MouseEvent) => void
  onRotateLeft: (e: React.MouseEvent) => void
  onRotateRight: (e: React.MouseEvent) => void
  onSign: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  sequenceIndex,
  source,
  isSelected,
  isDragging = false,
  zoomLevel = 3,
  onPointerDown,
  onSelect,
  onRotateLeft,
  onRotateRight,
  onSign,
  onDelete,
}) => {
  // Compute thumbnail quality / resolution based on zoomLevel (1..5)
  const thumbnailMaxWidth = React.useMemo(() => {
    switch (zoomLevel) {
      case 1:
        return 200
      case 2:
        return 280
      case 3:
        return 380
      case 4:
        return 500
      case 5:
        return 700
      default:
        return 380
    }
  }, [zoomLevel])

  const { dataUrl, isLoading, error, elementRef } = useThumbnail({
    sourceId: page.sourceId,
    pageIndex: page.sourcePageIndex,
    maxWidth: thumbnailMaxWidth,
    lazy: true,
    imagePreviewUrl: page.imagePreviewUrl,
    page,
    revision: `${page.drawingDataUrl ? 1 : 0}_${page.formValues ? JSON.stringify(page.formValues) : ''}_${page.signatures?.length || 0}_${page.rotation}`,
  })

  return (
    <div
      ref={elementRef}
      onClick={onSelect}
      onPointerDown={(e) => {
        // Desktop (mouse): allow clicking and dragging anywhere on the card
        if (e.pointerType === 'mouse') {
          const target = e.target as HTMLElement
          if (
            !target.closest('button') &&
            !target.closest('input') &&
            !target.closest('[role="button"]')
          ) {
            onPointerDown?.(e)
          }
        }
      }}
      style={{ borderColor: source?.color || '#0284c7' }}
      className={`group relative flex flex-col bg-[#131d2a] rounded-xl transition-all duration-150 overflow-hidden select-none h-full touch-pan-y cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-0 pointer-events-none'
          : isSelected
          ? 'border-2 ring-1 ring-white/20 shadow-lg shadow-sky-950/40'
          : 'border border-slate-700/80 hover:border-slate-500 hover:shadow-md'
      }`}
    >
      {/* Top Header: Checkbox | Orig. X | Filename | Drag Handle */}
      <div
        className={`px-2.5 py-1.5 flex items-center space-x-1.5 min-w-0 transition-colors cursor-pointer ${
          isSelected
            ? 'bg-[#0284c7] border-b border-[#0369a1] text-white'
            : 'bg-[#131d2a] border-b border-slate-800/80'
        }`}
      >
        {/* Checkbox */}
        <div
          className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors shrink-0 ${
            isSelected
              ? 'bg-white text-[#0284c7]'
              : 'border border-slate-600 bg-slate-900 group-hover:border-sky-400'
          }`}
          title={isSelected ? 'Deselect page' : 'Select page'}
        >
          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </div>

        {/* Orig. X tag */}
        <span
          className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold shrink-0 shadow-sm ${
            isSelected ? 'border border-white/25' : ''
          }`}
          style={{ backgroundColor: source?.color || '#0284c7' }}
        >
          Orig. {page.sourcePageIndex + 1}
        </span>

        {/* Filename */}
        <span
          className={`text-xs truncate flex-1 min-w-0 ${
            isSelected ? 'text-white font-semibold' : 'text-slate-300 font-medium'
          }`}
          title={page.sourceName}
        >
          {page.sourceName}
        </span>

        {/* Dedicated Drag Handle Icon for Touch & Desktop Dragging */}
        <div
          onPointerDown={(e) => {
            e.stopPropagation()
            onPointerDown?.(e)
          }}
          className="touch-none p-1 -mr-1 rounded hover:bg-black/20 cursor-grab active:cursor-grabbing text-slate-400 hover:text-white shrink-0"
          title="Drag to reorder page"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Center White Paper Preview Area */}
      <div
        className={`relative flex-1 bg-[#0c131c] p-2.5 sm:p-3 flex items-center justify-center overflow-hidden ${
          zoomLevel === 1
            ? 'min-h-[140px] max-h-[180px]'
            : zoomLevel === 2
            ? 'min-h-[180px] max-h-[230px]'
            : zoomLevel === 3
            ? 'min-h-[240px] max-h-[300px]'
            : zoomLevel === 4
            ? 'min-h-[320px] max-h-[400px]'
            : 'min-h-[420px] max-h-[520px]'
        }`}
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-1.5">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span className="text-[10px]">Loading...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-amber-400 p-2 text-center">
            <AlertCircle className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Preview error</span>
          </div>
        )}

        {dataUrl && !isLoading && !error && (
          <div className="relative flex items-center justify-center w-full h-full">
            <div
              className="relative inline-block"
              style={{
                transform: `rotate(${page.rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                maxHeight:
                  zoomLevel === 1
                    ? '140px'
                    : zoomLevel === 2
                    ? '180px'
                    : zoomLevel === 3
                    ? '240px'
                    : zoomLevel === 4
                    ? '320px'
                    : '420px',
              }}
            >
              <img
                src={dataUrl}
                alt={`${page.sourceName} p. ${page.sourcePageIndex + 1}`}
                style={{
                  maxHeight:
                    zoomLevel === 1
                      ? '140px'
                      : zoomLevel === 2
                      ? '180px'
                      : zoomLevel === 3
                      ? '240px'
                      : zoomLevel === 4
                      ? '320px'
                      : '420px',
                }}
                className="w-auto max-w-full object-contain rounded bg-white shadow-md border border-slate-200 pointer-events-none block"
                loading="lazy"
              />

              {/* Render Freehand Drawing / Highlighter Overlay */}
              {page.drawingDataUrl && (
                <img
                  src={page.drawingDataUrl}
                  alt="Drawing overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Render Signature Overlays directly on page thumbnail */}
              {page.signatures &&
                page.signatures.map((sig) => {
                  const intrinsic = getSignatureIntrinsicState(sig)
                  return (
                    <img
                      key={sig.id}
                      src={sig.imageDataUrl}
                      alt="Signature overlay"
                      style={{
                        position: 'absolute',
                        left: `${intrinsic.xPercent}%`,
                        top: `${intrinsic.yPercent}%`,
                        width: `${intrinsic.widthPercent}%`,
                        height: `${intrinsic.heightPercent}%`,
                        transform: `rotate(${intrinsic.intrinsicRotation}deg)`,
                        transformOrigin: 'center center',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                    />
                  )
                })}
            </div>
          </div>
        )}

        {/* Action Overlay */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 flex items-center space-x-1 z-10 pointer-events-auto"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRotateLeft(e)
            }}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-sm text-white/90 hover:text-white border border-white/10 shadow transition-all hover:scale-105 active:scale-95"
            title="Rotate Left 90°"
            aria-label="Rotate Left 90°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onRotateRight(e)
            }}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-sm text-white/90 hover:text-white border border-white/10 shadow transition-all hover:scale-105 active:scale-95"
            title="Rotate Right 90°"
            aria-label="Rotate Right 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onSign(e)
            }}
            className="p-1.5 rounded-lg bg-[#0284c7]/80 hover:bg-[#0284c7] backdrop-blur-sm text-white border border-sky-400/30 shadow transition-all hover:scale-105 active:scale-95"
            title="Edit & Sign Page (Full Screen)"
            aria-label="Edit & Sign Page (Full Screen)"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(e)
            }}
            className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 backdrop-blur-sm text-white border border-red-500/30 shadow transition-all hover:scale-105 active:scale-95"
            title="Delete page"
            aria-label="Delete page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Footer: P. X sequence label */}
      <div className="px-3 py-1.5 bg-[#131d2a] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold tracking-wide">
          P. {sequenceIndex}
        </span>
        <div className="flex items-center space-x-1.5">
          {(page.drawingDataUrl || (page.formValues && Object.keys(page.formValues).length > 0)) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-medium">
              Edited
            </span>
          )}
          {page.signatures && page.signatures.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
              Signed ({page.signatures.length})
            </span>
          )}
          {page.rotation !== 0 && (
            <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              {page.rotation}°
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
