'use client'

import { type RefObject, useLayoutEffect } from 'react'

export function focusInputElement(el: HTMLInputElement | HTMLTextAreaElement | null) {
  if (!el || typeof document === 'undefined') return
  if (document.activeElement !== el) {
    try {
      el.focus({ preventScroll: true })
    } catch {
      el.focus()
    }
  }
  try {
    const end = el.value.length
    el.setSelectionRange(end, end)
  } catch {
    // some input types do not support selection
  }
}

/** Fokussiert ein Eingabefeld und öffnet die Tastatur (Retries für Mobile). */
export function useAutoFocusInput(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  enabled: boolean,
  resetKey?: string | number,
) {
  useLayoutEffect(() => {
    if (!enabled) return

    const run = () => focusInputElement(ref.current)

    run()
    const raf = requestAnimationFrame(run)
    const timers = [50, 150, 350].map((ms) => window.setTimeout(run, ms))

    return () => {
      cancelAnimationFrame(raf)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [enabled, resetKey, ref])
}
