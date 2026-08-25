# pdfTools 📄✨

**pdfTools** is a powerful, privacy-first, 100% client-side web application for merging, splitting, editing, signing, reordering, and exporting PDF documents and images with lossless vector fidelity.

No files are ever uploaded to any server. All processing runs directly inside your browser.

---

## 🚀 Key Features (Ordered by Importance)

### 🎨 1. Full-Screen Page Editor & Annotation Studio
A comprehensive, distraction-free document editor (`PageEditorModal.tsx`) available on every page card:
- **Interactive PDF AcroForm Filling**:
  - Automatically detects and fills native PDF text fields, checkboxes, and radio buttons.
  - **Smart Auto-Fit Typography**: Field text automatically scales to match physical box height (~60% of field height) capped at **Medium** to prevent overflow.
  - **Text Size Selector**: Clean toolbar toggle (`Auto`, `Small`, `Medium`, `Large`) with compact `Small` mode for dense forms.
  - **Universal Multiline & <kbd>Enter</kbd> Key Support**: Text boxes with sufficient height, PDF multiline flags, or typed newlines automatically wrap as `<textarea>` elements. Pressing <kbd>Enter</kbd> in any field inserts a newline and upgrades it to multiline.
- **Smart Dual-Mode Text & Area Highlighter**:
  - **Text Selection Mode**: Automatically locks in when dragging starts over text, using a **Geometric Visual Text Line Selection Engine** that continuously highlights words and lines with zero gaps and permanent transparent yellow (`rgba(250, 204, 21, 0.40)`) with `multiply` blend mode.
  - **Freehand Mode**: Draws continuous, smooth quadratic spline ribbons on a dedicated draft canvas with constant opacity (no alpha darkening over time).
  - **Rectangle Mode**: Switches cursor to a cross pointer (`+`) and draws clean rectangular highlighted regions.
  - **Quick Mode Toggle**: Clean toolbar buttons with dedicated icons (**Freehand** with `<PenLine />` and **Rectangle** with `<Square />`).
- **Freehand Pen Drawing**:
  - Smooth black ink drawing with width slider (1px–12px) and multi-step undo history.
- **Single Neutral Circular Eraser**:
  - Adjustable size slider (3px–60px, default 10px) with a neutral dark circular follower overlay (`cursor: 'none'`) and one-click `Clear All Drawings`.
- **In-Place Signature Placement**:
  - Drag an exact rectangular bounding box anywhere on the page to place signatures, initials, or stamps.
- **Full-Range Zoom & Viewport Traversal**:
  - 40% to 250% zoom scale with a Fit button and fluid scrolling across top, bottom, left, and right.
- **Multi-Edit State Persistence & Live Thumbnail Sync**:
  - Deep-cloned state and cache invalidation ensure all filled form fields, highlighters, drawings, and signatures composite live into the main grid thumbnails immediately on save.

---

### 🔀 2. Merge & Visual Page Arrangement
- **Multi-Format Ingestion**: Import multiple PDF documents and image files (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`).
- **Full-Card Desktop Dragging & Touch Handles**:
  - **Desktop**: Click and drag anywhere on any page card to smoothly lift and rearrange pages with `framer-motion` spring physics.
  - **Mobile/Touch**: Touch-pan vertical scrolling on the card body with a dedicated 6-dot grip handle (`GripVertical`) for touch reordering.
- **Instant Lifted Card Preview**: Lifted floating cards render all annotations, highlighters, drawings, and signatures synchronously without loading delays.
- **Multi-Page Selection & Batch Actions**: Select individual pages or Shift-click page ranges for batch rotation (90° clockwise/counter-clockwise), batch deletion, and batch duplicate.
- **Source Files Sidebar**: Manage imported files with sequence badges, page counts, file sizes, reordering chevrons, and source deletion.
- **Mobile Responsive Drawer & Sticky Bottom Action Bar**: Seamless slide-over files drawer and thumb-friendly bottom action bar on mobile devices (<1024px).
- **Flexible 5-Level Zoom**: Dynamic grid slider scaling from compact multi-column views to large detailed previews.

---

### ✂️ 3. Split PDF Documents
- **Custom Page Ranges**: Define arbitrary output segments by page numbers or ranges (e.g. `1-3, 5, 7-10`).
- **Quick Split Presets**:
  - **Split Into Single Pages**: Generates an individual PDF for every single page.
  - **Split Every N Pages**: Partitions the document into equal chunks of $N$ pages.
  - **Split Even & Odd Pages**: Generates two separate files (`Odd_Pages.pdf` and `Even_Pages.pdf`) in one click.
  - **Odd Pages Only / Even Pages Only**: Quick single-click extraction presets.
  - **Split Selected Pages Only**: Restricts splitting strictly to currently selected items.
- **Download Options**: Download individual PDF files or packaged as a single `.zip` archive.

---

### ✍️ 4. Digital Signatures, Stamps & Relative Rotation
- **4 Signature Input Methods** (`SignatureDialog.tsx` & `SignModal.tsx`):
  1. **Draw**: Smooth freehand drawing canvas with stroke width slider, undo, and clear controls.
  2. **Type**: Cursive and handwriting typography selector (Segoe Script, Segoe Print, Comic Sans MS, Guttman Yad, Lucida Handwriting, Brush Script MT, Arial, Caveat, Dancing Script, Pacifico, Great Vibes).
  3. **Upload**: Drag-and-drop or select an image with automated white background transparency filtering.
  4. **Symbols & Stamps**: Crisp vector stamps (Checkmark ✔, Cross ✖, Star ★, and APPROVED badge).
- **Persistent Saved Signatures Library**: Store created signatures in browser local storage for 1-click reuse across documents and sessions.
- **Intrinsic Rotation Anchoring**: Signatures placed on rotated pages anchor to the page's intrinsic coordinate space, rotating together with the document across UI previews, vector PDF export, image export, and print.

---

### 📑 5. Bookmarks & PDF Outline Hierarchy Preservation
- **Preserve Table of Contents**: Optional **Bookmarks** checkbox on export.
- Extracts document outline hierarchies using `pdfjs-dist` and reconstructs linked PDF outlines (`/Outlines` catalog with `/Fit`, `/XYZ`, `/FitH`, etc.) mapped losslessly to the new page positions.

---

### 🖼️ 6. Lossless Vector PDF & High-Resolution Image Export
- **Lossless Vector PDF Assembly**: Reconstructs merged PDFs using `@cantoo/pdf-lib` via `copyPages()` directly from original bytes, preserving 300+ DPI scans, vector text, and embedded fonts without rasterization.
- **Export Images** (`ExportImagesModal.tsx`): Render and download selected or all document pages as standalone high-resolution `.png` or `.jpg` image files with customizable base filenames.
- **Save Selected**: Export only selected pages as a dedicated PDF.
- **Revert All**: One-click restore to the original uploaded document state and sequence.

---

### 🖨️ 7. Client-Side Print Preview & Settings
- Integrated Print modal (`PrintModal.tsx`) supporting target printer selection, paper sizes (Letter, A4, Legal, etc.), color/grayscale modes, custom page ranges, and client-side document printing.

---

## 🔒 Privacy & Architecture

1. **100% Client-Side Privacy**: All parsing, preview rendering, editing, and PDF generation run entirely in the browser's memory sandbox. Zero outbound network requests for document data.
2. **Decoupled Engine Pipeline**:
   - **Preview Engine**: Uses `pdfjs-dist` on off-screen HTML5 `<canvas>` elements for crisp, responsive UI rendering.
   - **Document Engine**: Uses `@cantoo/pdf-lib` for binary PDF reconstruction, embedding drawings, form fields, signatures, and outlines losslessly without raster degradation.
3. **Offline Assets**: Character maps (`public/cmaps/`) and standard fallback fonts (`public/standard_fonts/`) are bundled locally for complete offline reliability.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **PDF Engines**:
  - `@cantoo/pdf-lib` (Binary PDF assembly, form field population, signature embedding, and outline generation)
  - `pdfjs-dist` (Client-side rendering, text extraction, AcroForm detection, and bookmark extraction)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Archive Utilities**: `jszip`

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/tsahiasher/pdfTools.git
cd pdfTools

# Install dependencies
npm install
```

### Development Server

```bash
# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

The compiled bundle is generated in the `dist/` directory.

### Deployment

Deploy to **Firebase Hosting**:

```bash
# Build and deploy
npm run build
npx firebase-tools deploy --only hosting --project safepdftools
```

---

## 📁 Project Structure

```
pdfTools/
├── docs/                           # Documentation, devlogs, decisions & progress
│   ├── DECISIONS.md
│   └── PROGRESS.md
├── public/                         # Static assets, cMaps & standard fonts
│   ├── cmaps/
│   └── standard_fonts/
├── src/
│   ├── components/                 # React UI components
│   │   ├── TopNavbar.tsx           # Main application navigation & export triggers
│   │   ├── SidebarSources.tsx      # Desktop source documents sidebar
│   │   ├── MobileSourcesDrawer.tsx # Mobile slide-over source files drawer
│   │   ├── MobileBottomBar.tsx     # Mobile sticky thumb action bar
│   │   ├── GridSubHeader.tsx       # Selection metrics, batch actions & zoom slider
│   │   ├── PageGrid.tsx            # Spring-animated drag-and-drop page grid
│   │   ├── PageCard.tsx            # Thumbnail preview, rotation, delete & edit actions
│   │   ├── PageEditorModal.tsx     # Full-screen page editor & annotation studio
│   │   ├── SignatureDialog.tsx     # In-place signature creation modal
│   │   ├── Dropzone.tsx            # Multi-format file upload zone
│   │   ├── SplitModal.tsx          # Split PDF modal with presets & ranges
│   │   ├── ExportImagesModal.tsx   # PNG / JPG image export modal
│   │   ├── PrintModal.tsx          # Client-side print preview & options
│   │   ├── ClearWarningModal.tsx   # Clear confirmation warning
│   │   └── ReorderFilesWarningModal.tsx
│   ├── coordinator/                # PdfCoordinator state orchestrator
│   │   └── PdfCoordinator.ts
│   ├── domain/                     # TypeScript domain models & interfaces
│   │   └── types.ts
│   ├── hooks/                      # Custom React hooks
│   │   ├── usePdfCoordinator.ts
│   │   └── useThumbnail.ts
│   ├── lib/                        # PDF.js worker setup & signature utilities
│   │   ├── pdfWorker.ts
│   │   └── signatureUtils.ts
│   ├── managers/                   # Domain managers
│   │   ├── PdfSourceManager.ts     # Document parsing, form fields & text blocks
│   │   ├── ThumbnailRenderManager.ts # Annotation compositing & canvas rendering
│   │   └── PdfExportManager.ts     # Lossless PDF assembly, forms, signatures & bookmarks
│   ├── App.tsx                     # Main application layout & state wiring
│   ├── main.tsx                    # React application entry point
│   └── index.css                   # Global CSS & design tokens
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

This project is released under the [MIT License](LICENSE).
