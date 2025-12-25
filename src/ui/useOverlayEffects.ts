import { useEffect } from 'react'

function ensureThemeColorMeta(): HTMLMetaElement {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  return meta
}

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * Applies two global overlay behaviors while `open` is true:
 * - Locks background scrolling
 * - Temporarily sets the browser UI theme color to a darker tone to avoid a "white strip" effect
 *
 * Uses a small reference counter so multiple overlays can coexist.
 */
export function useOverlayEffects(open: boolean) {
  useEffect(() => {
    if (!open) return

    const root = document.documentElement
    const prevOverflow = document.body.style.overflow

    const meta = ensureThemeColorMeta()
    const prevTheme = meta.content

    const count = Number(root.dataset.overlayCount ?? '0')
    if (count === 0) {
      root.dataset.overlayPrevTheme = prevTheme
      // First overlay: apply global effects.
      document.body.style.overflow = 'hidden'

      const text = readCssVar('--text')
      if (text) meta.content = text
    }

    root.dataset.overlayCount = String(count + 1)

    return () => {
      const nextCount = Math.max(0, Number(root.dataset.overlayCount ?? '1') - 1)
      root.dataset.overlayCount = String(nextCount)

      if (nextCount === 0) {
        document.body.style.overflow = prevOverflow

        const restore = root.dataset.overlayPrevTheme
        if (restore !== undefined) {
          meta.content = restore
          delete root.dataset.overlayPrevTheme
        }
      }
    }
  }, [open])
}
