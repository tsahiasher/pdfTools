/**
 * Type of loaded source (PDF or Image).
 */
export type SourceType = 'pdf' | 'image'

/**
 * Represents a loaded source document (PDF or Image).
 * Original bytes are stored pristine in memory for document reconstruction during export.
 */
export interface PdfSource {
  id: string
  name: string
  type: SourceType
  size: number
  pageCount: number
  originalBytes: Uint8Array
  color: string // Distinct visual color accent for source tagging
  loadedAt: number
  imageMimeType?: string
  imagePreviewUrl?: string
}

export interface SignatureOverlay {
  id: string
  imageDataUrl: string // Transparent PNG data URL
  xPercent: number // 0 to 100
  yPercent: number // 0 to 100
  widthPercent: number // 0 to 100
  heightPercent: number // 0 to 100
  placedRotation?: number // Page rotation angle when signature was applied (0, 90, 180, 270)
  createdAt: number
}

export interface FormFieldDescriptor {
  id: string
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'choice' | 'signature'
  rect: [number, number, number, number] // [x1, y1, x2, y2] in PDF coordinates
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  value?: string | boolean
  options?: string[]
  readOnly?: boolean
  multiline?: boolean
  fontSize?: number
}

/**
 * Lightweight descriptor representing an individual page in the document.
 * This is the unit of working document state, decoupled from rendered pixel canvases.
 */
export interface PageDescriptor {
  id: string
  sourceId: string
  sourceType: SourceType
  sourcePageIndex: number // 0-based index within the source PDF (or 0 for single image)
  sourceName: string
  width: number
  height: number
  aspectRatio: number
  rotation: number // 0, 90, 180, 270 degrees
  imagePreviewUrl?: string // For direct image display
  signatures?: SignatureOverlay[] // Applied signature overlays
  formValues?: Record<string, string | boolean> // AcroForm field values
  drawingDataUrl?: string // Transparent PNG drawing & highlighter layer
}

/**
 * Error reported when loading or processing a file.
 */
export interface PdfLoadError {
  id: string
  fileName: string
  message: string
  timestamp: number
}

export interface BookmarkDestinationInfo {
  fitType: string
  left?: number | null
  top?: number | null
  zoom?: number | null
  bottom?: number | null
  right?: number | null
}

export interface BookmarkItem {
  id: string
  title: string
  sourceId: string
  sourcePageIndex: number
  parentId?: string
  children?: BookmarkItem[]
  fitType?: string
  left?: number | null
  top?: number | null
  zoom?: number | null
  bottom?: number | null
  right?: number | null
}

/**
 * State of the working document.
 */
export interface DocumentState {
  sources: Map<string, PdfSource>
  pages: PageDescriptor[]
  selectedPageIds: Set<string>
  isProcessing: boolean
  isExporting: boolean
  includeBookmarks: boolean
  errors: PdfLoadError[]
}

/**
 * Result of loading an individual file.
 */
export type LoadFileResult =
  | { success: true; source: PdfSource; pages: PageDescriptor[] }
  | { success: false; fileName: string; error: string }
