import React, { useState, useEffect } from 'react'
import {
  Scissors,
  X,
  FileText,
  Trash2,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react'
import type { PageDescriptor } from '../domain/types'

export interface SplitPartConfig {
  id: string
  name: string
  pageIndices: number[] // 0-based indices into active pool
  rangeLabel: string
}

interface SplitModalProps {
  isOpen: boolean
  pages: PageDescriptor[]
  selectedPageIds: Set<string>
  isExporting: boolean
  onClose: () => void
  onSplit: (parts: { name: string; pages: PageDescriptor[] }[]) => void
}

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  pages,
  selectedPageIds,
  isExporting,
  onClose,
  onSplit,
}) => {
  const [splitSelectedOnly, setSplitSelectedOnly] = useState<boolean>(false)
  const [partLabel, setPartLabel] = useState<string>('')
  const [rangeString, setRangeString] = useState<string>('')
  const [fromPage, setFromPage] = useState<number>(1)
  const [toPage, setToPage] = useState<number>(1)
  const [everyN, setEveryN] = useState<number>(2)
  const [parts, setParts] = useState<SplitPartConfig[]>([])
  const [inputError, setInputError] = useState<string | null>(null)

  // Active pool of pages based on "Split Selected Pages Only"
  const activePages = React.useMemo(() => {
    if (splitSelectedOnly && selectedPageIds.size > 0) {
      return pages.filter((p) => selectedPageIds.has(p.id))
    }
    return pages
  }, [pages, selectedPageIds, splitSelectedOnly])

  const totalPages = activePages.length

  useEffect(() => {
    if (isOpen) {
      const hasSelection = selectedPageIds.size > 0 && selectedPageIds.size < pages.length
      setSplitSelectedOnly(hasSelection)
      setFromPage(1)
      setToPage(pages.length > 0 ? (hasSelection ? selectedPageIds.size : pages.length) : 1)
      setParts([])
      setPartLabel('')
      setRangeString('')
      setInputError(null)
    }
  }, [isOpen, pages.length, selectedPageIds])

  useEffect(() => {
    setToPage(totalPages > 0 ? totalPages : 1)
  }, [totalPages])

  if (!isOpen) return null

  // Parse custom range string like "1-3, 5, 7-9"
  const parseRangeStringToIndices = (input: string, max: number): number[] => {
    const clean = input.trim()
    if (!clean) return []

    const result = new Set<number>()
    const tokens = clean.split(/[,;\s]+/)

    for (const token of tokens) {
      if (!token) continue
      if (token.includes('-')) {
        const [startStr, endStr] = token.split('-')
        const start = parseInt(startStr, 10)
        const end = parseInt(endStr, 10)
        if (!isNaN(start) && !isNaN(end)) {
          const low = Math.max(1, Math.min(start, end))
          const high = Math.min(max, Math.max(start, end))
          for (let p = low; p <= high; p++) {
            result.add(p - 1)
          }
        }
      } else {
        const p = parseInt(token, 10)
        if (!isNaN(p) && p >= 1 && p <= max) {
          result.add(p - 1)
        }
      }
    }

    return Array.from(result).sort((a, b) => a - b)
  }

  // Handle Add Range from manual input or From-To
  const handleAddRange = () => {
    setInputError(null)
    let indices: number[] = []
    let label = ''

    if (rangeString.trim()) {
      indices = parseRangeStringToIndices(rangeString, totalPages)
      if (indices.length === 0) {
        setInputError(`Invalid range "${rangeString}". Valid range is 1 to ${totalPages}.`)
        return
      }
      label = `Pages ${rangeString.trim()} (${indices.length} pages)`
    } else {
      const from = Math.max(1, Math.min(fromPage, totalPages))
      const to = Math.min(totalPages, Math.max(fromPage, toPage))
      if (from > to) {
        setInputError('From Page cannot be greater than To Page.')
        return
      }
      for (let p = from; p <= to; p++) {
        indices.push(p - 1)
      }
      label = from === to ? `Page ${from} (1 page)` : `Pages ${from}-${to} (${indices.length} pages)`
    }

    const partNum = parts.length + 1
    const newPart: SplitPartConfig = {
      id: `part_${Date.now()}_${Math.random()}`,
      name: partLabel.trim() || `Part_${partNum}`,
      pageIndices: indices,
      rangeLabel: label,
    }

    setParts((prev) => [...prev, newPart])
    setPartLabel('')
    setRangeString('')
  }

  // Quick preset: Split Into Single Pages
  const handleSplitSinglePages = () => {
    const newParts: SplitPartConfig[] = []
    for (let i = 0; i < totalPages; i++) {
      newParts.push({
        id: `part_single_${i + 1}_${Date.now()}`,
        name: `Page_${i + 1}`,
        pageIndices: [i],
        rangeLabel: `Page ${i + 1} (1 page)`,
      })
    }
    setParts(newParts)
    setInputError(null)
  }

  // Quick preset: Split Every N Pages
  const handleSplitEveryN = () => {
    const n = Math.max(1, Math.floor(everyN))
    const newParts: SplitPartConfig[] = []
    let partNum = 1

    for (let i = 0; i < totalPages; i += n) {
      const chunkIndices: number[] = []
      const end = Math.min(i + n, totalPages)
      for (let j = i; j < end; j++) {
        chunkIndices.push(j)
      }
      const label =
        chunkIndices.length === 1
          ? `Page ${i + 1} (1 page)`
          : `Pages ${i + 1}-${end} (${chunkIndices.length} pages)`

      newParts.push({
        id: `part_every_${partNum}_${Date.now()}`,
        name: `Part_${partNum}`,
        pageIndices: chunkIndices,
        rangeLabel: label,
      })
      partNum++
    }

    setParts(newParts)
    setInputError(null)
  }

  // Quick preset: Split Even & Odd Pages (creates 2 files: Odd_Pages and Even_Pages)
  const handleSplitEvenOdd = () => {
    const oddIndices: number[] = []
    const evenIndices: number[] = []

    for (let i = 0; i < totalPages; i++) {
      if ((i + 1) % 2 === 1) {
        oddIndices.push(i)
      } else {
        evenIndices.push(i)
      }
    }

    const newParts: SplitPartConfig[] = []
    if (oddIndices.length > 0) {
      newParts.push({
        id: `part_odd_${Date.now()}`,
        name: 'Odd_Pages',
        pageIndices: oddIndices,
        rangeLabel: `Odd Pages (${oddIndices.length} pages)`,
      })
    }
    if (evenIndices.length > 0) {
      newParts.push({
        id: `part_even_${Date.now()}`,
        name: 'Even_Pages',
        pageIndices: evenIndices,
        rangeLabel: `Even Pages (${evenIndices.length} pages)`,
      })
    }

    setParts(newParts)
    setInputError(null)
  }

  // Quick preset: Odd Pages Only
  const handleAddOddPagesOnly = () => {
    const oddIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 === 1)
    if (oddIndices.length === 0) return
    const newPart: SplitPartConfig = {
      id: `part_odd_${Date.now()}`,
      name: 'Odd_Pages',
      pageIndices: oddIndices,
      rangeLabel: `Odd Pages (${oddIndices.length} pages)`,
    }
    setParts((prev) => [...prev, newPart])
    setInputError(null)
  }

  // Quick preset: Even Pages Only
  const handleAddEvenPagesOnly = () => {
    const evenIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 === 0)
    if (evenIndices.length === 0) return
    const newPart: SplitPartConfig = {
      id: `part_even_${Date.now()}`,
      name: 'Even_Pages',
      pageIndices: evenIndices,
      rangeLabel: `Even Pages (${evenIndices.length} pages)`,
    }
    setParts((prev) => [...prev, newPart])
    setInputError(null)
  }

  const handleRemovePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleClearAllRanges = () => {
    setParts([])
    setInputError(null)
  }

  const handleConfirmSplit = () => {
    if (parts.length === 0) return

    const exportPayload = parts.map((part) => ({
      name: part.name,
      pages: part.pageIndices.map((idx) => activePages[idx]).filter(Boolean),
    }))

    onClose()
    onSplit(exportPayload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0b111e] border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center space-x-2">
                <span>Split PDF Document</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define output parts by adding custom page ranges or using quick split tools.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-sky-950/60 border border-sky-800/60 text-sky-400 text-xs font-semibold rounded-lg shadow-inner">
              {totalPages} Pages Available
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Grid: Left controls + Right Configured list */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Panel */}
          <div className="md:col-span-5 space-y-4">
            {/* Add Page Range Box */}
            <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Add Page Range
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Part Label / Name (Optional)
                </label>
                <input
                  type="text"
                  value={partLabel}
                  onChange={(e) => setPartLabel(e.target.value)}
                  placeholder="e.g. Chapter 1, Section A"
                  className="w-full bg-[#090e17] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Page Range (e.g. 1-3 or 1,3,5)
                </label>
                <input
                  type="text"
                  value={rangeString}
                  onChange={(e) => setRangeString(e.target.value)}
                  placeholder="e.g. 1-4, 7, 9-12"
                  className="w-full bg-[#090e17] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">From Page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={fromPage}
                    onChange={(e) => setFromPage(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#090e17] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">To Page</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={toPage}
                    onChange={(e) => setToPage(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#090e17] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium text-center"
                  />
                </div>
              </div>

              {inputError && (
                <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{inputError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddRange}
                className="w-full mt-2 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center space-x-1"
              >
                <span>+ Add Range to List</span>
              </button>
            </div>

            {/* Quick Split Presets */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Quick Split Presets
              </div>

              <button
                type="button"
                onClick={handleSplitSinglePages}
                className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Split Into Single Pages</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSplitEveryN}
                  className="flex-1 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Split Every N Pages:</span>
                </button>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={everyN}
                  onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 bg-[#090e17] border border-slate-700/80 rounded-lg px-2 py-2 text-xs text-slate-200 font-bold text-center focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Even & Odd Quick Presets */}
              <button
                type="button"
                onClick={handleSplitEvenOdd}
                className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                title="Split into two separate files: Odd_Pages and Even_Pages"
              >
                <Scissors className="w-4 h-4 text-sky-400" />
                <span>Split Even & Odd Pages (2 Files)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAddOddPagesOnly}
                  className="py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  title="Add Odd Pages only (1, 3, 5, ...)"
                >
                  <span>Odd Pages Only</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddEvenPagesOnly}
                  className="py-1.5 px-2.5 bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  title="Add Even Pages only (2, 4, 6, ...)"
                >
                  <span>Even Pages Only</span>
                </button>
              </div>

              {/* Split Selected Pages Only Checkbox */}
              {selectedPageIds.size > 0 && selectedPageIds.size < pages.length && (
                <div
                  onClick={() => setSplitSelectedOnly(!splitSelectedOnly)}
                  className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors mt-2"
                >
                  {splitSelectedOnly ? (
                    <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="text-xs font-medium text-slate-300">
                    Split Selected Pages Only ({selectedPageIds.size})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Configured Output Files */}
          <div className="md:col-span-7 flex flex-col bg-[#0d131f] border border-slate-800 rounded-xl p-4 h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
              <span className="text-xs font-bold text-slate-200">Configured Output Files</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/50 text-sky-400">
                {parts.length} Parts Configured
              </span>
            </div>

            {/* List or Empty State */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 custom-scrollbar">
              {parts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 mb-1">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-300">No Output Parts Added Yet</div>
                  <div className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Use the left panel to define custom page ranges or click 'Split Into Single Pages' to split every page.
                  </div>
                </div>
              ) : (
                parts.map((part, idx) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-200 truncate flex items-center space-x-2">
                          <span>{part.name}.pdf</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {part.rangeLabel}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePart(part.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                      title="Remove part"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleClearAllRanges}
            disabled={parts.length === 0 || isExporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Ranges</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSplit}
              disabled={parts.length === 0 || isExporting}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-950/40 transition-colors"
            >
              <Scissors className="w-4 h-4" />
              <span>Split & Save All Parts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
