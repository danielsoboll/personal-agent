'use client'

import { useEffect, useState } from 'react'

import { applyDarkClass, setStoredTheme, type ThemePreference } from '@/lib/theme'
import { buttonStyles } from '@/lib/buttonStyles'

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
      className={buttonStyles.themeToggle}
      aria-label={mounted && isDark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
      aria-pressed={mounted ? isDark : undefined}
    >
      <span suppressHydrationWarning>{mounted && isDark ? '☀️' : '🌙'}</span>
    </button>
  )
}
