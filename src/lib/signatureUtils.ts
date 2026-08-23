import type { SignatureOverlay } from '../domain/types'

/**
 * Maps a visual placement box drawn on a rotated page view back to the unrotated intrinsic page coordinates.
 */
export function visualToIntrinsicCoords(
  box: { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number },
  rotation: number
): { xPercent: number; yPercent: number; widthPercent: number; heightPercent: number } {
  const rot = ((rotation % 360) + 360) % 360
  if (rot === 0) return box
  if (rot === 90) {
    return {
      xPercent: box.yPercent,
      yPercent: 100 - (box.xPercent + box.widthPercent),
      widthPercent: box.heightPercent,
      heightPercent: box.widthPercent,
    }
  }
  if (rot === 180) {
    return {
      xPercent: 100 - (box.xPercent + box.widthPercent),
      yPercent: 100 - (box.yPercent + box.heightPercent),
      widthPercent: box.widthPercent,
      heightPercent: box.heightPercent,
    }
  }
  if (rot === 270) {
    return {
      xPercent: 100 - (box.yPercent + box.heightPercent),
      yPercent: box.xPercent,
      widthPercent: box.heightPercent,
      heightPercent: box.widthPercent,
    }
  }
  return box
}

/**
 * Gets the intrinsic coordinates and intrinsic rotation of a signature overlay on the unrotated page canvas.
 */
export function getSignatureIntrinsicState(sig: SignatureOverlay): {
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  intrinsicRotation: number // degrees on unrotated canvas
} {
  const placedRot = sig.placedRotation ?? 0
  const intrinsicCoords = visualToIntrinsicCoords(
    {
      xPercent: sig.xPercent,
      yPercent: sig.yPercent,
      widthPercent: sig.widthPercent,
      heightPercent: sig.heightPercent,
    },
    placedRot
  )

  return {
    ...intrinsicCoords,
    intrinsicRotation: (((-placedRot) % 360) + 360) % 360,
  }
}
