import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  PenTool,
  X,
  RotateCcw,
  Trash2,
  Save,
  Check,
  Star,
  XSquare,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Stamp,
  Type,
  ImageIcon,
  MousePointerClick,
} from 'lucide-react'
import type { PageDescriptor } from '../domain/types'
import { useThumbnail } from '../hooks/useThumbnail'

interface SignModalProps {
  isOpen: boolean
  page: PageDescriptor | null
  onClose: () => void
  onApplySignature: (
    pageId: string,
    signature: {
      imageDataUrl: string
      xPercent: number
      yPercent: number
      widthPercent: number
      heightPercent: number
    }
  ) => void
}

interface BoxCoords {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
}

const STORAGE_KEY_SIGNATURES = 'pdftools_signature_library'

export const SignModal: React.FC<SignModalProps> = ({
  isOpen,
  page,
  onClose,
  onApplySignature,
}) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload' | 'symbol'>('draw')

  // Step 1: Placement Box (percentages) - Starts as null (no default area)
  const [placementBox, setPlacementBox] = useState<BoxCoords | null>(null)
  const [isDrawingBox, setIsDrawingBox] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
  const pageContainerRef = useRef<HTMLDivElement>(null)

  // Step 2 - Draw Tab
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isPainting, setIsPainting] = useState(false)
  const [penThickness, setPenThickness] = useState<number>(3)
  const [history, setHistory] = useState<ImageData[]>([])
  const [hasDrawnContent, setHasDrawnContent] = useState(false)

  // Step 2 - Type Tab
  const [typedText, setTypedText] = useState<string>('Signature Preview')
  const [selectedFont, setSelectedFont] = useState<string>('Segoe Script')
  const fonts = [
    'Segoe Script',
    'Segoe Print',
    'Comic Sans MS',
    'Guttman Yad',
    'Lucida Handwriting',
    'Brush Script MT',
    'Arial',
    'Caveat',
    'Dancing Script',
    'Pacifico',
    'Great Vibes',
  ]

  // Step 2 - Upload Tab
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  // Step 2 - Symbol Tab (All symbols rendered in black)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  // Saved Signatures Library
  const [savedLibrary, setSavedLibrary] = useState<string[]>([])
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<string | null>(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Load thumbnail for Step 1
  const { dataUrl: pageDataUrl } = useThumbnail({
    sourceId: page?.sourceId || '',
    pageIndex: page?.sourcePageIndex || 0,
    maxWidth: 1000,
    lazy: false,
    imagePreviewUrl: page?.imagePreviewUrl,
  })

  // Load saved signatures from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SIGNATURES)
      if (stored) {
        setSavedLibrary(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }
  }, [isOpen])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setActiveTab('draw')
      setPlacementBox(null) // Do NOT offer default signature area
      setSelectedLibraryItem(null)
      setUploadedDataUrl(null)
      setSelectedSymbol(null)
      setTypedText('Signature Preview')
      setHasDrawnContent(false)
      setHistory([])
      setSaveSuccessMsg(null)
    }
  }, [isOpen, page?.id])

  // Step 1: Interactive drag-to-draw placement box
  const handlePageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageContainerRef.current) return
    const rect = pageContainerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))

    setDragStartPos({ x, y })
    setIsDrawingBox(true)

    const xP = (x / rect.width) * 100
    const yP = (y / rect.height) * 100
    setPlacementBox({
      xPercent: xP,
      yPercent: yP,
      widthPercent: 0,
      heightPercent: 0,
    })
  }

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingBox || !dragStartPos || !pageContainerRef.current) return
    const rect = pageContainerRef.current.getBoundingClientRect()
    const currentX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))

    const left = Math.min(dragStartPos.x, currentX)
    const top = Math.min(dragStartPos.y, currentY)
    const w = Math.abs(currentX - dragStartPos.x)
    const h = Math.abs(currentY - dragStartPos.y)

    setPlacementBox({
      xPercent: (left / rect.width) * 100,
      yPercent: (top / rect.height) * 100,
      widthPercent: (w / rect.width) * 100,
      heightPercent: (h / rect.height) * 100,
    })
  }

  const handlePageMouseUp = () => {
    if (isDrawingBox) {
      setIsDrawingBox(false)
      setDragStartPos(null)
      // Ensure minimum box size if user created a tiny drag
      setPlacementBox((prev) => {
        if (!prev) return null
        if (prev.widthPercent < 3 && prev.heightPercent < 3) {
          // If clicked without dragging, create a standard signature box centered at click
          return {
            xPercent: Math.max(0, Math.min(70, prev.xPercent - 15)),
            yPercent: Math.max(0, Math.min(85, prev.yPercent - 5)),
            widthPercent: 30,
            heightPercent: 12,
          }
        }
        return {
          ...prev,
          widthPercent: Math.max(6, prev.widthPercent),
          heightPercent: Math.max(3, prev.heightPercent),
        }
      })
    }
  }

  // Step 2 Canvas Drawing Logic
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const saveCanvasState = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory((prev) => [...prev.slice(-15), currentData])
  }

  const startPainting = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    saveCanvasState()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = penThickness * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#000000' // Pure Black
    setIsPainting(true)
    setSelectedLibraryItem(null)
    setHasDrawnContent(true)
  }

  const paint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopPainting = () => {
    if (isPainting) {
      setIsPainting(false)
    }
  }

  const handleUndo = () => {
    const canvas = drawCanvasRef.current
    if (!canvas || history.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const previous = history[history.length - 1]
    ctx.putImageData(previous, 0, 0)
    setHistory((prev) => prev.slice(0, -1))
    if (history.length === 1) {
      setHasDrawnContent(false)
    }
  }

  const handleClearCanvas = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHistory([])
    setHasDrawnContent(false)
    setSelectedLibraryItem(null)
  }

  // Generate transparent PNG from Typed Text (Black)
  const generateTypedDataUrl = useCallback((): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = `64px "${selectedFont}", cursive, sans-serif`
    ctx.fillStyle = '#000000' // Black
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedText || 'Signature', canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL('image/png')
  }, [typedText, selectedFont])

  // Generate transparent PNG from Draw Canvas (Black)
  const generateDrawDataUrl = (): string => {
    const canvas = drawCanvasRef.current
    if (!canvas) return ''
    return canvas.toDataURL('image/png')
  }

  // Generate transparent PNG from Symbol (Black)
  const generateSymbolDataUrl = (symbolKey: string): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000' // Black
    ctx.fillStyle = '#000000' // Black

    if (symbolKey === 'checkmark') {
      ctx.lineWidth = 14
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(60, 80)
      ctx.lineTo(110, 120)
      ctx.lineTo(240, 30)
      ctx.stroke()
    } else if (symbolKey === 'cross') {
      ctx.lineWidth = 14
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(70, 35)
      ctx.lineTo(230, 115)
      ctx.moveTo(230, 35)
      ctx.lineTo(70, 115)
      ctx.stroke()
    } else if (symbolKey === 'star') {
      ctx.lineWidth = 4
      ctx.beginPath()
      const cx = 150, cy = 75, outer = 55, inner = 25, points = 5
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner
        const a = (i * Math.PI) / points - Math.PI / 2
        const x = cx + r * Math.cos(a)
        const y = cy + r * Math.sin(a)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (symbolKey.startsWith('stamp_')) {
      const text = symbolKey.replace('stamp_', '')
      ctx.lineWidth = 8
      ctx.strokeRect(20, 20, 260, 110)
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 150, 75)
    }

    return canvas.toDataURL('image/png')
  }

  // Handle Image Upload with auto background transparency and bounded dimensions
  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      if (!src) return

      const img = new Image()
      img.onload = () => {
        // Bound dimensions to prevent exceeding localStorage quota
        const maxW = 600
        const maxH = 300
        let w = img.width
        let h = img.height
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0, w, h)
        const imgData = ctx.getImageData(0, 0, w, h)
        const data = imgData.data

        // Auto background transparency: remove pure and near-white pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          if (r > 220 && g > 220 && b > 220) {
            data[i + 3] = 0 // transparent
          }
        }
        ctx.putImageData(imgData, 0, 0)
        const transparentDataUrl = canvas.toDataURL('image/png')
        setUploadedDataUrl(transparentDataUrl)
        setSelectedLibraryItem(null)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // Save Current Signature to Library (Persistent via localStorage)
  const handleSaveToLibrary = () => {
    let currentDataUrl = ''
    if (selectedLibraryItem) {
      currentDataUrl = selectedLibraryItem
    } else if (activeTab === 'draw') {
      currentDataUrl = generateDrawDataUrl()
    } else if (activeTab === 'type') {
      currentDataUrl = generateTypedDataUrl()
    } else if (activeTab === 'upload' && uploadedDataUrl) {
      currentDataUrl = uploadedDataUrl
    } else if (activeTab === 'symbol' && selectedSymbol) {
      currentDataUrl = generateSymbolDataUrl(selectedSymbol)
    }

    if (!currentDataUrl) return

    const updated = [currentDataUrl, ...savedLibrary.filter((s) => s !== currentDataUrl).slice(0, 9)]
    setSavedLibrary(updated)
    setSelectedLibraryItem(currentDataUrl)

    try {
      localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated))
      setSaveSuccessMsg('Signature saved to library!')
      setTimeout(() => setSaveSuccessMsg(null), 2500)
    } catch (err) {
      console.warn('Could not persist signature to localStorage:', err)
    }
  }

  const handleDeleteSaved = (e: React.MouseEvent, itemDataUrl: string) => {
    e.stopPropagation()
    const updated = savedLibrary.filter((s) => s !== itemDataUrl)
    setSavedLibrary(updated)
    if (selectedLibraryItem === itemDataUrl) {
      setSelectedLibraryItem(null)
    }
    try {
      localStorage.setItem(STORAGE_KEY_SIGNATURES, JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  // Apply Signature to Page
  const handleApplySignature = () => {
    if (!page || !placementBox) return

    let finalDataUrl = ''
    if (selectedLibraryItem) {
      finalDataUrl = selectedLibraryItem
    } else if (activeTab === 'draw') {
      finalDataUrl = generateDrawDataUrl()
    } else if (activeTab === 'type') {
      finalDataUrl = generateTypedDataUrl()
    } else if (activeTab === 'upload' && uploadedDataUrl) {
      finalDataUrl = uploadedDataUrl
    } else if (activeTab === 'symbol' && selectedSymbol) {
      finalDataUrl = generateSymbolDataUrl(selectedSymbol)
    }

    if (!finalDataUrl) return

    onApplySignature(page.id, {
      imageDataUrl: finalDataUrl,
      xPercent: placementBox.xPercent,
      yPercent: placementBox.yPercent,
      widthPercent: placementBox.widthPercent,
      heightPercent: placementBox.heightPercent,
    })

    onClose()
  }

  if (!isOpen || !page) return null

  const isBoxValid =
    placementBox !== null &&
    placementBox.widthPercent >= 3 &&
    placementBox.heightPercent >= 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0b111e] border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>
                  {step === 1
                    ? 'Step 1 of 2: Draw Signature Placement Box'
                    : 'Step 2 of 2: Create or Choose Signature'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 1
                  ? 'Click and drag your mouse on the page preview to specify where to place the signature.'
                  : 'Draw, type, upload an image, or choose a symbol / saved signature.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: DRAW SIGNATURE PLACEMENT BOX */}
        {step === 1 && (
          <div className="space-y-3">
            {/* Guide hint when no box has been drawn yet */}
            {!placementBox && (
              <div className="flex items-center justify-center space-x-2 py-2 px-3 bg-sky-950/40 border border-sky-800/50 rounded-xl text-sky-300 text-xs font-medium">
                <MousePointerClick className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
                <span>Click and drag on the page preview below to draw your signature placement box.</span>
              </div>
            )}

            <div className="flex items-center justify-center bg-[#070b12] rounded-xl p-4 border border-slate-800 overflow-hidden min-h-[460px] max-h-[560px]">
              <div
                ref={pageContainerRef}
                onMouseDown={handlePageMouseDown}
                onMouseMove={handlePageMouseMove}
                onMouseUp={handlePageMouseUp}
                className="relative select-none cursor-crosshair bg-white shadow-2xl rounded border border-slate-300 max-h-[500px] w-auto inline-block"
              >
                {pageDataUrl && (
                  <img
                    src={pageDataUrl}
                    alt="Page preview"
                    className="max-h-[500px] w-auto max-w-full block pointer-events-none rounded"
                  />
                )}

                {/* Placement Box Overlay - Only shown when user draws it */}
                {placementBox && placementBox.widthPercent > 0 && placementBox.heightPercent > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${placementBox.xPercent}%`,
                      top: `${placementBox.yPercent}%`,
                      width: `${placementBox.widthPercent}%`,
                      height: `${placementBox.heightPercent}%`,
                    }}
                    className="border-2 border-[#0284c7] bg-[#0284c7]/20 rounded flex items-center justify-center pointer-events-none shadow-md backdrop-blur-[0.5px]"
                  >
                    <span className="text-[11px] font-bold text-sky-200 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-600/60 shadow">
                      Signature Area
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CREATE OR CHOOSE SIGNATURE */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 4 Tabs: Draw | Type | Upload | Symbol */}
            <div className="flex items-center space-x-1 border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('draw')
                  setSelectedLibraryItem(null)
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'draw'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Draw</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('type')
                  setSelectedLibraryItem(null)
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'type'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Type</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload')
                  setSelectedLibraryItem(null)
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('symbol')
                  setSelectedLibraryItem(null)
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'symbol'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>Symbol</span>
              </button>
            </div>

            {/* TAB 1: DRAW */}
            {activeTab === 'draw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-end space-x-3 text-xs text-slate-300">
                  <span>Thickness:</span>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={penThickness}
                    onChange={(e) => setPenThickness(parseInt(e.target.value, 10))}
                    className="w-32 accent-sky-500 cursor-pointer"
                  />
                  <span className="w-6 font-mono text-sky-400">{penThickness}px</span>
                </div>

                <div className="relative bg-white rounded-xl border border-slate-300 shadow-inner h-44 flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={drawCanvasRef}
                    width={800}
                    height={220}
                    onMouseDown={startPainting}
                    onMouseMove={paint}
                    onMouseUp={stopPainting}
                    onMouseLeave={stopPainting}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  {!hasDrawnContent && (
                    <div className="absolute pointer-events-none text-slate-400 text-xs font-medium">
                      Draw your signature here with mouse or pen
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center space-x-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow transition-colors flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow transition-colors flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={!hasDrawnContent}
                    className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-950/40 transition-colors flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TYPE */}
            {activeTab === 'type' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Type your signature</label>
                  <input
                    type="text"
                    value={typedText}
                    onFocus={() => {
                      if (typedText === 'Signature Preview') {
                        setTypedText('')
                      }
                    }}
                    onChange={(e) => {
                      setTypedText(e.target.value)
                      setSelectedLibraryItem(null)
                    }}
                    placeholder="Type your signature"
                    className="w-full bg-[#0c131c] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                {/* Font Selector Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fonts.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setSelectedFont(f)
                        setSelectedLibraryItem(null)
                      }}
                      style={{ fontFamily: f }}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        selectedFont === f
                          ? 'bg-[#0284c7] text-white font-bold ring-1 ring-sky-400'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Large White Preview Box */}
                <div className="bg-white rounded-xl border border-slate-300 shadow-inner h-32 flex items-center justify-center p-4">
                  <span
                    style={{ fontFamily: `"${selectedFont}", cursive, sans-serif` }}
                    className="text-3xl text-black select-none"
                  >
                    {typedText || 'Signature Preview'}
                  </span>
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={!typedText.trim()}
                    className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-950/40 transition-colors flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/bmp,.png,.jpg,.jpeg,.bmp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0])
                    }
                  }}
                />

                <div
                  onClick={() => uploadInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageUpload(e.dataTransfer.files[0])
                    }
                  }}
                  className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 h-44 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors shadow-inner"
                >
                  {uploadedDataUrl ? (
                    <img
                      src={uploadedDataUrl}
                      alt="Uploaded signature"
                      className="max-h-36 max-w-full object-contain"
                    />
                  ) : (
                    <div className="space-y-2 text-slate-500">
                      <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                      <div className="text-xs font-bold text-slate-700">
                        Drag & drop signature image here or click to choose
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Supports PNG, JPG, BMP. Auto background transparency.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center space-x-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="px-4 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center space-x-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose Image File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={!uploadedDataUrl}
                    className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SYMBOL (All Symbols Black) */}
            {activeTab === 'symbol' && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-300">Choose a symbol or stamp (Black):</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Checkmark (Black) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSymbol('checkmark')
                      setSelectedLibraryItem(null)
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                      selectedSymbol === 'checkmark'
                        ? 'border-sky-500 bg-slate-800 ring-2 ring-sky-400 text-white'
                        : 'border-slate-800 bg-[#0c131c] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Check className="w-8 h-8 text-slate-100 stroke-[3]" />
                    <span className="text-xs font-semibold">Checkmark</span>
                  </button>

                  {/* Cross (Black) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSymbol('cross')
                      setSelectedLibraryItem(null)
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                      selectedSymbol === 'cross'
                        ? 'border-sky-500 bg-slate-800 ring-2 ring-sky-400 text-white'
                        : 'border-slate-800 bg-[#0c131c] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <XSquare className="w-8 h-8 text-slate-100 stroke-[2]" />
                    <span className="text-xs font-semibold">Cross</span>
                  </button>

                  {/* Star (Black) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSymbol('star')
                      setSelectedLibraryItem(null)
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                      selectedSymbol === 'star'
                        ? 'border-sky-500 bg-slate-800 ring-2 ring-sky-400 text-white'
                        : 'border-slate-800 bg-[#0c131c] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Star className="w-8 h-8 text-slate-100 fill-slate-100" />
                    <span className="text-xs font-semibold">Star</span>
                  </button>

                  {/* Approved (Black) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSymbol('stamp_APPROVED')
                      setSelectedLibraryItem(null)
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                      selectedSymbol === 'stamp_APPROVED'
                        ? 'border-sky-500 bg-slate-800 ring-2 ring-sky-400 text-white'
                        : 'border-slate-800 bg-[#0c131c] text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="px-2 py-1 rounded border-2 border-slate-100 text-slate-100 font-extrabold text-xs tracking-wider">
                      APPROVED
                    </div>
                    <span className="text-xs font-semibold">Stamp</span>
                  </button>
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    disabled={!selectedSymbol}
                    className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </button>
                </div>
              </div>
            )}

            {/* Success toast notification when saved to library */}
            {saveSuccessMsg && (
              <div className="text-center text-xs text-emerald-400 font-semibold animate-in fade-in duration-150">
                {saveSuccessMsg}
              </div>
            )}

            {/* SAVED SIGNATURES LIBRARY */}
            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Saved Signatures Library:</div>
              {savedLibrary.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic p-2 bg-slate-900/40 rounded-lg border border-slate-800/60">
                  No saved signatures yet. Use "Save to Library" above to save signatures for quick reuse.
                </div>
              ) : (
                <div className="flex items-center space-x-3 overflow-x-auto py-1">
                  {savedLibrary.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedLibraryItem(item)}
                      className={`relative bg-white rounded-xl p-2 h-16 w-32 shrink-0 flex items-center justify-center cursor-pointer border transition-all ${
                        selectedLibraryItem === item
                          ? 'border-[#0284c7] ring-2 ring-[#0284c7] shadow-lg shadow-sky-950/50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <img src={item} alt="Saved signature" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSaved(e, item)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow"
                        title="Delete saved signature"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!isBoxValid}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-sky-950/40 transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplySignature}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/40 transition-colors"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Signature</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
