# pdfTools 📄✨

**pdfTools** is a powerful, privacy-first, 100% client-side browser application for merging, splitting, signing, reordering, and exporting PDF documents and images with lossless vector fidelity.

No files are ever uploaded to any server. Everything is processed directly in your web browser.

---

## 🚀 Key Features

### 🔀 1. Merge & Reorder Pages
- **Multi-Format Ingestion**: Import multiple PDF documents and image files (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`).
- **Interactive Drag & Drop**: Smooth, real-time reordering of single pages or multi-page selections with live positional previews.
- **Source Files Sidebar**: Manage loaded documents with sequence badges, page counts, file sizes, reordering chevrons, and source deletion.
- **Flexible Zoom**: Dynamic 5-level grid slider (from compact multi-column views to large detailed previews).

### ✂️ 2. Split PDF Documents
- **Custom Page Ranges**: Define arbitrary output segments by page numbers or ranges (e.g. `1-3, 5, 7-10`).
- **Quick Split Presets**:
  - **Split Into Single Pages**: Automatically generates an individual PDF for every page.
  - **Split Every N Pages**: Partitions the document into chunks of $N$ pages.
  - **Split Even & Odd Pages**: Generates two separate files (`Odd_Pages.pdf` and `Even_Pages.pdf`) in one click.
  - **Odd Pages Only** / **Even Pages Only**: Quick single-click presets.
  - **Split Selected Pages Only**: Restricts splitting to currently selected items.

### ✍️ 3. Digital Signatures & Stamps
- **Two-Step Signing Workflow**:
  - **Step 1 — Placement**: Click and drag across the high-resolution page canvas to define the exact rectangular signature position.
  - **Step 2 — Signature Creation**: Choose between 4 distinct input methods:
    1. **Draw**: Smooth freehand drawing canvas with adjustable stroke thickness slider (1–8px), undo, and clear controls.
    2. **Type**: Cursive and handwriting typography selector (Segoe Script, Segoe Print, Comic Sans MS, Guttman Yad, Lucida Handwriting, Brush Script MT, Arial, Caveat, Dancing Script, Pacifico, Great Vibes).
    3. **Upload**: Drag-and-drop or select an image with automated white background transparency filtering.
    4. **Symbols & Stamps**: Crisp black symbols (Checkmark ✔, Cross ✖, Star ★, and APPROVED stamp badge).
- **Saved Signatures Library**: Store signatures in local storage for 1-click reuse across documents and sessions.

### 📑 4. Bookmarks & PDF Outlines Preservation
- **Preserve Table of Contents**: Optional **Bookmarks** checkbox next to the save action.
- Extracts document outline hierarchies using `pdf.js` and automatically reconstructs linked PDF outlines (`/Outlines` catalog with `/Fit`, `/XYZ`, `/FitH`, etc.) mapped to the new page positions.

### 🖼️ 5. Image & Partial Export
- **Export Images**: Render and download selected or all document pages as standalone high-resolution `.png` or `.jpg` image files.
- **Save Selected**: Export only selected pages as a dedicated PDF.
- **Revert All**: One-click restore to original uploaded document state and sequence.

### 🖨️ 6. Print Preview & Settings
- Integrated Print modal supporting target printer options, paper sizes, color/grayscale modes, custom page ranges, and client-side document printing.

---

## 🔒 Privacy & Architecture

1. **100% Client-Side**: All rendering and processing runs locally inside the browser's JavaScript sandbox.
2. **Decoupled Architecture**:
   - **Rendering Engine**: Uses `pdfjs-dist` on off-screen HTML5 `<canvas>` elements for crisp UI thumbnails.
   - **Document Engine**: Uses `@cantoo/pdf-lib` for binary PDF reconstruction, copying original objects and vector streams losslessly via `copyPages()` without raster degradation.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **PDF Engines**:
  - `@cantoo/pdf-lib` (Binary PDF manipulation, merging, signature embedding, and outline generation)
  - `pdfjs-dist` (Client-side rendering, thumbnail previewing, and bookmark extraction)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

```bash
# Clone the repository
git clone <repository-url>
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
# Build for production
npm run build

# Preview production build locally
npm run preview
```

The compiled production bundle is generated in the `dist/` folder, ready for static web hosting (e.g. Firebase Hosting, Cloudflare Pages, Vercel, or GitHub Pages).

---

## 📁 Project Structure

```
pdfTools/
├── docs/                   # Devlogs, progress records, and architectural decisions
│   ├── DECISIONS.md
│   └── PROGRESS.md
├── public/                 # Static assets and worker files
├── src/
│   ├── components/         # Modular React UI components
│   │   ├── TopNavbar.tsx           # Main application header and export triggers
│   │   ├── SidebarSources.tsx      # Source documents sidebar
│   │   ├── GridSubHeader.tsx       # Selection stats, batch actions & zoom
│   │   ├── PageGrid.tsx            # Drag-and-drop page card layout
│   │   ├── PageCard.tsx            # Thumbnail rendering, rotation & sign actions
│   │   ├── Dropzone.tsx            # File upload drag-and-drop zone
│   │   ├── SplitModal.tsx          # Split PDF Document modal
│   │   ├── SignModal.tsx           # Two-step digital signature modal
│   │   ├── ExportImagesModal.tsx   # PNG/JPG image export dialog
│   │   ├── PrintModal.tsx          # Print preview and settings
│   │   └── ClearWarningModal.tsx   # Clear confirmation warning
│   ├── coordinator/        # PdfCoordinator state orchestrator
│   ├── domain/             # TypeScript domain interfaces and types
│   ├── hooks/              # Custom React hooks (usePdfCoordinator, useThumbnail)
│   ├── lib/                # PDF.js worker setup and canvas utilities
│   ├── managers/           # Core domain managers (Source, Thumbnail, Export)
│   │   ├── PdfSourceManager.ts     # Document parsing and bookmark extraction
│   │   ├── ThumbnailRenderManager.ts # Lazy canvas rendering
│   │   └── PdfExportManager.ts     # PDF assembly, outlines and signing
│   ├── App.tsx             # Main view composition
│   └── index.css           # Design tokens and styling
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

This project is released under the [MIT License](LICENSE).
