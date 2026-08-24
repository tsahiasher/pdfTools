import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageCard } from './PageCard'
import { useThumbnail } from '../hooks/useThumbnail'
import { getSignatureIntrinsicState } from '../lib/signatureUtils'
import type { PageDescriptor, PdfSource } from '../domain/types'

interface PageGridProps {
  pages: PageDescriptor[]
  sources: Map<string, PdfSource>
  selectedPageIds: Set<string>
  zoomLevel: number
  onToggleSelect: (pageId: string, isRange: boolean) => void
  onRotatePage: (pageId: string, deltaDegrees: number) => void
  onSignPage: (pageId: string) => void
  onDeletePage: (pageId: string) => void
  onReorderMultiple: (draggedIds: string[], targetIndex: number) => void
}

interface DisplayItem {
  key: string
  type: 'page' | 'placeholder'
  page?: PageDescriptor
  remainingIndex?: number
  sequenceIndex: number
}

interface ActiveDragState {
  draggedIds: string[]
  primaryPage: PageDescriptor
  primarySource?: PdfSource
  currentX: number
  currentY: number
  offsetX: number
  offsetY: number
  cardWidth: number
  cardHeight: number
  insertIndex: number
}

interface RowBand {
  top: number
  bottom: number
  midY: number
  rowIndex: number
}

/**
 * Enforces closed-hand grabbing cursor across every element on the entire page
 */
function enableGlobalGrabbingCursor() {
  let styleEl = document.getElementById('drag-cursor-override') as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'drag-cursor-override'
    styleEl.innerHTML = `* { cursor: grabbing !important; -webkit-user-select: none !important; user-select: none !important; }`
    document.head.appendChild(styleEl)
  }
}

/**
 * Removes global grabbing cursor override
 */
function disableGlobalGrabbingCursor() {
  const styleEl = document.getElementById('drag-cursor-override')
  if (styleEl) {
    styleEl.remove()
  }
}

/**
 * Grid slot insertion calculator mapping directly to visual (Row, Column) cells
 * based on the geometric center of the lifted floating card preview.
 */
function calculateGridInsertIndex(
  centerCardX: number,
  centerCardY: number,
  gridEl: HTMLDivElement | null,
  totalRemaining: number
): number {
  if (!gridEl) return 0

  const gridRect = gridEl.getBoundingClientRect()
  const template = window.getComputedStyle(gridEl).gridTemplateColumns
  const colCount = Math.max(1, template.split(' ').filter(Boolean).length)

  // Find all rendered child slot elements in the grid
  const childElements = Array.from(gridEl.children) as HTMLElement[]
  if (childElements.length === 0) return 0

  // Group child elements into row bands based on their rendered top position
  const rowBands: RowBand[] = []
  childElements.forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return

    const existingRow = rowBands.find((rb) => Math.abs(rb.top - r.top) < 35)
    if (existingRow) {
      existingRow.top = Math.min(existingRow.top, r.top)
      existingRow.bottom = Math.max(existingRow.bottom, r.bottom)
      existingRow.midY = (existingRow.top + existingRow.bottom) / 2
    } else {
      rowBands.push({
        top: r.top,
        bottom: r.bottom,
        midY: (r.top + r.bottom) / 2,
        rowIndex: rowBands.length,
      })
    }
  })

  // Sort rows vertically
  rowBands.sort((a, b) => a.top - b.top)
  rowBands.forEach((rb, idx) => (rb.rowIndex = idx))

  if (rowBands.length === 0) return 0

  // 1. If above the very first row -> slot 0
  const firstRow = rowBands[0]
  if (centerCardY < firstRow.top) {
    return 0
  }

  // 2. If below the very last row -> slot at end
  const lastRow = rowBands[rowBands.length - 1]
  if (centerCardY > lastRow.bottom) {
    return totalRemaining
  }

  // 3. Find target row index based on centerCardY
  let targetRowIndex = 0
  let minRowDist = Number.POSITIVE_INFINITY

  for (let i = 0; i < rowBands.length; i++) {
    const rb = rowBands[i]
    if (centerCardY >= rb.top && centerCardY <= rb.bottom) {
      targetRowIndex = rb.rowIndex
      break
    }
    const dist = Math.abs(centerCardY - rb.midY)
    if (dist < minRowDist) {
      minRowDist = dist
      targetRowIndex = rb.rowIndex
    }
  }

  // 4. Calculate target column within that row
  const colWidth = gridRect.width / colCount
  const relativeX = centerCardX - gridRect.left
  const rawCol = relativeX / colWidth
  const targetCol = Math.max(0, Math.min(colCount, Math.round(rawCol)))

  // Target 1D slot index
  const targetSlotIndex = targetRowIndex * colCount + targetCol

  return Math.max(0, Math.min(targetSlotIndex, totalRemaining))
}

/**
 * Floating thumbnail for the lifted card following the cursor
 */
const LiftedPageThumbnail: React.FC<{ page: PageDescriptor; zoomLevel: number }> = ({
  page,
  zoomLevel,
}) => {
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

  const { dataUrl } = useThumbnail({
    sourceId: page.sourceId,
    pageIndex: page.sourcePageIndex,
    maxWidth: thumbnailMaxWidth,
    lazy: false,
    imagePreviewUrl: page.imagePreviewUrl,
  })

  if (!dataUrl) {
    return (
      <div className="w-[120px] h-[160px] bg-white rounded shadow-md flex items-center justify-center">
        <span className="text-[10px] text-slate-400">Loading...</span>
      </div>
    )
  }

  const maxHeightStyle =
    zoomLevel === 1
      ? '140px'
      : zoomLevel === 2
      ? '180px'
      : zoomLevel === 3
      ? '240px'
      : zoomLevel === 4
      ? '320px'
      : '420px'

  return (
    <div
      className="relative inline-block"
      style={{
        transform: `rotate(${page.rotation}deg)`,
        maxHeight: maxHeightStyle,
      }}
    >
      <img
        src={dataUrl}
        alt={`Page ${page.sourcePageIndex + 1}`}
        style={{
          maxHeight: maxHeightStyle,
        }}
        className="w-auto max-w-full object-contain rounded bg-white shadow-xl border border-slate-200 pointer-events-none block"
      />
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
  )
}

export const PageGrid: React.FC<PageGridProps> = ({
  pages,
  sources,
  selectedPageIds,
  zoomLevel,
  onToggleSelect,
  onRotatePage,
  onSignPage,
  onDeletePage,
  onReorderMultiple,
}) => {
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
  const gridContainerRef = useRef<HTMLDivElement | null>(null)
  const autoScrollSpeedRef = useRef<number>(0)
  const scrollRafIdRef = useRef<number | null>(null)
  const lastPointerPosRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 })
  const didDragHappenRef = useRef<boolean>(false)
  const newlySelectedPageIdRef = useRef<string | null>(null)

  const dragRef = useRef<{
    isStarted: boolean
    draggedIds: string[]
    primaryPage: PageDescriptor
    primarySource?: PdfSource
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    cardWidth: number
    cardHeight: number
    insertIndex: number
    totalRemaining: number
  } | null>(null)

  // Ensure body cursor cleanup on unmount
  useEffect(() => {
    return () => {
      disableGlobalGrabbingCursor()
    }
  }, [])

  // Compute display items: non-dragged pages + empty gap placeholder slots at insertIndex
  const displayItems = useMemo<DisplayItem[]>(() => {
    if (!activeDrag) {
      return pages.map((page, index) => ({
        key: page.id,
        type: 'page',
        page,
        remainingIndex: index,
        sequenceIndex: index + 1,
      }))
    }

    const draggedSet = new Set(activeDrag.draggedIds)
    const remaining = pages.filter((p) => !draggedSet.has(p.id))
    const clampedInsert = Math.max(0, Math.min(activeDrag.insertIndex, remaining.length))
    const draggedCount = activeDrag.draggedIds.length

    const items: DisplayItem[] = []

    // 1. Pages before the insertion slot
    for (let i = 0; i < clampedInsert; i++) {
      items.push({
        key: remaining[i].id,
        type: 'page',
        page: remaining[i],
        remainingIndex: i,
        sequenceIndex: i + 1,
      })
    }

    // 2. Empty placeholder slots for the dragged pages
    for (let i = 0; i < draggedCount; i++) {
      items.push({
        key: `placeholder-slot-${i}`,
        type: 'placeholder',
        sequenceIndex: clampedInsert + i + 1,
      })
    }

    // 3. Pages after the insertion slot (sequence indices skip the dragged count)
    for (let i = clampedInsert; i < remaining.length; i++) {
      items.push({
        key: remaining[i].id,
        type: 'page',
        page: remaining[i],
        remainingIndex: i,
        sequenceIndex: i + 1 + draggedCount,
      })
    }

    return items
  }, [pages, activeDrag])

  const updateInsertionIndex = (clientX: number, clientY: number) => {
    if (!dragRef.current) return

    // Calculate center of the floating lifted card preview
    const cardLeft = clientX - dragRef.current.offsetX
    const cardTop = clientY - dragRef.current.offsetY
    const centerCardX = cardLeft + dragRef.current.cardWidth / 2
    const centerCardY = cardTop + dragRef.current.cardHeight / 2

    const newInsertIndex = calculateGridInsertIndex(
      centerCardX,
      centerCardY,
      gridContainerRef.current,
      dragRef.current.totalRemaining
    )

    dragRef.current.insertIndex = newInsertIndex

    setActiveDrag({
      draggedIds: dragRef.current.draggedIds,
      primaryPage: dragRef.current.primaryPage,
      primarySource: dragRef.current.primarySource,
      currentX: clientX,
      currentY: clientY,
      offsetX: dragRef.current.offsetX,
      offsetY: dragRef.current.offsetY,
      cardWidth: dragRef.current.cardWidth,
      cardHeight: dragRef.current.cardHeight,
      insertIndex: newInsertIndex,
    })
  }

  const startAutoScroll = () => {
    if (scrollRafIdRef.current !== null) return

    const performAutoScroll = () => {
      if (!dragRef.current || !dragRef.current.isStarted) {
        scrollRafIdRef.current = null
        return
      }

      const speed = autoScrollSpeedRef.current
      if (speed !== 0) {
        const mainEl = gridContainerRef.current?.closest('main')
        if (mainEl) {
          mainEl.scrollTop += speed
        }

        // Re-evaluate target slot as page scrolls under cursor
        updateInsertionIndex(lastPointerPosRef.current.clientX, lastPointerPosRef.current.clientY)
      }

      scrollRafIdRef.current = requestAnimationFrame(performAutoScroll)
    }

    scrollRafIdRef.current = requestAnimationFrame(performAutoScroll)
  }

  const stopAutoScroll = () => {
    if (scrollRafIdRef.current !== null) {
      cancelAnimationFrame(scrollRafIdRef.current)
      scrollRafIdRef.current = null
    }
    autoScrollSpeedRef.current = 0
  }

  const handlePointerDownCard = (
    page: PageDescriptor,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (e.button !== 0) return // Only primary button

    const targetElement = e.currentTarget
    const rect = targetElement.getBoundingClientRect()

    try {
      targetElement.setPointerCapture(e.pointerId)
    } catch {
      // Fallback if not supported
    }

    // If page is not yet selected, immediately select it and add to current selection set
    const isAlreadySelected = selectedPageIds.has(page.id)
    if (!isAlreadySelected) {
      newlySelectedPageIdRef.current = page.id
      onToggleSelect(page.id, false)
    } else {
      newlySelectedPageIdRef.current = null
    }

    // Build the list of IDs to drag: all existing selected pages plus this page
    const effectiveSelectedIds = new Set(selectedPageIds)
    effectiveSelectedIds.add(page.id)

    const idsToDrag = pages.filter((p) => effectiveSelectedIds.has(p.id)).map((p) => p.id)
    const remainingPages = pages.filter((p) => !idsToDrag.includes(p.id))
    const firstDraggedIdx = pages.findIndex((p) => idsToDrag.includes(p.id))
    const initialInsertIndex = pages
      .slice(0, firstDraggedIdx)
      .filter((p) => !idsToDrag.includes(p.id)).length

    didDragHappenRef.current = false

    dragRef.current = {
      isStarted: false,
      draggedIds: idsToDrag,
      primaryPage: page,
      primarySource: sources.get(page.sourceId),
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      cardWidth: rect.width,
      cardHeight: rect.height,
      insertIndex: Math.max(0, Math.min(initialInsertIndex, remainingPages.length)),
      totalRemaining: remainingPages.length,
    }

    lastPointerPosRef.current = { clientX: e.clientX, clientY: e.clientY }

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return

      lastPointerPosRef.current = { clientX: moveEvent.clientX, clientY: moveEvent.clientY }

      const dist = Math.hypot(
        moveEvent.clientX - dragRef.current.startX,
        moveEvent.clientY - dragRef.current.startY
      )

      if (!dragRef.current.isStarted && dist > 5) {
        dragRef.current.isStarted = true
        didDragHappenRef.current = true
        // Enforce closed-hand grabbing cursor across every single element on the page
        enableGlobalGrabbingCursor()
        startAutoScroll()
      }

      if (dragRef.current.isStarted) {
        // Calculate autoscroll speed based on vertical position
        const threshold = 120
        const topEdge = 80 // below navbar
        const bottomEdge = window.innerHeight

        let speed = 0
        if (moveEvent.clientY < topEdge + threshold) {
          const ratio = (topEdge + threshold - moveEvent.clientY) / threshold
          speed = -Math.max(2, Math.round(ratio * 20))
        } else if (moveEvent.clientY > bottomEdge - threshold) {
          const ratio = (moveEvent.clientY - (bottomEdge - threshold)) / threshold
          speed = Math.max(2, Math.round(ratio * 20))
        }

        autoScrollSpeedRef.current = speed

        updateInsertionIndex(moveEvent.clientX, moveEvent.clientY)
      }
    }

    const onPointerUp = (upEvent?: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      if (upEvent) {
        try {
          targetElement.releasePointerCapture(upEvent.pointerId)
        } catch {
          // Fallback if not supported
        }
      }

      disableGlobalGrabbingCursor()
      stopAutoScroll()

      if (dragRef.current && dragRef.current.isStarted) {
        const draggedIds = dragRef.current.draggedIds
        const insertIndex = dragRef.current.insertIndex
        onReorderMultiple(draggedIds, insertIndex)

        // If a single page was dragged, deselect it after dropping
        if (draggedIds.length === 1) {
          onToggleSelect(draggedIds[0], false)
        }
      }

      dragRef.current = null
      setActiveDrag(null)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const handleCardClick = (pageId: string, e: React.MouseEvent) => {
    if (didDragHappenRef.current) {
      didDragHappenRef.current = false
      newlySelectedPageIdRef.current = null
      return
    }

    // If it was newly selected on pointerdown and not a shift range click, keep it selected
    if (newlySelectedPageIdRef.current === pageId && !e.shiftKey) {
      newlySelectedPageIdRef.current = null
      return
    }

    newlySelectedPageIdRef.current = null
    const isRange = e.shiftKey
    onToggleSelect(pageId, isRange)
  }

  if (pages.length === 0) return null

  // Map zoom level (1..5) to Tailwind responsive grid column classes
  const gridColClass = useMemo(() => {
    switch (zoomLevel) {
      case 1:
        return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5'
      case 2:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3'
      case 3:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5'
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      case 5:
        return 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5'
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5'
    }
  }, [zoomLevel])

  return (
    <>
      <div ref={gridContainerRef} className={`grid ${gridColClass}`}>
        {displayItems.map((item) => (
          <motion.div
            key={item.key}
            layout
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 340,
              mass: 0.6,
            }}
            className="h-full flex flex-col"
          >
            {item.type === 'page' && item.page && item.remainingIndex !== undefined ? (
              <div
                data-remaining-index={item.remainingIndex}
                className="h-full flex flex-col"
              >
                <PageCard
                  page={item.page}
                  sequenceIndex={item.sequenceIndex}
                  source={sources.get(item.page.sourceId)}
                  isSelected={selectedPageIds.has(item.page.id)}
                  isDragging={false}
                  zoomLevel={zoomLevel}
                  onPointerDown={(e) => handlePointerDownCard(item.page!, e)}
                  onSelect={(e) => handleCardClick(item.page!.id, e)}
                  onRotateLeft={() => onRotatePage(item.page!.id, -90)}
                  onRotateRight={() => onRotatePage(item.page!.id, 90)}
                  onSign={() => onSignPage(item.page!.id)}
                  onDelete={() => onDeletePage(item.page!.id)}
                />
              </div>
            ) : (
              /* Empty Space in Grid matching user reference */
              <div
                className="w-full h-full rounded-xl pointer-events-none select-none opacity-0"
                style={{
                  minHeight: activeDrag ? `${activeDrag.cardHeight}px` : '200px',
                }}
                aria-hidden="true"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Floating "Lifted" Page Overlay attached to mouse */}
      {activeDrag && (
        <div
          className="fixed pointer-events-none z-50 rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl flex flex-col"
          style={{
            left: `${activeDrag.currentX - activeDrag.offsetX}px`,
            top: `${activeDrag.currentY - activeDrag.offsetY}px`,
            width: `${activeDrag.cardWidth}px`,
            height: `${activeDrag.cardHeight}px`,
            borderColor: activeDrag.primarySource?.color || '#38bdf8',
            borderWidth: '2px',
            borderStyle: 'solid',
            transform: 'scale(1.05)',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.45)',
            willChange: 'transform, left, top',
          }}
        >
          {/* Top Header Badge */}
          <div
            className="px-2.5 py-2 flex items-center space-x-2 border-b text-white"
            style={{
              backgroundColor: activeDrag.primarySource?.color || '#0284c7',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <span className="px-2 py-0.5 rounded bg-black/40 text-white text-xs font-bold shadow-sm">
              {activeDrag.draggedIds.length > 1
                ? `${activeDrag.draggedIds.length} Pages`
                : `Page ${activeDrag.primaryPage.sourcePageIndex + 1}`}
            </span>
            <span className="text-xs font-semibold truncate flex-1 opacity-95">
              {activeDrag.primaryPage.sourceName}
            </span>
          </div>

          {/* White Paper Preview */}
          <div className="relative flex-1 bg-[#0c131c] p-3 flex items-center justify-center overflow-hidden">
            <LiftedPageThumbnail page={activeDrag.primaryPage} zoomLevel={zoomLevel} />
          </div>

          {/* Bottom Footer */}
          <div className="px-3 py-1.5 bg-[#131d2a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Moving {activeDrag.draggedIds.length > 1 ? `${activeDrag.draggedIds.length} pages` : 'page'}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
