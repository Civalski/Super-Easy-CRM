/** Keeps fixed-position dropdown menus inside the viewport (mobile-safe). */

const VIEWPORT_PAD = 8

export function clampFixedMenuPosition(
  anchorRect: DOMRect,
  menuWidth: number,
  menuHeightEstimate: number,
  preferBelow = true
): { top: number; left: number } {
  if (typeof window === 'undefined') {
    return {
      top: preferBelow ? anchorRect.bottom + 4 : anchorRect.top - menuHeightEstimate - 4,
      left: anchorRect.right - menuWidth,
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = anchorRect.right - menuWidth
  left = Math.min(left, vw - menuWidth - VIEWPORT_PAD)
  left = Math.max(VIEWPORT_PAD, left)

  let top = preferBelow ? anchorRect.bottom + 4 : anchorRect.top - menuHeightEstimate - 4
  if (preferBelow && top + menuHeightEstimate > vh - VIEWPORT_PAD) {
    const above = anchorRect.top - menuHeightEstimate - 4
    if (above >= VIEWPORT_PAD) {
      top = above
    } else {
      top = Math.max(VIEWPORT_PAD, vh - menuHeightEstimate - VIEWPORT_PAD)
    }
  } else if (!preferBelow && top < VIEWPORT_PAD) {
    top = Math.min(anchorRect.bottom + 4, vh - menuHeightEstimate - VIEWPORT_PAD)
    top = Math.max(VIEWPORT_PAD, top)
  }

  return { top, left }
}
