'use client'

import { useLayoutEffect } from 'react'

import { applyDarkClass, getStoredTheme, resolveInitialDark } from '@/lib/theme'

/** Stellt Theme nach React-Hydration wieder her — React darf sonst `dark` auf html überschreiben. */
export default function ThemeHydration() {
  useLayoutEffect(() => {
    function syncTheme() {
      const stored = getStoredTheme()
      const dark =
        stored === 'dark' ? true : stored === 'light' ? false : resolveInitialDark()
      applyDarkClass(dark)
    }

    syncTheme()
    window.addEventListener('behoerdenpost-theme-change', syncTheme)
    return () => window.removeEventListener('behoerdenpost-theme-change', syncTheme)
  }, [])

  return null
}
