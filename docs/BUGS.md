# 🐛 pdfTools — Bug Audit & Issue Log (All Resolved ✅)

This document lists all identified bugs, edge cases, and functional defects in the **pdfTools** codebase. **All 12 issues have been resolved, verified with unit tests & production build, and are live for interactive testing.**

---

## 📋 Table of Contents
1. [High Severity: Image Export Crash on Rotated Images or JPG Format](#1-high-severity-image-export-crash-on-rotated-images-or-jpg-format)
2. [High Severity: Digital Signatures & Stamps Missing from Exported Images](#2-high-severity-digital-signatures--stamps-missing-from-exported-images)
3. [High Severity: Digital Signatures Missing from Print Output & Print Preview](#3-high-severity-digital-signatures-missing-from-print-output--print-preview)
4. [Medium Severity: Signatures Broken on Rotated Pages in UI and PDF Export](#4-medium-severity-signatures-broken-on-rotated-pages-in-ui-and-pdf-export)
5. [Medium Severity: Split PDF Multi-Part Export Triggering Browser Download Blocking](#5-medium-severity-split-pdf-multi-part-export-triggering-browser-download-blocking)
6. [Medium Severity: External CDN Network Requests Violate Offline/Privacy Model](#6-medium-severity-external-cdn-network-requests-violate-offlineprivacy-model)
7. [Low Severity: Signature Library LocalStorage Quota Crash Risk](#7-low-severity-signature-library-localstorage-quota-crash-risk)
8. [Low Severity: CSS Print Layout Clipping & Page Overflow on Rotated Pages](#8-low-severity-css-print-layout-clipping--page-overflow-on-rotated-pages)
9. [Low Severity: Bookmark Outline Destination Linkage Broken on Deleted Pages](#9-low-severity-bookmark-outline-destination-linkage-broken-on-deleted-pages)
10. [Low Severity: Inconsistent Filename Extension Stripping in Image Export](#10-low-severity-inconsistent-filename-extension-stripping-in-image-export)
11. [Maintenance: Dead Code / Unused Component Files in Codebase](#11-maintenance-dead-code--unused-component-files-in-codebase)
12. [UI Glitch: Initial White Background Flash on HTML Body](#12-ui-glitch-initial-white-background-flash-on-html-body)

---

## 🔍 Detailed Bug Reports

### 1. High Severity: Image Export Crash on Rotated Images or JPG Format
- **Files Affected**:
  - [`src/coordinator/PdfCoordinator.ts`](file:///C:/Zahi/pdfTools/src/coordinator/PdfCoordinator.ts#L574-L583)
  - [`src/managers/ThumbnailRenderManager.ts`](file:///C:/Zahi/pdfTools/src/managers/ThumbnailRenderManager.ts#L138-L167)
- **Symptom**:
  When a user uploads an image file (PNG, JPG, or WebP) and either:
  1. Rotates the page (`rotation !== 0`), OR
  2. Selects `JPG (*.jpg)` format in the Export Images modal,
  clicking **Download** immediately fails and triggers an error banner: `Failed to export images: Source document src_... not found`.
- **Root Cause**:
  In `PdfCoordinator.exportImages`, the ternary check is:
  ```typescript
  page.sourceType === 'image' && page.imagePreviewUrl && page.rotation === 0 && format === 'png'
    ? fetch(page.imagePreviewUrl).then((r) => r.blob())
    : this.thumbnailManager.renderHighResBlob(...)
  ```
  If `rotation !== 0` or `format === 'jpeg'`, it calls `thumbnailManager.renderHighResBlob(...)`.
  Inside `ThumbnailRenderManager.renderHighResBlob`:
  ```typescript
  const pdfJsDoc = this.sourceManager.getPdfJsDocument(sourceId)
  if (pdfJsDoc) { ... }
  throw new Error(`Source document ${sourceId} not found`)
  ```
  Image sources do not have a `pdfJsDoc` instance because they are loaded directly as images without `pdf.js`. Consequently, `renderHighResBlob` unconditionally throws an error.
- **Fix Recommendation**:
  Update `ThumbnailRenderManager.renderHighResBlob` (or `PdfCoordinator.exportImages`) to handle image sources using an HTML `<canvas>`: load the image source bytes / `imagePreviewUrl`, draw it to canvas with the appropriate rotation transform, and export it via `canvas.toBlob(...)` in the requested format (`image/png` or `image/jpeg`).

---

### 2. High Severity: Digital Signatures & Stamps Missing from Exported Images
- **Files Affected**:
  - [`src/coordinator/PdfCoordinator.ts`](file:///C:/Zahi/pdfTools/src/coordinator/PdfCoordinator.ts#L572-L584)
  - [`src/managers/ThumbnailRenderManager.ts`](file:///C:/Zahi/pdfTools/src/managers/ThumbnailRenderManager.ts#L142-L164)
- **Symptom**:
  If a user signs or stamps a PDF or image page using the Digital Signature tool and subsequently exports that page using **Export Images** (PNG or JPG), the exported image files do NOT include the applied signature or stamp.
- **Root Cause**:
  `renderHighResBlob` in `ThumbnailRenderManager` only renders the PDF page via `page.render({ canvasContext, viewport })`. It does not receive `page.signatures` and never draws the signature overlays onto the export canvas. For image sources, `fetch(page.imagePreviewUrl)` only fetches the raw pristine image without signature composite.
- **Fix Recommendation**:
  Pass `page.signatures` to `renderHighResBlob` and draw the signature image overlays over the rendered canvas using proportional percentage positioning before converting to blob.

---

### 3. High Severity: Digital Signatures Missing from Print Output & Print Preview
- **Files Affected**:
  - [`src/components/PrintModal.tsx`](file:///C:/Zahi/pdfTools/src/components/PrintModal.tsx#L53-L66)
  - [`src/components/PrintModal.tsx`](file:///C:/Zahi/pdfTools/src/components/PrintModal.tsx#L199-L218)
- **Symptom**:
  When a user opens the **Print** dialog or prints the document via browser print, signed pages in the print preview and physical/PDF print output do not show the signatures.
- **Root Cause**:
  1. In `PrintPreviewViewer` (`PrintModal.tsx:53-66`), only the base `<img src={dataUrl} />` is rendered; `page.signatures` are completely omitted.
  2. In `handlePrint` (`PrintModal.tsx:199-218`), the iframe generation creates an `<img>` with the cached thumbnail/preview URL, but never composites or attaches `page.signatures` elements inside `.page-container`.
- **Fix Recommendation**:
  Render the signature overlay elements over the preview in `PrintPreviewViewer` (matching `PageCard.tsx`), and composite signatures in `handlePrint` either by rendering into a canvas or adding absolute-positioned signature images inside `.page-container`.

---

### 4. Medium Severity: Signatures Broken on Rotated Pages in UI and PDF Export
- **Files Affected**:
  - [`src/components/PageCard.tsx`](file:///C:/Zahi/pdfTools/src/components/PageCard.tsx#L127-L152)
  - [`src/components/SignModal.tsx`](file:///C:/Zahi/pdfTools/src/components/SignModal.tsx#L547-L554)
  - [`src/managers/PdfExportManager.ts`](file:///C:/Zahi/pdfTools/src/managers/PdfExportManager.ts#L355-L388)
- **Symptom**:
  1. In the page grid, when rotating a page (90°, 180°, 270°), the background thumbnail rotates, but the signature overlays remain unrotated and visually detached from their intended page location.
  2. In `SignModal`, Step 1 displays the page thumbnail unrotated, ignoring any rotation already applied to the page in the grid.
  3. In PDF export (`PdfExportManager`), `embedSignaturesOnPage` draws signatures using fixed $(x, y)$ coordinates calculated from unrotated page dimensions (`pdfPage.getSize()`), ignoring the page's intrinsic rotation or user-specified rotation, resulting in rotated/misplaced signatures in the exported PDF.
- **Root Cause**:
  - `PageCard.tsx`: The rotation CSS transform is applied only to the `<img>` element rather than the container enclosing both the thumbnail image and signature overlays.
  - `SignModal.tsx`: Step 1 does not apply `page.rotation` to the preview canvas/image.
  - `PdfExportManager.ts`: `pdfPage.drawImage` operates in the unrotated page coordinate space, without transforming signature coordinates by `finalRotation`.
- **Fix Recommendation**:
  1. Wrap both the page image and signature overlays in a rotated container in `PageCard.tsx`.
  2. Pass `page.rotation` to `SignModal` and apply it to the placement preview.
  3. Transform signature coordinates and rotation angle in `PdfExportManager.embedSignaturesOnPage` when `page.rotation !== 0` or when the PDF page has an existing `/Rotate` dictionary value.

---

### 5. Medium Severity: Split PDF Multi-Part Export Triggering Browser Download Blocking
- **Files Affected**:
  - [`src/managers/PdfExportManager.ts`](file:///C:/Zahi/pdfTools/src/managers/PdfExportManager.ts#L174-L177)
  - [`src/components/SplitModal.tsx`](file:///C:/Zahi/pdfTools/src/components/SplitModal.tsx#L265-L274)
- **Symptom**:
  When splitting a multi-page document into many individual files (e.g. "Split Into Single Pages" for a 20+ page PDF), the browser popup/download blocker blocks most downloads after the first few files, or dumps dozens of files into the user's Downloads folder without grouping.
- **Root Cause**:
  `exportSplitPdfParts` fires independent `<a>` download clicks on a `setTimeout` timer ($pIdx \times 250\text{ms}$). Modern browsers (Chrome, Safari, Firefox) restrict programmatic multi-downloads without user interaction per download.
- **Fix Recommendation**:
  Add an option or automatic fallback to bundle multi-part split outputs into a single `.zip` archive using the already-installed `jszip` package when parts count $> 2$.

---

### 6. Medium Severity: External CDN Network Requests Violate Offline/Privacy Model
- **Files Affected**:
  - [`src/managers/PdfSourceManager.ts`](file:///C:/Zahi/pdfTools/src/managers/PdfSourceManager.ts#L205-L207)
- **Symptom**:
  When loading certain PDFs with external CMap font encodings or standard fonts, `pdf.js` attempts outbound network requests to `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/` and `standard_fonts/`.
  In offline environments or corporate air-gapped networks, this fails or causes font rendering artifacts, violating Decision #1 ("Zero outbound network requests").
- **Root Cause**:
  Hardcoded CDN URLs in `pdfjsLib.getDocument(...)`.
- **Fix Recommendation**:
  Bundle `cmaps/` and `standard_fonts/` locally in Vite/public directory or serve them as local assets.

---

### 7. Low Severity: Signature Library LocalStorage Quota Crash Risk
- **Files Affected**:
  - [`src/components/SignModal.tsx`](file:///C:/Zahi/pdfTools/src/components/SignModal.tsx#L436-L442)
- **Symptom**:
  Saving multiple detailed signatures or uploaded transparent PNGs to the Signature Library can exceed the browser's 5MB `localStorage` limit. While trapped in `try/catch`, the signature fails to save silently without notifying the user.
- **Root Cause**:
  Full uncompressed PNG data URLs stored in stringified `localStorage`.
- **Fix Recommendation**:
  Downscale library thumbnails before storing, or migrate signature library persistence to `IndexedDB`.

---

### 8. Low Severity: CSS Print Layout Clipping & Page Overflow on Rotated Pages
- **Files Affected**:
  - [`src/components/PrintModal.tsx`](file:///C:/Zahi/pdfTools/src/components/PrintModal.tsx#L161-L185)
  - [`src/components/PrintModal.tsx`](file:///C:/Zahi/pdfTools/src/components/PrintModal.tsx#L203-L205)
- **Symptom**:
  Pages that have been rotated by 90° or 270° overflow their print page bounds or get cropped when printed via the browser's native print engine.
- **Root Cause**:
  `img.style.transform = rotate(${page.rotation}deg)` in CSS doesn't update the layout bounding box width/height in standard CSS paged media (`@page`), causing rotated aspect ratios to overflow `100vw`/`100vh`.
- **Fix Recommendation**:
  Render the rotated page directly onto an off-screen canvas at exact physical dimensions or calculate bounding box aspect-ratio adjustments for the print stylesheet.

---

### 9. Low Severity: Bookmark Outline Destination Linkage Broken on Deleted Pages
- **Files Affected**:
  - [`src/managers/PdfExportManager.ts`](file:///C:/Zahi/pdfTools/src/managers/PdfExportManager.ts#L249-L255)
- **Symptom**:
  When a user deletes a page that was the target of a PDF outline bookmark, `pages.findIndex(...)` returns `-1`. The bookmark node is created without a `/Dest` key, but its outline tree hierarchy links (`/First`, `/Last`, `/Count`) can become inconsistent or point to bookmarks without destinations.
- **Root Cause**:
  `processLevel` creates an outline dictionary item even when `pageRef` is undefined, as long as it has children, but sibling counting doesn't prune orphaned leaf bookmarks cleanly.
- **Fix Recommendation**:
  Prune or remap bookmark nodes whose target pages have been removed before assembling the outline dictionary.

---

### 10. Low Severity: Inconsistent Filename Extension Stripping in Image Export
- **Files Affected**:
  - [`src/coordinator/PdfCoordinator.ts`](file:///C:/Zahi/pdfTools/src/coordinator/PdfCoordinator.ts#L569)
  - [`src/components/ExportImagesModal.tsx`](file:///C:/Zahi/pdfTools/src/components/ExportImagesModal.tsx#L36)
- **Symptom**:
  If the user types `Contract.final` or `Archive.v2` in the Base File Name field, the regex `replace(/\.[^/.]+$/, '')` strips `.final` or `.v2`, erroneously treating it as a file extension.
- **Root Cause**:
  Aggressive regex stripping of any suffix following a dot.
- **Fix Recommendation**:
  Only strip known file extensions (e.g. `.png`, `.jpg`, `.jpeg`, `.pdf`).

---

### 11. Maintenance: Dead Code / Unused Component Files in Codebase
- **Files Affected**:
  - [`src/components/ActionToolbar.tsx`](file:///C:/Zahi/pdfTools/src/components/ActionToolbar.tsx)
  - [`src/components/Header.tsx`](file:///C:/Zahi/pdfTools/src/components/Header.tsx)
  - [`src/components/SourceList.tsx`](file:///C:/Zahi/pdfTools/src/components/SourceList.tsx)
- **Symptom**:
  These three components are legacy artifacts from earlier iterations and are not imported or rendered anywhere in the application.
- **Fix Recommendation**:
  Clean up or remove these files to reduce codebase clutter and avoid confusion during future maintenance.

---

### 12. UI Glitch: Initial White Background Flash on HTML Body
- **Files Affected**:
  - [`index.html`](file:///C:/Zahi/pdfTools/index.html#L9)
- **Symptom**:
  Before React mounts and Tailwind applies dark mode tokens, the browser flashes a pure white background (`bg-slate-50 text-slate-900` on `<body>`).
- **Fix Recommendation**:
  Change `index.html` `<body>` class to `bg-[#0a0f18] text-slate-100`.
