'use client'

import { useEffect, useState } from 'react'

import { applyDarkClass, setStoredTheme, type ThemePreference } from '@/lib/theme'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const nextDark = !document.documentElement.classList.contains('dark')
    const pref: ThemePreference = nextDark ? 'dark' : 'light'
    setStoredTheme(pref)
    applyDarkClass(nextDark)
    setIsDark(nextDark)
    window.dispatchEvent(new Event('behoerdenpost-theme-change'))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="lifexp-flat-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-stone-400 bg-gradient-to-b from-stone-100 via-stone-200/95 to-stone-400/75 text-lg shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-stone-600 dark:from-stone-700 dark:via-stone-800 dark:to-stone-950 dark:text-amber-200"
      aria-label={mounted && isDark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
      aria-pressed={mounted ? isDark : undefined}
    >
      <span suppressHydrationWarning>{mounted && isDark ? '☀️' : '🌙'}</span>
    </button>
  )
}
