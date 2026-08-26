import React, { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, X, AlertCircle, Loader2, KeyRound } from 'lucide-react'
import type { PasswordPromptRequest } from '../domain/types'

interface UnlockPdfModalProps {
  request: PasswordPromptRequest | null
  totalQueueCount: number
  currentIndex: number
  onUnlock: (requestId: string, password: string) => Promise<boolean>
  onCancel: (requestId: string) => void
}

export const UnlockPdfModal: React.FC<UnlockPdfModalProps> = ({
  request,
  totalQueueCount,
  currentIndex,
  onUnlock,
  onCancel,
}) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmittedError, setHasSubmittedError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset input and focus when active request changes
  useEffect(() => {
    if (request) {
      setPassword('')
      setShowPassword(false)
      setIsSubmitting(false)
      setHasSubmittedError(Boolean(request.isIncorrect))
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [request?.id])

  // Sync error state from coordinator
  useEffect(() => {
    if (request?.isIncorrect) {
      setHasSubmittedError(true)
      setIsSubmitting(false)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [request?.isIncorrect])

  if (!request) return null

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!password || isSubmitting) return

    setIsSubmitting(true)
    setHasSubmittedError(false)

    try {
      const success = await onUnlock(request.id, password)
      if (!success) {
        setHasSubmittedError(true)
        setIsSubmitting(false)
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    } catch {
      setHasSubmittedError(true)
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel(request.id)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">Password Required</h3>
                {totalQueueCount > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                    {currentIndex + 1} of {totalQueueCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[260px] font-medium" title={request.fileName}>
                {request.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={() => onCancel(request.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            This document is encrypted. Enter the password to unlock its pages. The password will be removed when you export or save.
          </p>

          {/* Password Input Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Document Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (hasSubmittedError) setHasSubmittedError(false)
                }}
                disabled={isSubmitting}
                placeholder="Enter password..."
                className={`w-full pl-9 pr-10 py-2.5 bg-[#060a12] border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  hasSubmittedError
                    ? 'border-rose-500/80 focus:ring-rose-500/50'
                    : 'border-slate-700/80 focus:border-amber-500/80 focus:ring-amber-500/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {hasSubmittedError && (
            <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Incorrect password. Please try again.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => onCancel(request.id)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all disabled:opacity-50"
            >
              {totalQueueCount > 1 ? 'Skip File' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={!password || isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
