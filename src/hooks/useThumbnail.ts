import { useState, useEffect, useRef } from 'react'
import { globalCoordinator } from '../coordinator/PdfCoordinator'
import type { PageDescriptor } from '../domain/types'

interface UseThumbnailOptions {
  sourceId: string
  pageIndex: number
  maxWidth?: number
  lazy?: boolean
  imagePreviewUrl?: string
  page?: PageDescriptor
  revision?: string | number
}

export function useThumbnail({
  sourceId,
  pageIndex,
  maxWidth = 300,
  lazy = true,
  imagePreviewUrl,
  page,
  revision,
}: UseThumbnailOptions) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const isVisibleRef = useRef<boolean>(!lazy)

  useEffect(() => {
    if (imagePreviewUrl) {
      setDataUrl(imagePreviewUrl)
      setIsLoading(false)
      setError(null)
      return
    }

    if (!sourceId) {
      setDataUrl(null)
      setIsLoading(false)
      return
    }

    // Check cache first (only if no revision force)
    if (!revision) {
      const cached = globalCoordinator.getCachedThumbnail(sourceId, pageIndex)
      if (cached) {
        setDataUrl(cached)
        setIsLoading(false)
        setError(null)
        return
      }
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)

    const doRender = async () => {
      try {
        const url = await globalCoordinator.getThumbnail(sourceId, pageIndex, maxWidth, page)
        if (isMounted) {
          setDataUrl(url)
          setIsLoading(false)
          setError(null)
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
            return
          }
          setError(err instanceof Error ? err.message : 'Failed to render preview')
          setIsLoading(false)
        }
      }
    }

    if (!lazy || isVisibleRef.current) {
      doRender()
      return () => {
        isMounted = false
        globalCoordinator.cancelThumbnail(sourceId, pageIndex)
      }
    }

    // Lazy intersection observer
    const element = elementRef.current
    if (!element) {
      doRender()
      return () => {
        isMounted = false
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            isVisibleRef.current = true
            doRender()
            observer.disconnect()
          }
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(element)

    return () => {
      isMounted = false
      observer.disconnect()
      globalCoordinator.cancelThumbnail(sourceId, pageIndex)
    }
  }, [sourceId, pageIndex, maxWidth, lazy, imagePreviewUrl, revision, page?.drawingDataUrl, page?.formValues, page?.signatures?.length, page?.rotation])

  return {
    dataUrl,
    isLoading,
    error,
    elementRef,
  }
}
