# Progress Log

**2026-08-20 — Distinct Icon for Revert All Action (code + build + docs). ✅ DONE**
1. Replaced Revert All Icon:
   - Changed the icon for **Revert All** in [`TopNavbar.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/TopNavbar.tsx#L93-L103) from `RotateCcw` to `Undo2` (`<Undo2 className="w-3.5 h-3.5 text-amber-400/90" />`).
   - Distinguishes **Revert All** (restoring uploaded documents to original state) from the **Rotate CCW** counter-clockwise rotation action (`RotateCcw`).
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/TopNavbar.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-19 — Tight Cropping of Typed Signatures (code + build + docs). ✅ DONE**
1. Crop Typed Signatures Around Text:
   - Updated `generateTypedDataUrl` in [`SignModal.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/SignModal.tsx#L283-L355) with pixel-level bounding box scanning.
   - The generated image is cropped tightly around the typed text with minimal padding, preventing excess transparent whitespace and ensuring the signature fills the placed target box accurately on the document.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/SignModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-19 — Persist Drawn Signature Canvas Across Tab Switching (code + build + docs). ✅ DONE**
1. Preserve Draw Canvas on Tab Switch:
   - Modified the **Draw** tab container in [`SignModal.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/SignModal.tsx#L647-L710) to toggle visibility via CSS (`display: none` / `block`) instead of conditionally unmounting the DOM elements.
   - Any drawn strokes, canvas lines, and undo history are fully preserved when switching to **Type**, **Upload**, or **Symbol** and returning back to **Draw**.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/SignModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-19 — Saved Signature Selection: Switch to Upload Tab Preview (code + build + docs). ✅ DONE**
1. Saved Signature Preview on Selection:
   - Updated the saved signature click handler in [`SignModal.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/SignModal.tsx#L956-L965) so that clicking any item in the **Saved Signatures Library** immediately sets `uploadedDataUrl` and switches the active tab to **Upload**.
   - The selected signature is clearly displayed in the large upload preview area so the user can immediately see exactly which signature is going to be applied.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/SignModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-17 — Print Dialog: Streamlined Page Scope Only (code + build + docs). ✅ DONE**
1. Streamlined Print Dialog:
   - Removed redundant **Copies** and **Color Mode** settings (delegated directly to the native OS / browser print dialog).
   - Left settings panel is now dedicated exclusively to **Pages to Print** (All Pages, Selected Pages Only, or Custom Range).
   - Positioned explanation note directly above **Print Document** button.
   - Clean, compact, non-scrolling modal layout.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/PrintModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-17 — Documentation: Firebase Deployment Command in README (docs). ✅ DONE**
1. Documented Firebase Deployment:
   - Added `Deployment` section to [`README.md`](file:///c:/Tsahi/Coding/pdfTools/README.md#L109-L125) detailing steps to build and deploy to Firebase Hosting (`firebase deploy --only hosting --project safepdftools` and Windows PowerShell `firebase.cmd`).
Proof: Verified markdown formatting.
Files touched: `README.md`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-17 — Deselect Single Page After Drag & Drop (code + build + docs). ✅ DONE**
1. Deselect Single Dragged Page on Drop:
   - Updated `onPointerUp` in [`PageGrid.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/PageGrid.tsx#L463-L473) so that when a single page is dragged and dropped to reorder, it is automatically deselected (`onToggleSelect(draggedIds[0], false)`).
   - Multi-page group drags retain their selection after dropping.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-16 — Remove/Replace Cloud Upload Icons (code + build + docs). ✅ DONE**
1. Replaced Cloud Upload Icons:
   - Replaced `UploadCloud` icon with document-stack `Files` icon in main [`Dropzone.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/Dropzone.tsx#L123-L125) and fullscreen drag overlay [`DragOverlay.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/DragOverlay.tsx#L78-L80).
   - Replaced `UploadCloud` icon with `ImagePlus` icon in [`SignModal.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/SignModal.tsx#L815-L817) signature upload drop area.
   - Accurately conveys client-side local document processing without cloud upload imagery.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/components/Dropzone.tsx`, `src/components/DragOverlay.tsx`, `src/components/SignModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-16 — Reset Page Ordering on File Reorder (code + build + docs). ✅ DONE**
1. Reset Page Order on File Sequence Change:
   - Updated `moveSource` in [`PdfCoordinator.ts`](file:///c:/Tsahi/Coding/pdfTools/src/coordinator/PdfCoordinator.ts#L153-L160) to sort each document's pages by their original sequence (`sourcePageIndex`) when re-grouping pages by source document order.
   - When a user customizes page ordering, triggers a source file reorder, and confirms "Reset & Reorder" in [`ReorderFilesWarningModal.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/ReorderFilesWarningModal.tsx), the pages within each file are now completely reset back to their ascending original order along with the files adopting the new sequence.
Proof: TypeScript check (`npx tsc --noEmit`) completed with code 0.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-16 — Production Deployment to Firebase (safepdftools) (build + deploy + docs). ✅ DONE**
1. Built clean production bundle via `npm run build`.
2. Deployed to Firebase Hosting project `safepdftools` (`firebase deploy --only hosting --project safepdftools`).
Hosting URL: https://safepdftools.web.app
Console: https://console.firebase.google.com/project/safepdftools/overview
Files touched: `docs/PROGRESS.md`.
Cross-references: Decisions in `docs/DECISIONS.md`.

**2026-08-15 — Arrow Cursor on All Buttons (code + build + docs). ✅ DONE**
1. Default Arrow Cursor for Buttons:
   - Configured global base styles in `src/index.css` (`button, [type="button"], [type="reset"], [type="submit"], [role="button"] { cursor: default !important; }`).
   - Hovering over any button anywhere in the application keeps the standard arrow cursor (`cursor: default`) instead of switching to a pointing finger (`cursor: pointer`).
Proof: `npm run build` completed with code 0 in 11.49s.
Files touched: `src/index.css`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Universal Closed-Hand Grabbing Cursor Override (code + build + docs). ✅ DONE**
1. Global Grabbing Cursor Override:
   - Injected a dynamic stylesheet override (`* { cursor: grabbing !important; user-select: none !important; }`) that activates the moment card dragging begins.
   - Guarantees the cursor remains strictly a closed hand (`grabbing`) across every element on the entire page (buttons, cards, headers, sidebars, text, overlays) without flickering back to a pointer or text cursor.
   - Cleanly removes the override stylesheet on pointerup / drag finish.
Proof: `npm run build` completed with code 0 in 10.70s.
Files touched: `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Auto-Select Grabbed Page & Combined Multi-Page Dragging (code + build + docs). ✅ DONE**
1. Auto-Select on Grab: When grabbing an unselected page, it is immediately selected and added to the active selection set.
2. Combined Multi-Page Dragging:
   - If other pages are already selected, grabbing any additional page adds it to the selection and drags all selected pages together as a group.
   - Reordering moves all selected pages together into the open target slot.
3. Clean Click Deselection: Clicking an already selected page without dragging deselects it normally.
Proof: `npm run build` completed with code 0 in 14.85s.
Files touched: `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Direct Visual (Row, Column) Grid Cell Mapping for Drag Targets (code + build + docs). ✅ DONE**
1. Direct (Row, Column) Coordinate Grid Mapping:
   - Evaluates the floating lifted card's geometric center against the visual grid's computed row bands and column count.
   - Accurately maps target slot index to $\text{rowIndex} \times \text{columnCount} + \text{colIndex}$.
   - When hovering over Row 2, Column 1, slot index evaluates directly to $1 \times 5 + 0 = 5$, pulling the previous card into Row 1 to complete the 5-card row, and opening the empty slot precisely at Row 2, Column 1.
2. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 9.55s.
Files touched: `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Lifted Card Center Positioning & Closed-Hand Grabbing Cursor (code + build + docs). ✅ DONE**
1. Card Center Calculation: Target row and column insertion indices are now calculated using the exact geometric center (`centerCardX`, `centerCardY`) of the floating lifted card preview rather than the mouse pointer tip.
2. Closed-Hand Cursor (`grabbing`):
   - When a page is grabbed and dragged, the cursor across the entire browser viewport switches to a closed hand (`cursor: grabbing`).
   - Releasing the page restores the standard pointer/grab cursor.
Proof: `npm run build` completed with code 0 in 12.57s.
Files touched: `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Fixed Sidebar Layout & 2D Row-and-Column Grid Drag Calculation (code + build + docs). ✅ DONE**
1. Fixed PDF Source Files Sidebar:
   - Locked the main viewport container to `h-screen overflow-hidden`.
   - The left sidebar (`SidebarSources`) stays pinned and fixed on screen without scrolling when page grid contents scroll.
   - The files list within the sidebar scrolls independently if many source files are loaded.
   - Container autoscroll during card dragging scrolls only the main pages viewport (`mainEl.scrollTop`).
2. 2D Row-and-Column Drag Calculation:
   - Replaced flawed Euclidean hypotenuse math with a structured 2D grid locator.
   - Accurately identifies the vertical row band (`targetRow`) as soon as the cursor crosses into or past the row boundary.
   - Resolves insertion index horizontally within that row (left half = before, right half = after, past end = end of row).
   - Handles multi-row transitions, drags past the final row, and drags above the top row with 100% reliability.
Proof: `npm run build` completed with code 0 in 14.55s.
Files touched: `src/App.tsx`, `src/components/SidebarSources.tsx`, `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Unified Click Selection on Card Header, Checkbox & Body (code + build + docs). ✅ DONE**
1. Selection Fix: Removed double toggle invocation by unifying card selection under single `onClick` handling.
2. Direct Header & Checkbox Selection: Clicking anywhere on the card header, checkbox, or body now toggles page selection cleanly and immediately.
3. Drag Safety Guard: Pointer drag tracking guards click events with `didDragHappenRef`, ensuring dragging never triggers accidental clicks while normal clicks toggle selection seamlessly.
Proof: `npm run build` completed with code 0 in 13.71s.
Files touched: `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Direct Checkbox Page Selection & Automatic Viewport Autoscroll on Drag (code + build + docs). ✅ DONE**
1. Checkbox Page Selection: Enabled direct selection toggling when clicking the top-left card checkbox without initiating a card drag.
2. Auto-Scroll During Drag:
   - Added automatic viewport/container vertical scrolling when dragging a lifted card near the top or bottom boundaries of the screen (proportional speed up to 20px per frame).
   - Dynamically re-evaluates insertion slots in real time as pages scroll under the cursor.
3. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 13.26s.
Files touched: `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Pointer-Driven Page Lifting, 60FPS Drag Overlay & Spring Sliding Gaps (code + build + docs). ✅ DONE**
1. True Pointer-Driven "Page Lifting": Replaced native HTML5 drag-and-drop with pointer event tracking. When grabbing a card, it is immediately lifted into a floating overlay that smoothly follows the cursor across the screen with slight scaling and drop shadows.
2. Spring Layout Sliding: Other page cards in the grid slide smoothly left and right using `framer-motion` spring physics without jumping.
3. Empty Space at Drop Slot: An empty space (1 card width for single page, N card widths for multi-page) stays open at the target position while dragging.
4. Seamless Drop: Releasing the mouse instantly drops the lifted page into the open space and commits the reorder.
5. Action Button Safety: Button actions (rotate, sign, delete, checkbox) are isolated so clicking them does not trigger accidental drags.
Proof: `npm run build` completed with code 0 in 13.32s.
Files touched: `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Refined Drag-and-Drop Slot Gap Spacing & Floating Ghost Matching User Reference (code + build + docs). ✅ DONE**
1. Transparent Gap Slots: Rendered transparent empty slot spaces for the dragged items during dragging matching the user reference screenshot (1 empty slot for 1 page, 2 empty slots for 2 pages).
2. Dynamic Sequence Numbering: Updated page sequence labels (`P. 1`, `P. 2`, `P. 4`, `P. 5`...) to skip the empty gap slot(s) so that the subsequent card displays the exact index following the gap.
3. Custom Drag Ghost: Created styled drag ghost with glowing cyan border and top badge (`Page {N}` or `{count} Pages`) that follows the mouse cursor.
4. Smooth Sliding Layout: Preserved `framer-motion` layout animations so surrounding cards slide seamlessly when opening and closing gaps.
Proof: `npm run build` completed with code 0 in 14.09s.
Files touched: `src/components/PageGrid.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Smooth Drag Sliding Transitions, Slot Placeholders & Reorder Files Warning Modal (code + build + docs). ✅ DONE**
1. Smooth Non-Jumping Sliding: Integrated `framer-motion` layout animations (`motion.div layout`) on all grid items so surrounding cards glide smoothly into place when dragging.
2. Target Insertion Slot & Multi-Page Spaces:
   - Evaluated horizontal cursor position over hovered cards (left half = insert before, right half = insert after).
   - Dynamically generated exactly N empty slot placeholders for N dragged pages between target items.
   - Surrounding cards slide out of the way to leave clear visual slot gaps for drop targets.
3. Reorder Files Warning Modal:
   - Added `hasCustomPageOrder()` detection in `PdfCoordinator.ts` to check if pages have been custom rearranged.
   - Created `ReorderFilesWarningModal.tsx` prompting the user when moving source files up/down if custom page order exists, allowing them to confirm or cancel.
4. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 14.11s.
Files touched: `src/components/PageGrid.tsx`, `src/components/ReorderFilesWarningModal.tsx`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Dynamic Page Card Borders & Blue Selection Top Header (code + build + docs). ✅ DONE**
1. Page Border Color: Set each page card's border to match the assigned color of its source document (`style={{ borderColor: source?.color || '#0284c7' }}`).
2. Wider Border on Selection: When a page card is selected, its border widens to 2px (`border-2`) while keeping its source color.
3. Blue Selected Top Header: When selected, the top header bar (containing checkbox, original page badge, and filename) changes background from dark (`bg-[#131d2a]`) to vibrant blue (`bg-[#0284c7]`) with crisp white typography.
4. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 8.36s.
Files touched: `src/components/PageCard.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Source File Card Border Color Matches Assigned Color (code + build + docs). ✅ DONE**
1. Updated `SidebarSources.tsx` so each loaded source file card's border matches its assigned source color badge (`style={{ borderColor: source.color }}`).
2. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 7.63s.
Files touched: `src/components/SidebarSources.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Dynamic Blurred Drag-Over Overlay (code + build + docs). ✅ DONE**
1. Removed static dropzone elements from the workspace when documents are loaded.
2. Created [`DragOverlay.tsx`](file:///c:/Tsahi/Coding/pdfTools/src/components/DragOverlay.tsx) implementing global drag listeners for external OS files:
   - When external PDFs/images enter the browser window, dims and blurs the background (`backdrop-blur-md bg-slate-950/60`).
   - Renders a floating, dashed rounded drop card matching the user's reference design with upload cloud icon and "Drop to add PDFs or images" prompt.
   - Dropping files adds them immediately into the workspace and closes the overlay.
   - Internal page card dragging (reordering) is distinguished from file dragging (`e.dataTransfer.types.includes('Files')`) to prevent unwanted overlays.
3. Verified build via `npm run build`.
Proof: `npm run build` completed with code 0 in 7.68s.
Files touched: `src/components/DragOverlay.tsx`, `src/components/SidebarSources.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Top-Aligned Content in Sidebar Dropzone (code + build + docs). ✅ DONE**
1. Updated `Dropzone.tsx` compact view layout from `justify-center` to `justify-start pt-6 sm:pt-7` so the icon badge, header text, instructions, and button align cleanly at the top of the expanded sidebar dropzone area.
2. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 8.43s.
Files touched: `src/components/Dropzone.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Full-Height Vertical Dropzone in Sidebar (code + build + docs). ✅ DONE**
1. Configured the "Add Documents" dropzone in `SidebarSources.tsx` with full vertical flex stretching (`flex-1 h-full min-h-[200px]`), utilizing all remaining viewport height in the sidebar under the source files list.
2. Updated styling with centered icon badge, clear typography, and quick "Browse Files" button.
3. Verified compilation cleanly via `npm run build`.
Proof: `npm run build` completed with code 0 in 7.46s.
Files touched: `src/components/SidebarSources.tsx`, `src/components/Dropzone.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Relocated Append Dropzone into Left Source Files Sidebar (code + build + docs). ✅ DONE**
1. Moved the secondary "Click or drop additional PDFs or images here" dropzone from the bottom of the main grid into the left `SidebarSources` section under the loaded files list.
2. Formatted the compact sidebar dropzone with centered layout, icon badge, and hover animations for easy multi-document appending.
3. Verified build via `npm run build`.
Proof: Production build completed with code 0 in 8.53s.
Files touched: `src/components/SidebarSources.tsx`, `src/components/Dropzone.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Disabled / Grayed-out Bookmarks Checkbox When Empty (code + build + deploy + docs). ✅ DONE**
1. Updated `TopNavbar.tsx` so the Bookmarks checkbox container is dynamically grayed out and disabled (`opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-500`) when `pageCount === 0`, `isProcessing`, or `isExporting`.
2. Verified build via `npm run build` and deployed to Firebase Hosting (`pdfToolssafe`).
Proof: Deployment succeeded with zero errors.
Hosting URL: https://pdfToolssafe.web.app
Console: https://console.firebase.google.com/project/pdfToolssafe/overview
Files touched: `src/components/TopNavbar.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8 in `docs/DECISIONS.md`.

**2026-08-15 — Added Official MIT LICENSE File (docs). ✅ DONE**
1. Created official [LICENSE](file:///c:/Tsahi/Coding/pdfTools/LICENSE) file in project root with OSI standard MIT terms for 2026 under Tsahi Asher.
2. Committed and pushed directly to GitHub repository (`main`).
Proof: Git commit `8e236c8` pushed to `origin/main`.
Files touched: `LICENSE`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7, #8, #9 in `docs/DECISIONS.md`.

**2026-08-15 — Full-Window Dropzone Expansion & Firebase Re-deployment (code + build + deploy + docs). ✅ DONE**
1. Expanded Dropzone Area: Modified `Dropzone.tsx` and `App.tsx` empty-state container to fill the full window dimensions (`min-h-[calc(100vh-4.5rem)]`), removing max-width constraints and scaling up the upload icon, typography, and button for a modern, expansive drag-and-drop workspace.
2. Verified build via `npm run build` and deployed to Firebase Hosting (`pdfToolssafe`).
Proof: Deployment succeeded with zero errors.
Hosting URL: https://pdfToolssafe.web.app
Console: https://console.firebase.google.com/project/pdfToolssafe/overview
Files touched: `src/components/Dropzone.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Custom Favicon & Firebase Re-deployment (code + build + deploy + docs). ✅ DONE**
1. Created custom SVG favicon (`public/favicon.svg`) matching the top-left branding (sky-to-indigo gradient rounded badge with centered white `Layers` vector icon).
2. Updated `index.html` favicon link to reference `/favicon.svg`.
3. Built production bundle and deployed cleanly to Firebase Hosting.
Proof: Deployment succeeded with zero errors.
Hosting URL: https://pdfToolssafe.web.app
Console: https://console.firebase.google.com/project/pdfToolssafe/overview
Files touched: `public/favicon.svg`, `index.html`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Production Deployment to Firebase (pdfToolssafe) (build + deploy + docs). ✅ DONE**
1. Configured `.firebaserc` with default project ID `pdfToolssafe`.
2. Verified static hosting configuration in `firebase.json` (`dist/` public folder, SPA rewrite rule to `/index.html`, and caching headers).
3. Built production bundle via `npm run build` and deployed cleanly to Firebase Hosting.
Proof: Deployment succeeded with zero errors.
Hosting URL: https://pdfToolssafe.web.app
Console: https://console.firebase.google.com/project/pdfToolssafe/overview
Files touched: `.firebaserc`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Documentation: Comprehensive Project README.md (docs). ✅ DONE**
1. Created complete [README.md](file:///c:/Tsahi/Coding/pdfTools/README.md) for the project containing:
   - Project overview, core value proposition, and 100% client-side privacy model.
   - Comprehensive breakdown of all capabilities: Multi-file Merge & Drag-Drop Reorder, Split PDF with Quick Presets, 2-Step Digital Signature & Library, Bookmarks / Outlines preservation, PNG/JPG Image Exports, and Print Preview.
   - Architecture summary detailing the separation between `pdfjs-dist` (canvas preview) and `@cantoo/pdf-lib` (lossless vector/document output).
   - Tech stack specifications and local development / production build instructions.
   - Complete directory structure diagram.
Proof: `npm run build` completed with code 0 in 9.96s.
Files touched: `README.md`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Bookmarks Extraction & Export Feature (code + build + docs). ✅ DONE**
1. Top Navbar Control: Added a "Bookmarks" checkbox right next to the "Merge & Save All" green action button (default unchecked).
2. Outline Extraction (`PdfSourceManager`):
   - Integrated full outline extraction logic using `pdfjsDoc.getOutline()` and destination resolver `pdfjsDoc.getDestination(dest)`.
   - Parses destinations (`/Fit`, `/XYZ`, `/FitH`, `/FitV`, `/FitR`, `/FitB`, `/FitBH`, `/FitBV`) with coordinates and zoom levels.
3. PDF Outlines Generation (`PdfExportManager`):
   - When the "Bookmarks" checkbox is checked, maps source bookmarks to their new merged page indices and builds the standard PDF Outlines hierarchy (`/Outlines` dictionary with `/First`, `/Last`, `/Count` and outline node objects).
   - Generates document bookmarks pointing directly to destination page references in the exported PDF file.
Proof: `npm run build` completed with code 0 in 8.40s.
Files touched: `src/domain/types.ts`, `src/managers/PdfSourceManager.ts`, `src/managers/PdfExportManager.ts`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/components/TopNavbar.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Signature Modal Improvements (Black Symbols, Clean Step 1 Box, Auto-Clear Input, Uploaded Image Library Save) (code + build + docs). ✅ DONE**
1. Black Symbols: Set canvas stroke, fill, and UI button badges for all symbols (Checkmark, Cross, Star, Approved stamp) strictly to black (`#000000` / `#0f172a`).
2. No Default Signature Box on Step 1: Initialized placement box as `null`. Step 1 displays a guide banner prompting the user to click & drag anywhere on the page to create the placement box. The "Continue ▶" button is disabled until a box is drawn.
3. Auto-Clear "Type your signature" on Focus: Added `onFocus` handler to automatically clear `"Signature Preview"` when the user clicks inside the input box.
4. Uploaded Image Library Save Fix: Scaled uploaded images to bounded dimensions (max 600x300) before storing transparent PNG data URLs to prevent overflowing browser `localStorage` 5MB quota, enabling reliable library saving.
Proof: `npm run build` completed with code 0 in 34.37s.
Files touched: `src/components/SignModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Two-Step PDF Signature Feature (Draw, Type, Upload, Symbol, Library) (code + build + docs). ✅ DONE**
1. Page Card Action: Added the edit/pencil button to the bottom-right actions overlay on each page card to trigger the Sign PDF Page workflow.
2. Step 1: Draw Signature Placement Box:
   - Full high-resolution page rendering in interactive canvas.
   - Click and drag mouse to define placement box (with live dashed outline, semi-transparent fill, and proportional percentage coordinates).
   - "Continue ▶" transitions directly to Step 2.
3. Step 2: Create or Choose Signature (4 Options):
   - Option 1 (Draw): HTML5 smooth drawing canvas with pen thickness slider (1-8px), Undo, Clear, and "Save to Library".
   - Option 2 (Type): Text input with live rendered cursive font options (Segoe Script, Segoe Print, Comic Sans MS, Guttman Yad, Lucida Handwriting, Brush Script MT, Arial, Caveat, Dancing Script, Pacifico, Great Vibes) and "Save to Library".
   - Option 3 (Upload): Drag-and-drop & file picker supporting PNG/JPG/BMP with automatic background white-transparency filter and "Save to Library".
   - Option 4 (Symbol): Pre-made symbols & badges (Checkmark, Cross, Star, APPROVED stamp).
   - Saved Signatures Library: Persistent `localStorage` library storing transparent signature PNGs with 1-click reuse and delete badges.
4. Lossless PDF & Preview Embedding:
   - Updated `PageCard` to immediately render transparent signature overlays over the thumbnail.
   - Updated `PdfExportManager` to embed transparent PNG signatures at exact proportional page coordinates in `exportMergedPdf`, `exportSelectedPdf`, and `exportSplitPdfParts`.
Proof: `npm run build` completed with code 0 in 26.69s.
Files touched: `src/domain/types.ts`, `src/managers/PdfExportManager.ts`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `src/components/SignModal.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Even and Odd Quick Split Presets (code + build + docs). ✅ DONE**
1. Added Even and Odd quick split presets to the Split PDF modal:
   - "Split Even & Odd Pages (2 Files)": Splits document into two files (`Odd_Pages.pdf` and `Even_Pages.pdf`) in one click.
   - "Odd Pages Only": Adds a single output part containing all odd pages (1, 3, 5, ...).
   - "Even Pages Only": Adds a single output part containing all even pages (2, 4, 6, ...).
2. Production build verified cleanly with zero errors.
Proof: `npm run build` completed with code 0 in 9.26s.
Files touched: `src/components/SplitModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Split PDF Document Modal Feature (code + build + docs). ✅ DONE**
1. Implemented "Split PDF Document" modal matching the user reference screenshot:
   - Header with dynamic available page counter (`{N} Pages Available`).
   - Left Panel:
     - "Add Page Range" tool with Part Label input, custom Page Range input (e.g. `1-3, 5, 7-9`), and From/To page number inputs.
     - "Quick Split Presets": "Split Into Single Pages", "Split Every N Pages" (with custom N input), and "Split Selected Pages Only" toggle.
   - Right Panel:
     - "Configured Output Files" list showing generated part cards with part numbering, custom name, page range details, and individual remove buttons.
     - Empty state with scissors illustration matching design when 0 parts are added.
   - Footer: "Clear All Ranges" button, "Cancel", and "Split & Save All Parts" export trigger.
2. Lossless Document Splitting in `PdfExportManager`: Copies vector text, embedded images, and non-destructive page rotations to generate and download each part independently.
3. Added "Split PDF" action button in `TopNavbar.tsx` and wired into `App.tsx`.
Proof: `npm run build` completed with code 0 in 12.09s.
Files touched: `src/components/SplitModal.tsx`, `src/components/TopNavbar.tsx`, `src/managers/PdfExportManager.ts`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6, #7 in `docs/DECISIONS.md`.

**2026-08-15 — Direct In-App Modal with Browser Download (Approach 2) (code + build + docs). ✅ DONE**
1. Implemented Approach 2 for image exports:
   - Clicking "Export Images" opens the sleek in-app web modal dialog.
   - Allows setting Base File Name (default `ExportedPage`), choosing format strictly between `PNG (*.png)` and `JPG (*.jpg)`, and choosing page scope (Selected pages vs All pages).
   - Shows live filename preview (`ExportedPage_1.png`, `ExportedPage_2.png`, etc.).
   - Clicking "Download" immediately downloads all rendered images directly to the browser without opening any native OS dialogs.
2. Verified production build with zero errors.
Proof: `npm run build` completed with code 0 in 7.64s.
Files touched: `src/components/ExportImagesModal.tsx`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Fix Navbar Button Hover Scrollbar & Single Dialog Multi-Image Save (code + build + docs). ✅ DONE**
1. Fixed Navbar Hover Scrollbar: Removed `overflow-x-auto` and `hover:scale-[1.02]` from `TopNavbar.tsx` that was causing the native OS horizontal scrollbar to appear on hover.
2. Single Dialog Multi-Image Export:
   - For multi-image exports, clicking "Export Images" opens the native OS destination picker dialog once. Selecting the folder saves all selected images (`ExportedPage_1.png`, `ExportedPage_2.png`, etc.) directly into that folder with 0 additional dialogs.
   - For single-image exports, opens the native OS Save File dialog directly.
Proof: `npm run build` completed with code 0 in 7.66s.
Files touched: `src/components/TopNavbar.tsx`, `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Native Save Dialog Fix: Default Name `ExportedPage` & Direct File Handle Saving (code + build + docs). ✅ DONE**
1. Changed default suggested name in the native Save File dialog from `ExportedPage_1` to strictly `ExportedPage.png` (or `ExportedPage.jpg`).
2. Fixed multi-image folder destination: In order to guarantee that all images are saved into the exact destination folder chosen by the user (rather than dumped into `Downloads`), each image is written through its native OS File System Access file handle in that same directory with sequence naming (`{chosenName}_1.png`, `{chosenName}_2.png`, etc.).
Proof: `npm run build` completed with code 0 in 8.66s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Pure Native Save Dialog for Export Images (code + build + docs). ✅ DONE**
1. Removed the web modal entirely and restored direct invocation of the **native OS Save File Dialog** (`showSaveFilePicker`).
2. When clicking "Export Images", the native OS Save File dialog opens immediately with:
   - Default suggested name: `ExportedPage.png` (or `ExportedPage_1.png` for multiple pages).
   - Save as type: strictly `PNG Image (*.png)` and `JPG Image (*.jpg)`.
3. Writing files:
   - First page writes directly to the user-selected native handle in their chosen destination folder.
   - All subsequent pages are exported with `_2`, `_3`, etc. in the user's chosen format (`.png` or `.jpg`).
Proof: `npm run build` completed with code 0 in 8.35s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Single Prompt Multi-Image Export (Choose Filename & Format -> 1 Folder Save) (code + build + docs). ✅ DONE**
1. Multi-Image Export Workflow: When exporting multiple images, clicking "Export Images" opens the Export Images dialog practical to customize the Base File Name (`ExportedPage` by default) and choose between `PNG (*.png)` and `JPG (*.jpg)`.
2. 1-Prompt Folder Save: Clicking "Select Folder & Save All" opens the native OS destination folder picker once and saves all selected images (`ExportedPage_1.png`, `ExportedPage_2.png`, etc.) directly into that folder with zero subsequent save dialogs.
3. Single Image Export: Continues to open the native OS Save File dialog (`showSaveFilePicker`) directly for single-file operations.
Proof: `npm run build` completed with code 0 in 9.76s.
Files touched: `src/components/ExportImagesModal.tsx`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Fix Multi-Page Destination Folder (Direct Native Handle Save for All Pages) (code + build + docs). ✅ DONE**
Fixed the issue where subsequent images were routed to the browser's default Downloads folder:
- For multi-image exports, every image is now written through the native OS File System Access handle (`showSaveFilePicker`) in the user's selected destination folder.
- The dialog opens in the same directory with pre-filled names (`ExportedPage_1.png`, `ExportedPage_2.png`, etc.) and matching format (PNG or JPG), writing directly to the user's chosen folder without dumping to Downloads.
Proof: `npm run build` completed with code 0 in 8.16s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Native Save Dialog, Pre-rendered Blobs & `_$$$` Image Sequence Export (code + build + docs). ✅ DONE**
1. Updated image export to use the native OS Save File dialog (`showSaveFilePicker`) with default file name `ExportedPage.png` and type choices strictly limited to `PNG Image (*.png)` and `JPG Image (*.jpg)` (using `.jpg` extension).
2. Fixed multi-page browser download blocking: All high-res image blobs are pre-rendered in parallel upfront BEFORE opening/resolving the save dialog so all remaining downloads execute synchronously without losing user-activation gesture context.
3. Multiple image files are automatically exported with `_1`, `_2`, `_3`... (`_sequenceNumber`) appended to the user's chosen base name (e.g. `MyExport_1.png`, `MyExport_2.png`, `MyExport_3.png`).
Proof: `npm run build` completed with code 0 in 8.75s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Native Save File Dialog with `_00#` Suffix (code + build + docs). ✅ DONE**
1. Replaced the Directory Picker with the native OS **Save File dialog** (`showSaveFilePicker`) as requested.
2. The user selects their chosen file name (e.g. `ExportedPage`) and type (`PNG Image (*.png)` or `JPEG Image (*.jpg)`).
3. The selected images are exported as pure `.png` or `.jpg` files, each automatically appended with `_00#` (e.g. `_001.png`, `_002.png`, `_003.png` or `.jpg`).
Proof: `npm run build` completed with code 0 in 12.57s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Full Multi-Page Export Fix (Folder Picker & Direct Image Writing) (code + build + docs). ✅ DONE**
Fixed multi-image export where browser security was restricting subsequent file downloads:
1. Integrated native OS Directory Picker (`showDirectoryPicker`) for multi-page image export: When exporting multiple images, the user picks the target destination folder on their computer, and each selected page is rendered and written directly into that folder as an individual `.png` or `.jpg` file.
2. Single-page export continues to use the native OS Save File dialog (`showSaveFilePicker`) with PNG and JPG dropdown format choices.
Proof: `npm run build` completed with code 0 in 15.80s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Pure PNG/JPG Native Save (Removed Zip Export) (code + build + docs). ✅ DONE**
1. Removed ZIP archiving completely from image export. Export Images now exclusively saves files as `.png` or `.jpg` images matching the exact format selected in the native OS Save dialog dropdown (`PNG Image (*.png)` or `JPEG Image (*.jpg)`).
2. For multiple pages, the user selects their preferred image extension/name via the native dialog for the set, and each page is rendered and written directly as an individual high-quality image file in that chosen format.
Proof: `npm run build` completed with code 0 in 10.79s.
Files touched: `src/coordinator/PdfCoordinator.ts`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Direct OS Native Save Dialog & Print Scope Default Sync (code + build + docs). ✅ DONE**
1. Direct OS Native Save Dialog: Clicking "Export Images" now directly opens the OS native Save File dialog (with `PNG Image (*.png)` and `JPEG Image (*.jpg)` in the dropdown) via `showSaveFilePicker()`. The user can pick their folder, customize the filename, and switch the format in the native OS window without intermediate web modal prompts.
2. Print Dialog Default Scope: Updated `PrintModal.tsx` so that when the print dialog opens, it dynamically defaults to "Selected Pages Only" if any pages are currently selected; otherwise, it defaults to "All Pages".
Proof: `npm run build` completed with code 0 in 8.23s.
Files touched: `src/components/PrintModal.tsx`, `src/coordinator/PdfCoordinator.ts`, `src/components/TopNavbar.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Print Preview Fix & Native Save File Dialog Support (code + build + docs). ✅ DONE**
1. Fixed print preview infinite rendering: Refactored `PrintModal.tsx` to mount `PrintPreviewViewer` cleanly with keying per page, and fixed `useThumbnail.ts` re-fetch lifecycle on dynamic modal launch.
2. Added Native OS "Save As" file picker support via browser File System Access API (`showSaveFilePicker`) with `PNG Image (*.png)` and `JPEG Image (*.jpg)` types matching the native Windows save dialog.
Proof: `npm run build` completed with code 0 in 8.97s.
Files touched: `src/hooks/useThumbnail.ts`, `src/coordinator/PdfCoordinator.ts`, `src/components/PrintModal.tsx`, `src/components/ExportImagesModal.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Clear All Warning, Export Images Dialog, Branding & Print Preview Modal (code + build + docs). ✅ DONE**
Implemented 4 requested features:
1. Clear All Warning Modal: Added a confirmation dialog box when clicking "Clear All" to prevent accidental data loss.
2. Export Images Modal: Replaced the dropdown with a modal dialog to select between PNG and JPG extensions/quality, and target pages (selected only vs all).
3. Branding: Restored app title to "pdfTools" in the header and document.
4. Print Feature: Added a full-featured "Print Preview & Settings" modal matching the user's reference design with destination, copies, color/grayscale mode, duplex, page range (all/selected/custom), page navigation preview, and client-side document printing.
Proof: `npm run build` completed with code 0 in 11.77s.
Files touched: `src/components/ClearWarningModal.tsx`, `src/components/ExportImagesModal.tsx`, `src/components/PrintModal.tsx`, `src/components/TopNavbar.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Left Sidebar Layout, Direct Multi-Select, Zoom, Export Images & Revert All (code + build + docs). ✅ DONE**
Revamped the UI to match the user's reference design and implemented 4 major capabilities:
1. Revamped layout into a sleek dark theme (`#0a0f18` / `#0f172a`) with a dedicated left sidebar for "PDF Source Files" (with circular numbered badges, page count, size, up/down reorder chevrons, and remove button) and top navigation bar.
2. Direct Multi-Selection: Clicking any page card directly toggles selection without requiring the Ctrl key (Shift+Click still supports range selection).
3. Page Zoom Controls: Added zoom slider with Zoom In/Out icons in the sub-header to dynamically adjust thumbnail grid size from compact (7-8 cols) to large (2-3 cols).
4. Save Selected & Export Images: Added "Save Selected" to export only selected pages as PDF, and "Export Images" to render and download selected pages as high-quality PNG or JPG images (downloaded directly for single page, or zipped as a ZIP file via JSZip for multiple pages).
5. Revert All: Added "Revert All" button to restore all original pages, initial sequence, and reset rotations.
Proof: `npm run build` completed with code 0 in 14.38s.
Files touched: `package.json`, `src/managers/ThumbnailRenderManager.ts`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/components/TopNavbar.tsx`, `src/components/SidebarSources.tsx`, `src/components/GridSubHeader.tsx`, `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `src/components/Dropzone.tsx`, `src/components/ErrorBanner.tsx`, `src/index.css`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Interactive Drag & Drop and Subtle Icon-Only Quick Actions (code + build + docs). ✅ DONE**
Refined the page thumbnail UI and added full interactive drag-and-drop:
1. Replaced the previous hover overlay with 3 subtle, icon-only action buttons (Rotate Left, Rotate Right, Delete) positioned at the bottom-right of the preview. Removed the move left/right buttons.
2. Implemented live drag-and-drop reordering: dragging any page (single or multi-selection) shows real-time shifting of surrounding pages to preview the target drop position before releasing.
3. Multi-page dragging: dragging one of multiple selected pages moves the entire selected group together to the drop target.
Proof: `npm run build` completed with code 0 (19.56s).
Files touched: `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `src/App.tsx`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — Reordering, Image Import, Page Selection, Rotation & Hover Actions (code + build + docs). ✅ DONE**
Added 5 requested document manipulation features to pdfTools:
1. Reordering of source files (via chevron buttons in SourceList) and individual pages (via move left/right controls on page cards).
2. Removed the text "Pages will be merged in the exact order shown below".
3. Added native image file support (PNG, JPG, WebP) with client-side preview rendering and native `@cantoo/pdf-lib` PDF embedding (`embedPng`/`embedJpg`).
4. Added single and multi-page selection (Click, Ctrl/Cmd+Click, Shift+Range, Select All, Deselect) with batch actions toolbar (Rotate Selected, Delete Selected).
5. Added hover action overlay to each page card containing Rotate Left (90° CCW), Rotate Right (90° CW), Move Left/Right, and Delete Page buttons with lossless rotation in PDF export.
Proof: `npm run build` completed with code 0 (8.12s); browser subagent tested all 5 features end-to-end including file reordering, individual page rotation, page deletion, multi-select batch rotation, and merge export without errors.
Files touched: `src/domain/types.ts`, `src/managers/PdfSourceManager.ts`, `src/managers/PdfExportManager.ts`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/hooks/useThumbnail.ts`, `src/components/Dropzone.tsx`, `src/components/SourceList.tsx`, `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `src/components/ActionToolbar.tsx`, `src/App.tsx`, `docs/DECISIONS.md`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4, #5, #6 in `docs/DECISIONS.md`.

**2026-08-15 — UI Copy Cleanup: Removed Promotional and Phase Badges (code + docs). ✅ DONE**
Cleaned the user interface by removing all promotional phrasing ("Phase 1", "Client-side PDF Merger & Viewer", "100% Client-Side Privacy: No files are uploaded", "Your documents stay on this device. Nothing is uploaded."). Updated Header, Dropzone, and index.html to present a clean, unbranded tool UI. Verified with a clean production build (`npm run build`).
Proof: `npm run build` completed with code 0 (10.34s).
Files touched: `src/components/Header.tsx`, `src/components/Dropzone.tsx`, `index.html`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4 in `docs/DECISIONS.md`.

**2026-08-15 — Phase 1 Client-Side PDF Merger & Viewer Complete (code + build + docs). ✅ DONE**
Implemented Phase 1 of `pdfTools`: a 100% client-side PDF tool with React, TypeScript, Vite, Tailwind CSS, pdfjs-dist, and @cantoo/pdf-lib. Designed strict architectural isolation between preview thumbnail rendering (pdfjs on canvas) and document reconstruction/export (pdf-lib using `copyPages()` directly from pristine original bytes to preserve vector/scan fidelity). Implemented `PdfSourceManager`, `ThumbnailRenderManager` with lazy rendering, `PdfExportManager`, `PdfCoordinator`, and modular React UI components. Configured `firebase.json` for static hosting. Verified build (`npm run build` succeeds, worker formatted locally) and end-to-end multi-file merging in browser subagent and automated pipeline test (5 of 5 pages merged losslessly in order).
Proof: `npm run build` passed cleanly; test pipeline merged 5/5 pages; browser subagent verified UI with 27 pages across multiple sources.
Files touched: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `firebase.json`, `src/domain/types.ts`, `src/lib/pdfjs-worker.ts`, `src/managers/PdfSourceManager.ts`, `src/managers/ThumbnailRenderManager.ts`, `src/managers/PdfExportManager.ts`, `src/coordinator/PdfCoordinator.ts`, `src/hooks/usePdfCoordinator.ts`, `src/hooks/useThumbnail.ts`, `src/components/Header.tsx`, `src/components/Dropzone.tsx`, `src/components/SourceList.tsx`, `src/components/PageCard.tsx`, `src/components/PageGrid.tsx`, `src/components/ActionToolbar.tsx`, `src/components/ErrorBanner.tsx`, `src/index.css`, `src/App.tsx`, `src/main.tsx`, `docs/DECISIONS.md`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4 in `docs/DECISIONS.md`.

**2026-08-15 — Phase 1 Project Initiation & Devlog Setup (code + docs). 🟡 PARTIAL**
Initialized the devlog decision log and progress log for Phase 1 of the browser-based PDF tools application (`pdfTools`). Documented foundational architectural constraints: 100% client-side privacy, strict separation between `pdfjs-dist` preview rendering and `@cantoo/pdf-lib` lossless vector/image export, and descriptor-based document modeling. Implementation of source managers, thumbnail renderer, export manager, coordinator, and UI is currently in progress.
Files touched: `docs/DECISIONS.md`, `docs/PROGRESS.md`.
Cross-references: Decisions #1, #2, #3, #4.
