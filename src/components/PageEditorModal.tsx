import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Check,
  RotateCcw,
  PenTool,
  Highlighter,
  Type,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Eraser,
} from 'lucide-react'
import type { PageDescriptor, FormFieldDescriptor, SignatureOverlay } from '../domain/types'
import { globalCoordinator } from '../coordinator/PdfCoordinator'
import { SignatureDialog } from './SignatureDialog'
import { getSignatureIntrinsicState } from '../lib/signatureUtils'

export type EditorTool = 'select' | 'form' | 'pen' | 'highlighter' | 'signature' | 'eraser'
export type FieldFontSizeOption = 'auto' | 'small' | 'medium' | 'large'

interface PageEditorModalProps {
  isOpen: boolean
  page: PageDescriptor | null
  onClose: () => void
  onSave: (
    pageId: string,
    data: {
      formValues: Record<string, string | boolean>
      customTextFields: any[]
      drawingDataUrl?: string
      signatures: SignatureOverlay[]
    }
  ) => void
}

// Custom SVG Cursors
const PEN_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/%3E%3Cpath d='m15 5 4 4'/%3E%3C/svg%3E") 2 22, crosshair`

const HIGHLIGHTER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23facc15' stroke='%23ca8a04' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9 11-6 6v3h3l6-6'/%3E%3Cpath d='m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'/%3E%3C/svg%3E") 2 22, crosshair`

interface TextLineBlock {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  str: string
}

interface SelectionBox {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
}

export const PageEditorModal: React.FC<PageEditorModalProps> = ({
  isOpen,
  page,
  onClose,
  onSave,
}) => {
  // Active Tool (Defaults to form filling)
  const [activeTool, setActiveTool] = useState<EditorTool>('form')

  // Tool Width Configs
  const [penWidth, setPenWidth] = useState<number>(3)
  const [highlighterWidth, setHighlighterWidth] = useState<number>(20)
  const [eraserWidth, setEraserWidth] = useState<number>(10)

  // Form Field Typography & Sizing
  const [focusedFieldName, setFocusedFieldName] = useState<string | null>(null)
  const [globalFormFontSize, setGlobalFormFontSize] = useState<FieldFontSizeOption>('auto')
  const [fieldFontSizes, setFieldFontSizes] = useState<Record<string, FieldFontSizeOption>>({})

  // Zoom & View
  const [zoomScale, setZoomScale] = useState<number>(1.0)
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(0.707)
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true)

  // Document Annotations State
  const [formFields, setFormFields] = useState<FormFieldDescriptor[]>([])
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({})
  const [signatures, setSignatures] = useState<SignatureOverlay[]>([])
  const [textBlocks, setTextBlocks] = useState<TextLineBlock[]>([])

  // Drawing Canvas & History
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const draftCanvasRef = useRef<HTMLCanvasElement>(null)
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null)
  const activeStrokePointsRef = useRef<{ x: number; y: number }[]>([])

  // Highlighter Gesture Engine
  const highlightModeRef = useRef<'text' | 'freehand' | null>(null)
  const textSelectStartRef = useRef<{ xPercent: number; yPercent: number; lineIndex: number } | null>(null)
  const [activeSelectionBoxes, setActiveSelectionBoxes] = useState<SelectionBox[]>([])

  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([])
  const [hasDrawings, setHasDrawings] = useState<boolean>(false)

  // Eraser Hover Position for live circular follower
  const [eraserHoverPos, setEraserHoverPos] = useState<{ x: number; y: number } | null>(null)

  // In-Place Signature Drag Box
  const [sigDragBox, setSigDragBox] = useState<{
    xPercent: number
    yPercent: number
    widthPercent: number
    heightPercent: number
  } | null>(null)
  const [isDraggingSigBox, setIsDraggingSigBox] = useState<boolean>(false)
  const [sigDragStart, setSigDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState<boolean>(false)

  // Container refs
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const viewportScrollRef = useRef<HTMLDivElement>(null)

  // Calculate dynamic display dimensions based on zoomScale and aspect ratio
  const baseDisplayWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.8, 700) : 650
  const displayWidth = Math.round(baseDisplayWidth * zoomScale)
  const displayHeight = Math.round((baseDisplayWidth / (pageAspectRatio || 0.707)) * zoomScale)

  // Calculate field font size in pixels (Smart Auto-Fit + Manual Selector Override)
  const getFieldFontSizePx = useCallback(
    (field: FormFieldDescriptor) => {
      const boxHeightPx = (displayHeight * field.heightPercent) / 100
      // Medium baseline font size (~60% of field height)
      const mediumPx = Math.max(8, Math.min(18, Math.round(boxHeightPx * 0.60)))
      const sizeOpt =
        (focusedFieldName === field.name ? fieldFontSizes[field.name] : undefined) ||
        fieldFontSizes[field.name] ||
        globalFormFontSize

      if (sizeOpt === 'small') return Math.max(6, Math.round(mediumPx * 0.65))
      if (sizeOpt === 'medium') return mediumPx
      if (sizeOpt === 'large') return Math.round(mediumPx * 1.35)
      // Auto is capped so it is never higher than medium
      return mediumPx
    },
    [displayHeight, focusedFieldName, fieldFontSizes, globalFormFontSize]
  )

  // Load Page Preview & Detect Form Fields & Text Blocks
  useEffect(() => {
    let isMounted = true
    let createdUrl: string | null = null

    if (isOpen && page) {
      setActiveTool('form') // Always enter the edit page in Form & Text mode
      setIsLoadingPage(true)
      setFormFields([])
      setTextBlocks([])
      setActiveSelectionBoxes([])
      setFocusedFieldName(null)
      setFormValues(page.formValues ? { ...page.formValues } : {})
      setSignatures(page.signatures ? [...page.signatures] : [])
      setDrawingHistory([])
      setSigDragBox(null)
      if (page.aspectRatio) {
        setPageAspectRatio(page.aspectRatio)
      }

      // Render high resolution raw base page (scale: 2.0)
      globalCoordinator
        .renderRawPageBlob(page, 2.0)
        .then((blob) => {
          if (isMounted) {
            createdUrl = URL.createObjectURL(blob)
            setPagePreviewUrl(createdUrl)
            setIsLoadingPage(false)
          }
        })
        .catch((err) => {
          console.error('Failed to render page preview for editor:', err)
          if (isMounted) {
            setIsLoadingPage(false)
          }
        })

      // Extract native AcroForm fields & Text Blocks
      if (page.sourceType === 'pdf') {
        globalCoordinator
          .extractPageFormFields(page.sourceId, page.sourcePageIndex, page.rotation || 0)
          .then((fields) => {
            if (isMounted) {
              setFormFields(fields)
              setFormValues((prev) => {
                const next = { ...prev }
                if (page.formValues) {
                  Object.assign(next, page.formValues)
                }
                for (const f of fields) {
                  if (next[f.name] === undefined && f.value !== undefined) {
                    next[f.name] = f.value
                  }
                }
                return next
              })
            }
          })
          .catch((err) => console.warn('Could not extract form fields:', err))

        globalCoordinator
          .extractPageTextBlocks(page.sourceId, page.sourcePageIndex, page.rotation || 0)
          .then((blocks) => {
            if (isMounted) {
              setTextBlocks(blocks)
            }
          })
          .catch((err) => console.warn('Could not extract text blocks:', err))
      }
    }

    return () => {
      isMounted = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [isOpen, page?.id, page?.rotation])

  // Initialize Drawing Canvas when loaded & mounted
  useEffect(() => {
    if (!page || !drawingCanvasRef.current || isLoadingPage) return
    const canvas = drawingCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (page.drawingDataUrl && page.drawingDataUrl.length > 50) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setHasDrawings(true)
        saveDrawingState()
      }
      img.src = page.drawingDataUrl
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawings(false)
    }
  }, [page?.id, page?.drawingDataUrl, isOpen, isLoadingPage])

  // --- Zoom Helpers ---
  const handleZoomIn = () => setZoomScale((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)))
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.4, +(prev - 0.15).toFixed(2)))
  const handleZoomFit = () => setZoomScale(1.0)

  // --- Drawing Helpers ---
  const saveDrawingState = useCallback(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setDrawingHistory((prev) => [...prev.slice(-15), current])
  }, [])

  const handleUndoDrawing = () => {
    const canvas = drawingCanvasRef.current
    if (!canvas || drawingHistory.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prevHistory = [...drawingHistory]
    const lastState = prevHistory.pop()
    setDrawingHistory(prevHistory)

    if (lastState) {
      ctx.putImageData(lastState, 0, 0)
    }
    if (prevHistory.length === 0) {
      setHasDrawings(false)
    }
  }

  const handleClearDrawings = () => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    saveDrawingState()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawings(false)
  }

  // --- Canvas Pointer Coordinates ---
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return { x: 0, y: 0, xPercent: 0, yPercent: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    return {
      x: clientX * scaleX,
      y: clientY * scaleY,
      xPercent: (clientX / rect.width) * 100,
      yPercent: (clientY / rect.height) * 100,
    }
  }

  // --- Compute Geometric Text Selection Boxes ---
  const calculateSelectionBoxes = (
    start: { xPercent: number; yPercent: number; lineIndex: number },
    current: { xPercent: number; yPercent: number }
  ): SelectionBox[] => {
    if (textBlocks.length === 0) return []

    // Find closest line index to current pointer Y
    let currentLineIdx = start.lineIndex
    let minDistance = Infinity

    textBlocks.forEach((line, idx) => {
      const lineCenterY = line.yPercent + line.heightPercent / 2
      const dist = Math.abs(current.yPercent - lineCenterY)
      if (dist < minDistance) {
        minDistance = dist
        currentLineIdx = idx
      }
    })

    const isDraggingForward = currentLineIdx >= start.lineIndex
    const startIdx = Math.min(start.lineIndex, currentLineIdx)
    const endIdx = Math.max(start.lineIndex, currentLineIdx)

    const boxes: SelectionBox[] = []

    if (startIdx === endIdx) {
      // Single line selection
      const line = textBlocks[startIdx]
      const minX = Math.min(start.xPercent, current.xPercent)
      const maxX = Math.max(start.xPercent, current.xPercent)

      const boxLeft = Math.max(line.xPercent, minX)
      const boxRight = Math.min(line.xPercent + line.widthPercent, maxX)
      const boxWidth = Math.max(0, boxRight - boxLeft)

      if (boxWidth > 0.1) {
        boxes.push({
          xPercent: boxLeft,
          yPercent: line.yPercent,
          widthPercent: boxWidth,
          heightPercent: line.heightPercent,
        })
      }
    } else {
      // Multi-line selection
      for (let i = startIdx; i <= endIdx; i++) {
        const line = textBlocks[i]
        if (!line) continue

        if (isDraggingForward) {
          if (i === startIdx) {
            // First line: from start.x to end of line
            const boxLeft = Math.max(line.xPercent, start.xPercent)
            const boxRight = line.xPercent + line.widthPercent
            const boxWidth = Math.max(0, boxRight - boxLeft)
            if (boxWidth > 0.1) {
              boxes.push({
                xPercent: boxLeft,
                yPercent: line.yPercent,
                widthPercent: boxWidth,
                heightPercent: line.heightPercent,
              })
            }
          } else if (i === endIdx) {
            // Last line: from start of line to current.x
            const boxLeft = line.xPercent
            const boxRight = Math.min(line.xPercent + line.widthPercent, Math.max(line.xPercent, current.xPercent))
            const boxWidth = Math.max(0, boxRight - boxLeft)
            if (boxWidth > 0.1) {
              boxes.push({
                xPercent: boxLeft,
                yPercent: line.yPercent,
                widthPercent: boxWidth,
                heightPercent: line.heightPercent,
              })
            }
          } else {
            // Intermediate line: full line
            boxes.push({
              xPercent: line.xPercent,
              yPercent: line.yPercent,
              widthPercent: line.widthPercent,
              heightPercent: line.heightPercent,
            })
          }
        } else {
          // Dragging backwards (upwards)
          if (i === startIdx) {
            // Top line: from current.x to end of line
            const boxLeft = Math.max(line.xPercent, current.xPercent)
            const boxRight = line.xPercent + line.widthPercent
            const boxWidth = Math.max(0, boxRight - boxLeft)
            if (boxWidth > 0.1) {
              boxes.push({
                xPercent: boxLeft,
                yPercent: line.yPercent,
                widthPercent: boxWidth,
                heightPercent: line.heightPercent,
              })
            }
          } else if (i === endIdx) {
            // Bottom line: from start of line to start.x
            const boxLeft = line.xPercent
            const boxRight = Math.min(line.xPercent + line.widthPercent, Math.max(line.xPercent, start.xPercent))
            const boxWidth = Math.max(0, boxRight - boxLeft)
            if (boxWidth > 0.1) {
              boxes.push({
                xPercent: boxLeft,
                yPercent: line.yPercent,
                widthPercent: boxWidth,
                heightPercent: line.heightPercent,
              })
            }
          } else {
            // Intermediate line: full line
            boxes.push({
              xPercent: line.xPercent,
              yPercent: line.yPercent,
              widthPercent: line.widthPercent,
              heightPercent: line.heightPercent,
            })
          }
        }
      }
    }

    return boxes
  }

  // --- Pointer Handlers for Pen, Highlighter & Eraser ---
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pen' && activeTool !== 'highlighter' && activeTool !== 'eraser') return

    const canvas = drawingCanvasRef.current
    if (!canvas) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Fallback
    }

    saveDrawingState()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getCanvasCoords(e)
    lastPointerPosRef.current = { x: coords.x, y: coords.y }
    activeStrokePointsRef.current = [{ x: coords.x, y: coords.y }]

    if (activeTool === 'pen') {
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = penWidth * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, (penWidth * 2) / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else if (activeTool === 'highlighter') {
      // Check if pointer starts on a text line
      const matchedLineIdx = textBlocks.findIndex((line) => {
        const inX = coords.xPercent >= line.xPercent - 0.5 && coords.xPercent <= line.xPercent + line.widthPercent + 0.5
        const inY = coords.yPercent >= line.yPercent - 0.2 && coords.yPercent <= line.yPercent + line.heightPercent + 0.2
        return inX && inY
      })

      if (matchedLineIdx !== -1) {
        // Lock into Text Highlighting Mode
        highlightModeRef.current = 'text'
        textSelectStartRef.current = {
          xPercent: coords.xPercent,
          yPercent: coords.yPercent,
          lineIndex: matchedLineIdx,
        }
        const initialBoxes = calculateSelectionBoxes(textSelectStartRef.current, {
          xPercent: coords.xPercent,
          yPercent: coords.yPercent,
        })
        setActiveSelectionBoxes(initialBoxes)
      } else {
        // Lock into Freehand Highlighting Mode
        highlightModeRef.current = 'freehand'
        textSelectStartRef.current = null
        setActiveSelectionBoxes([])

        const draftCanvas = draftCanvasRef.current
        if (draftCanvas) {
          const draftCtx = draftCanvas.getContext('2d')
          if (draftCtx) {
            draftCtx.clearRect(0, 0, draftCanvas.width, draftCanvas.height)
            draftCtx.fillStyle = '#facc15'
            draftCtx.beginPath()
            draftCtx.arc(coords.x, coords.y, (highlighterWidth * 2) / 2, 0, Math.PI * 2)
            draftCtx.fill()
          }
        }
      }
    } else if (activeTool === 'eraser') {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, eraserWidth, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    setIsDrawing(true)
    setHasDrawings(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Track eraser hover position for circle cursor follower
    if (activeTool === 'eraser' && pageContainerRef.current) {
      const rect = pageContainerRef.current.getBoundingClientRect()
      setEraserHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    } else {
      if (eraserHoverPos) setEraserHoverPos(null)
    }

    if (!isDrawing || !lastPointerPosRef.current) return
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getCanvasCoords(e)
    const prevPos = lastPointerPosRef.current

    if (activeTool === 'pen') {
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = penWidth * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#000000'
      ctx.beginPath()
      ctx.moveTo(prevPos.x, prevPos.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      ctx.restore()
      lastPointerPosRef.current = { x: coords.x, y: coords.y }
    } else if (activeTool === 'highlighter') {
      if (highlightModeRef.current === 'text' && textSelectStartRef.current) {
        // Update active blue selection boxes in real time
        const updatedBoxes = calculateSelectionBoxes(textSelectStartRef.current, {
          xPercent: coords.xPercent,
          yPercent: coords.yPercent,
        })
        setActiveSelectionBoxes(updatedBoxes)
      } else if (highlightModeRef.current === 'freehand') {
        // Record stroke points and render continuous smooth ribbon on draft canvas
        activeStrokePointsRef.current.push({ x: coords.x, y: coords.y })
        const draftCanvas = draftCanvasRef.current
        if (draftCanvas) {
          const draftCtx = draftCanvas.getContext('2d')
          if (draftCtx) {
            const pts = activeStrokePointsRef.current
            draftCtx.clearRect(0, 0, draftCanvas.width, draftCanvas.height)
            draftCtx.strokeStyle = '#facc15'
            draftCtx.fillStyle = '#facc15'
            draftCtx.lineWidth = highlighterWidth * 2
            draftCtx.lineCap = 'round'
            draftCtx.lineJoin = 'round'

            if (pts.length === 1) {
              draftCtx.beginPath()
              draftCtx.arc(pts[0].x, pts[0].y, (highlighterWidth * 2) / 2, 0, Math.PI * 2)
              draftCtx.fill()
            } else if (pts.length === 2) {
              draftCtx.beginPath()
              draftCtx.moveTo(pts[0].x, pts[0].y)
              draftCtx.lineTo(pts[1].x, pts[1].y)
              draftCtx.stroke()
            } else {
              draftCtx.beginPath()
              draftCtx.moveTo(pts[0].x, pts[0].y)
              for (let i = 1; i < pts.length - 1; i++) {
                const midX = (pts[i].x + pts[i + 1].x) / 2
                const midY = (pts[i].y + pts[i + 1].y) / 2
                draftCtx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
              }
              draftCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
              draftCtx.stroke()
            }
          }
        }
      }
      lastPointerPosRef.current = { x: coords.x, y: coords.y }
    } else if (activeTool === 'eraser') {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = eraserWidth * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(prevPos.x, prevPos.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      ctx.restore()
      lastPointerPosRef.current = { x: coords.x, y: coords.y }
    }
  }

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Fallback
      }
    }
    if (isDrawing) {
      if (activeTool === 'highlighter') {
        if (highlightModeRef.current === 'text' && activeSelectionBoxes.length > 0) {
          // Commit selected line boxes to permanent transparent yellow highlights
          const canvas = drawingCanvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.save()
              ctx.globalCompositeOperation = 'multiply'
              ctx.fillStyle = 'rgba(250, 204, 21, 0.40)' // Transparent Yellow

              for (const box of activeSelectionBoxes) {
                const bx = (canvas.width * box.xPercent) / 100
                const by = (canvas.height * box.yPercent) / 100
                const bw = (canvas.width * box.widthPercent) / 100
                const bh = (canvas.height * box.heightPercent) / 100
                if (bw > 0.5 && bh > 0.5) {
                  ctx.fillRect(bx, by, bw, bh)
                }
              }

              ctx.restore()
              setHasDrawings(true)
              saveDrawingState()
            }
          }
        } else if (highlightModeRef.current === 'freehand') {
          // Bake freehand draft canvas to drawing canvas
          const canvas = drawingCanvasRef.current
          const draftCanvas = draftCanvasRef.current
          if (canvas && draftCanvas) {
            const ctx = canvas.getContext('2d')
            const draftCtx = draftCanvas.getContext('2d')
            if (ctx && draftCtx) {
              ctx.save()
              ctx.globalAlpha = 0.38
              ctx.globalCompositeOperation = 'multiply'
              ctx.drawImage(draftCanvas, 0, 0)
              ctx.restore()
              draftCtx.clearRect(0, 0, draftCanvas.width, draftCanvas.height)
              setHasDrawings(true)
              saveDrawingState()
            }
          }
        }
      }

      setIsDrawing(false)
      lastPointerPosRef.current = null
      highlightModeRef.current = null
      textSelectStartRef.current = null
      setActiveSelectionBoxes([])
      activeStrokePointsRef.current = []
    }
  }

  // --- Page Container Pointer Handlers (Signatures only) ---
  const handlePagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === 'signature') {
      if (!pageContainerRef.current) return
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Fallback
      }

      const rect = pageContainerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))

      setSigDragStart({ x, y })
      setIsDraggingSigBox(true)
      setSigDragBox({
        xPercent: (x / rect.width) * 100,
        yPercent: (y / rect.height) * 100,
        widthPercent: 0,
        heightPercent: 0,
      })
    }
  }

  const handlePagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSigBox && sigDragStart && pageContainerRef.current) {
      const rect = pageContainerRef.current.getBoundingClientRect()
      const currentX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
      const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))

      const left = Math.min(sigDragStart.x, currentX)
      const top = Math.min(sigDragStart.y, currentY)
      const w = Math.abs(currentX - sigDragStart.x)
      const h = Math.abs(currentY - sigDragStart.y)

      setSigDragBox({
        xPercent: (left / rect.width) * 100,
        yPercent: (top / rect.height) * 100,
        widthPercent: (w / rect.width) * 100,
        heightPercent: (h / rect.height) * 100,
      })
    }
  }

  const handlePagePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Fallback
      }
    }

    if (isDraggingSigBox) {
      setIsDraggingSigBox(false)
      setSigDragStart(null)

      setSigDragBox((prev) => {
        let finalBox = prev
        if (!finalBox || (finalBox.widthPercent < 4 && finalBox.heightPercent < 4)) {
          const clickX = prev ? prev.xPercent : 40
          const clickY = prev ? prev.yPercent : 50
          finalBox = {
            xPercent: Math.max(0, Math.min(70, clickX - 15)),
            yPercent: Math.max(0, Math.min(85, clickY - 5)),
            widthPercent: 30,
            heightPercent: 12,
          }
        } else {
          finalBox = {
            ...finalBox,
            widthPercent: Math.max(8, finalBox.widthPercent),
            heightPercent: Math.max(4, finalBox.heightPercent),
          }
        }
        setIsSignatureDialogOpen(true)
        return finalBox
      })
    }
  }

  // --- Confirm Signature Creation ---
  const handleConfirmSignature = (imageDataUrl: string) => {
    const targetBox = sigDragBox || {
      xPercent: 35,
      yPercent: 75,
      widthPercent: 30,
      heightPercent: 12,
    }

    const newSig: SignatureOverlay = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      imageDataUrl,
      xPercent: targetBox.xPercent,
      yPercent: targetBox.yPercent,
      widthPercent: targetBox.widthPercent,
      heightPercent: targetBox.heightPercent,
      placedRotation: page?.rotation || 0,
      createdAt: Date.now(),
    }

    setSignatures((prev) => [...prev, newSig])
    setSigDragBox(null)
    setActiveTool('select')
  }

  // --- Form Value Change ---
  const handleFormValueChange = (name: string, val: string | boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: val,
    }))
  }

  const handleDeleteSignature = (id: string) => {
    setSignatures((prev) => prev.filter((s) => s.id !== id))
  }

  // --- Save Changes & Done ---
  const handleSaveAndClose = () => {
    if (!page) return
    const canvas = drawingCanvasRef.current
    let drawingDataUrl: string | undefined = page.drawingDataUrl

    if (canvas && !isLoadingPage) {
      if (hasDrawings) {
        drawingDataUrl = canvas.toDataURL('image/png')
      } else if (page.drawingDataUrl && page.drawingDataUrl.length > 50) {
        drawingDataUrl = page.drawingDataUrl
      } else {
        drawingDataUrl = ''
      }
    }

    onSave(page.id, {
      formValues: { ...formValues },
      customTextFields: [],
      drawingDataUrl,
      signatures: [...signatures],
    })

    onClose()
  }

  if (!isOpen || !page) return null

  // Dynamic Cursor for Active Tool
  const getActiveCursor = () => {
    if (activeTool === 'pen') return PEN_CURSOR
    if (activeTool === 'highlighter') return HIGHLIGHTER_CURSOR
    if (activeTool === 'eraser') return 'none'
    if (activeTool === 'signature') return 'crosshair'
    return 'default'
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12] flex flex-col overflow-hidden text-slate-100 animate-in fade-in duration-200 select-none">
      {/* Top Header Navigation Bar */}
      <div className="h-14 bg-[#0b1120] border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Document Info */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-xs font-bold font-mono">
              Page {page.sourcePageIndex + 1}
            </span>
            <span className="text-xs text-slate-300 font-semibold truncate max-w-[150px] sm:max-w-xs">
              {page.sourceName}
            </span>
          </div>
        </div>

        {/* Center: Main Primary Tool Buttons */}
        <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-xl p-1 space-x-1 shadow-inner">
          <button
            onClick={() => setActiveTool('form')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'form'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Form & Text Tool"
          >
            <Type className="w-4 h-4" />
            <span className="hidden md:inline">Form & Text</span>
          </button>

          <button
            onClick={() => setActiveTool('pen')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'pen'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Draw Pen"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden md:inline">Draw Pen</span>
          </button>

          <button
            onClick={() => setActiveTool('highlighter')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'highlighter'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
            <span className="hidden md:inline">Highlighter</span>
          </button>

          <button
            onClick={() => setActiveTool('signature')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'signature'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Signature"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Signature</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'eraser'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Save & Done / Cancel Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAndClose}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Save & Done</span>
          </button>
        </div>
      </div>

      {/* Secondary Options Bar (Clean & Minimal) */}
      <div className="h-11 bg-[#0e1626] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 text-xs z-20 overflow-x-auto">
        {/* Left: Tool Sub-Options */}
        <div className="flex items-center space-x-4 min-w-0">
          {/* Form & Text Sizing Controls */}
          {activeTool === 'form' && (
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Text Size:</span>
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 space-x-1">
                {(['auto', 'small', 'medium', 'large'] as const).map((size) => {
                  const isSelected = (focusedFieldName ? (fieldFontSizes[focusedFieldName] || 'auto') : globalFormFontSize) === size
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        if (focusedFieldName) {
                          setFieldFontSizes((prev) => ({ ...prev, [focusedFieldName]: size }))
                        } else {
                          setGlobalFormFontSize(size)
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-all ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pen Controls: Width slider and Undo */}
          {activeTool === 'pen' && (
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Pen Width:</span>
              <input
                type="range"
                min={1}
                max={12}
                value={penWidth}
                onChange={(e) => setPenWidth(parseInt(e.target.value, 10))}
                className="w-24 sm:w-28 accent-sky-500 cursor-pointer"
              />
              <span className="font-mono text-sky-400 font-bold">{penWidth}px</span>

              <button
                onClick={handleUndoDrawing}
                disabled={drawingHistory.length === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 ml-2"
                title="Undo last stroke"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Highlighter Controls: Width slider and Undo */}
          {activeTool === 'highlighter' && (
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Highlighter Width:</span>
              <input
                type="range"
                min={8}
                max={40}
                value={highlighterWidth}
                onChange={(e) => setHighlighterWidth(parseInt(e.target.value, 10))}
                className="w-24 sm:w-28 accent-yellow-500 cursor-pointer"
              />
              <span className="font-mono text-yellow-400 font-bold">{highlighterWidth}px</span>

              <button
                onClick={handleUndoDrawing}
                disabled={drawingHistory.length === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 ml-2"
                title="Undo last highlight"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Eraser Controls: Width slider, Clear button and Undo */}
          {activeTool === 'eraser' && (
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Eraser Size:</span>
              <input
                type="range"
                min={3}
                max={60}
                value={eraserWidth}
                onChange={(e) => setEraserWidth(parseInt(e.target.value, 10))}
                className="w-24 sm:w-28 accent-slate-400 cursor-pointer"
              />
              <span className="font-mono text-slate-300 font-bold">{eraserWidth}px</span>

              <button
                onClick={handleUndoDrawing}
                disabled={drawingHistory.length === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 ml-2"
                title="Undo eraser stroke"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClearDrawings}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors ml-2"
              >
                Clear All Drawings
              </button>
            </div>
          )}
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-300 font-bold w-12 text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomFit}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Main Document Workspace Viewport */}
      <div
        ref={viewportScrollRef}
        className="flex-1 overflow-auto bg-[#070c14] p-4 sm:p-8 relative custom-scrollbar flex"
      >
        {isLoadingPage ? (
          <div className="m-auto flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading page workspace...</span>
          </div>
        ) : (
          <div className="m-auto shrink-0 flex items-center justify-center py-4">
            {/* Page Container with exact scaled layout dimensions */}
            <div
              ref={pageContainerRef}
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                cursor: getActiveCursor(),
              }}
              onPointerDown={handlePagePointerDown}
              onPointerMove={handlePagePointerMove}
              onPointerUp={handlePagePointerUp}
              onPointerCancel={handlePagePointerUp}
              className="relative shadow-2xl rounded border border-slate-300/40 select-none bg-white shrink-0"
            >
              {/* LAYER 1: Base Rendered PDF Page Image */}
              {pagePreviewUrl && (
                <img
                  src={pagePreviewUrl}
                  alt="Document Page"
                  onLoad={(e) => {
                    const img = e.currentTarget
                    if (img.naturalWidth && img.naturalHeight) {
                      setPageAspectRatio(img.naturalWidth / img.naturalHeight)
                    }
                  }}
                  className="w-full h-full block pointer-events-none rounded select-none object-contain bg-white"
                />
              )}

              {/* LAYER 2: Base Persistent Drawing Canvas */}
              <canvas
                ref={drawingCanvasRef}
                width={1600}
                height={Math.round(1600 / (pageAspectRatio || 0.707))}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`absolute inset-0 w-full h-full touch-none z-10 ${
                  activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser'
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              />

              {/* LAYER 2.5: Active Freehand Smooth Stroke Draft Canvas */}
              <canvas
                ref={draftCanvasRef}
                width={1600}
                height={Math.round(1600 / (pageAspectRatio || 0.707))}
                style={{
                  opacity: 0.38,
                  mixBlendMode: 'multiply',
                }}
                className="absolute inset-0 w-full h-full pointer-events-none z-15"
              />

              {/* LAYER 3: Active Live Blue Text Selection Highlight Overlay */}
              {activeSelectionBoxes.map((box, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${box.xPercent}%`,
                    top: `${box.yPercent}%`,
                    width: `${box.widthPercent}%`,
                    height: `${box.heightPercent}%`,
                  }}
                  className="rounded-xs bg-[#0078d7]/40 border border-[#0078d7]/80 pointer-events-none z-20"
                />
              ))}

              {/* LAYER 4: Interactive PDF AcroForm Fields (Blue Tinted Boxes) */}
              {formFields.map((field) => {
                const val = formValues[field.name] !== undefined ? formValues[field.name] : (field.value ?? '')
                const isCheckbox = field.type === 'checkbox' || field.type === 'radio'
                const isChecked = typeof val === 'boolean'
                  ? val
                  : (typeof val === 'string' && val.trim().toLowerCase() !== 'off' && val.trim().toLowerCase() !== '/off' && val.trim().toLowerCase() !== 'false' && val.trim().toLowerCase() !== '0' && val.trim() !== '')
                const fontSizePx = getFieldFontSizePx(field)

                return (
                  <div
                    key={field.id}
                    style={{
                      position: 'absolute',
                      left: `${field.xPercent}%`,
                      top: `${field.yPercent}%`,
                      width: `${field.widthPercent}%`,
                      height: `${field.heightPercent}%`,
                      pointerEvents: activeTool === 'form' ? 'auto' : 'none',
                    }}
                    className={`group transition-all ${
                      isCheckbox
                        ? 'flex items-center justify-center'
                        : 'flex items-center'
                    } ${
                      focusedFieldName === field.name
                        ? 'bg-sky-500/25 border-2 border-sky-500 ring-2 ring-sky-400/30'
                        : 'bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/50 hover:border-sky-500'
                    } rounded-xs z-25`}
                  >
                    {isCheckbox ? (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onFocus={() => setFocusedFieldName(field.name)}
                        onChange={(e) => handleFormValueChange(field.name, e.target.checked)}
                        disabled={field.readOnly}
                        className="w-4 h-4 rounded text-sky-600 bg-white/90 border-slate-400 focus:ring-0 cursor-pointer accent-sky-600"
                      />
                    ) : (field.multiline || field.heightPercent >= 2.2 || (typeof val === 'string' && val.includes('\n'))) ? (
                      <textarea
                        value={String(val)}
                        onFocus={() => setFocusedFieldName(field.name)}
                        onChange={(e) => handleFormValueChange(field.name, e.target.value)}
                        readOnly={field.readOnly}
                        style={{
                          fontSize: `${fontSizePx}px`,
                          lineHeight: `${Math.max(12, Math.round(fontSizePx * 1.25))}px`,
                        }}
                        className="w-full h-full bg-transparent resize-none text-slate-900 font-sans px-1 py-0.5 focus:outline-none focus:bg-sky-500/25 rounded-xs leading-normal"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(val)}
                        onFocus={() => setFocusedFieldName(field.name)}
                        onChange={(e) => handleFormValueChange(field.name, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleFormValueChange(field.name, String(val) + '\n')
                          }
                        }}
                        readOnly={field.readOnly}
                        style={{ fontSize: `${fontSizePx}px` }}
                        className="w-full h-full bg-transparent text-slate-900 font-sans px-1 py-0 focus:outline-none focus:bg-sky-500/25 rounded-xs leading-none"
                      />
                    )}
                  </div>
                )
              })}

              {/* Single Neutral Circular Eraser Follower */}
              {activeTool === 'eraser' && eraserHoverPos && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${eraserHoverPos.x - eraserWidth}px`,
                    top: `${eraserHoverPos.y - eraserWidth}px`,
                    width: `${eraserWidth * 2}px`,
                    height: `${eraserWidth * 2}px`,
                  }}
                  className="rounded-full border border-slate-700 bg-slate-400/20 shadow-xs pointer-events-none z-20"
                />
              )}

              {/* LAYER 5: Placed Signature Overlays */}
              {signatures.map((sig) => {
                const intrinsic = getSignatureIntrinsicState(sig)
                return (
                  <div
                    key={sig.id}
                    style={{
                      position: 'absolute',
                      left: `${intrinsic.xPercent}%`,
                      top: `${intrinsic.yPercent}%`,
                      width: `${intrinsic.widthPercent}%`,
                      height: `${intrinsic.heightPercent}%`,
                      transform: `rotate(${intrinsic.intrinsicRotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                    className="group border border-dashed border-sky-400 hover:border-sky-600 rounded bg-white/40 hover:bg-white/70 transition-all flex items-center justify-center z-20"
                  >
                    <img
                      src={sig.imageDataUrl}
                      alt="Signature"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSignature(sig.id)
                      }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                      title="Remove signature"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}

              {/* LAYER 6: In-Place Signature Drag Box Indicator */}
              {sigDragBox && isDraggingSigBox && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${sigDragBox.xPercent}%`,
                    top: `${sigDragBox.yPercent}%`,
                    width: `${sigDragBox.widthPercent}%`,
                    height: `${sigDragBox.heightPercent}%`,
                  }}
                  className="border-2 border-dashed border-sky-500 bg-sky-500/20 rounded pointer-events-none flex items-center justify-center z-20 animate-pulse"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Standalone Signature Creation Dialog */}
      <SignatureDialog
        isOpen={isSignatureDialogOpen}
        onClose={() => {
          setIsSignatureDialogOpen(false)
          setSigDragBox(null)
        }}
        onConfirmSignature={handleConfirmSignature}
      />
    </div>
  )
}
