# 💡 pdfTools — Suggested Improvements & Feature Roadmap

This document outlines proposed architecture, performance, feature, and user-experience enhancements for **pdfTools**.

---

## 📋 Table of Contents
1. [Core Architecture & Performance](#1-core-architecture--performance)
2. [Feature Additions & Power Tools](#2-feature-additions--power-tools)
3. [User Experience (UX) & Design Enhancements](#3-user-experience-ux--design-enhancements)
4. [Security, Privacy & Offline Resilience](#4-security-privacy--offline-resilience)
5. [Code Quality & Technical Debt Cleanup](#5-code-quality--technical-debt-cleanup)

---

## 1. Core Architecture & Performance

### ⚡ 1.1 Dedicated Web Worker for PDF & Binary Operations
- **Current State**: PDF merging, splitting, binary encoding (`@cantoo/pdf-lib`), and canvas rendering happen on the main browser thread. For large documents (50+ pages or high-resolution scans), UI interactions like drag-and-drop or modal interactions can stutter.
- **Proposed Improvement**:
  - Spawn an inline Web Worker (`Comlink` or native `Worker`) to handle:
    - `@cantoo/pdf-lib` document assembly and serialization (`doc.save()`).
    - Multi-page image conversions and signature compositing.
    - Large batch splitting and ZIP packaging.
  - Keeps the React UI thread consistently at 60 FPS.

### 💾 1.2 IndexedDB for Persistent Workspace & Unlimited Signature Library
- **Current State**:
  - Signatures are saved in `localStorage` (`STORAGE_KEY_SIGNATURES`), bounded by the browser's 5MB origin quota.
  - Refreshing or closing the tab loses the loaded documents and all in-progress arrangements.
- **Proposed Improvement**:
  - Adopt **IndexedDB** (via lightweight `idb` or native API) to:
    - Store unlimited transparent signatures and custom stamps.
    - Implement **Auto-Save & Session Recovery**: Users can reload or resume their workspace without losing unsaved page arrangements, rotations, or signatures.

### 📦 1.3 Bundle Chunk Splitting & Dynamic Imports
- **Current State**: Production bundle size is ~1.5 MB JS + 1.4 MB worker.
- **Proposed Improvement**:
  - Lazy load heavy modals (`SplitModal`, `SignModal`, `PrintModal`, `ExportImagesModal`) via `React.lazy()` and `Suspense`.
  - Dynamically import `jszip` only when exporting ZIP archives.
  - Reduces initial load bundle to <250 KB for near-instant cold starts.

---

## 2. Feature Additions & Power Tools

### 📦 2.1 Multi-Part ZIP Archiving for Split & Image Exports
- **Current State**: Splitting into 10+ pages or exporting 10+ images triggers 10+ separate sequential browser download prompts, risking popup blocker suppression.
- **Proposed Improvement**:
  - Add a **"Download as ZIP Archive"** checkbox / button in `SplitModal` and `ExportImagesModal`.
  - Use the bundled `jszip` library to archive all generated PDFs or images into a single clean `.zip` file (e.g. `SplitParts.zip` or `ExportedImages.zip`).

### ✍️ 2.2 Batch Apply Signature / Stamp to All or Selected Pages
- **Current State**: Signatures can only be placed on one page at a time.
- **Proposed Improvement**:
  - Add an option in Step 2 of `SignModal`: **"Apply to: Current Page | All Pages | Selected Pages"**.
  - Ideal for signing contracts on every page or applying "APPROVED" / "CONFIDENTIAL" stamps across a document set.

### 🔢 2.3 Page Numbering & Header/Footer Tool
- **Proposed Improvement**:
  - Allow users to overlay dynamic page numbers (e.g. `Page X of Y`, `X / Y`, or Roman numerals `i, ii, iii...`).
  - Customizable position (Bottom Center, Bottom Right, Top Right), font size, margin offset, and start number.

### 🌊 2.4 Text & Image Watermark Overlay
- **Proposed Improvement**:
  - Add a dedicated **Watermark** tool supporting:
    - Diagonal or horizontal semi-transparent text (e.g. `DRAFT`, `CONFIDENTIAL`, `SAMPLE`, `COPY`).
    - Custom opacity (10%–80%), font size, rotation angle (45°), and color.
    - Image logo watermark (e.g. company logo in corner).

### 🗜️ 2.5 Client-Side PDF Compression / Size Optimizer
- **Proposed Improvement**:
  - Offer basic client-side file size reduction:
    - Downscaling embedded high-DPI images (e.g., 300+ DPI scans down to 150 DPI).
    - Converting uncompressed image streams to optimized JPEG/PNG.
    - Stripping unused metadata and duplicate font descriptors.

### 📄 2.6 Blank Page Insertion & Page Duplication
- **Proposed Improvement**:
  - Add quick action buttons:
    - **Duplicate Page**: Creates an exact duplicate descriptor of the selected page.
    - **Insert Blank Page**: Adds a blank white A4/Letter page descriptor at any position.

### 🔒 2.7 Password Encryption & Decryption
- **Proposed Improvement**:
  - **Decryption**: Allow users to enter a password to unlock and import encrypted PDFs directly in-browser.
  - **Encryption**: Add optional password protection (`PDFDocument.encrypt({ userPassword, ownerPassword })`) when exporting merged or split PDFs.

---

## 3. User Experience (UX) & Design Enhancements

### ↩️ 3.1 Multi-Step Undo / Redo History Stack (`Ctrl+Z` / `Ctrl+Y`)
- **Current State**: The app only provides "Revert All", which discards all changes back to initial upload.
- **Proposed Improvement**:
  - Maintain an action history stack (page reorders, rotations, deletions, signatures).
  - Enable standard `Ctrl+Z` (Undo) and `Ctrl+Y` / `Ctrl+Shift+Z` (Redo) keyboard shortcuts and toolbar buttons.

### 🎚️ 3.2 Interactive Placement Box Resize & Move Handles (Sign Modal Step 1)
- **Current State**: Drawing a placement box requires a continuous drag. If slightly off, the user has to re-drag from scratch.
- **Proposed Improvement**:
  - Add 8 interactive resize handles (corners + edges) and drag-to-move capabilities to the placement rectangle, allowing fine-tuned positioning before proceeding to Step 2.

### 🎨 3.3 Signature Ink Color Selection
- **Current State**: Signatures, typed handwriting, and symbols are strictly black (`#000000`).
- **Proposed Improvement**:
  - Add a color palette selector: **Black (`#000000`)**, **Dark Navy (`#002060`)**, **Classic Blue (`#0044cc`)**, and **Dark Gray (`#333333`)**.

### 🔍 3.4 Fullscreen High-Resolution Page Inspector
- **Proposed Improvement**:
  - Double-clicking any page card opens a high-resolution preview modal with interactive pan, zoom (up to 400%), and page navigation to inspect small text or scan details before merging.

### ⌨️ 3.5 Keyboard Accessibility for Page Reordering
- **Proposed Improvement**:
  - Arrow keys to navigate card focus.
  - `Alt + Left/Right Arrow` to shift pages left/right in the sequence without requiring mouse drag.

---

## 4. Security, Privacy & Offline Resilience

### 📴 4.1 100% Offline Bundling for pdf.js CMaps & Fonts
- **Current State**: Font fallback references CDN URLs (`jsdelivr.net`).
- **Proposed Improvement**:
  - Copy `pdfjs-dist/cmaps` and `pdfjs-dist/standard_fonts` into `public/pdfjs/` during build time.
  - Update `workerSrc` and `cMapUrl` to point to relative local paths, ensuring 100% offline functionality without any network requests.

### 🛡️ 4.2 Progressive Web App (PWA) Offline Support
- **Proposed Improvement**:
  - Add a Service Worker (`vite-plugin-pwa`) and Web App Manifest.
  - Allows users to install **pdfTools** as a desktop/mobile standalone app that runs without an internet connection.

---

## 5. Code Quality & Technical Debt Cleanup

### 🧹 5.1 Remove Dead / Legacy Components
- **Action**: Safely remove unused legacy components (`src/components/ActionToolbar.tsx`, `src/components/Header.tsx`, `src/components/SourceList.tsx`).

### 🎨 5.2 Correct HTML Body Default Background
- **Action**: Update `index.html` `<body>` class from `bg-slate-50 text-slate-900` to `bg-[#0a0f18] text-slate-100` to eliminate white flash before React renders.

### 🧪 5.3 Automated Unit & E2E Testing Suite
- **Action**: Introduce Vitest and Playwright tests for:
  - Binary PDF merging and rotation fidelity with `@cantoo/pdf-lib`.
  - Drag-and-drop page sequence calculations.
  - Signature coordinate transformation accuracy on rotated pages.
  - Split range parsing (`1-4, 7, 9-12`).
