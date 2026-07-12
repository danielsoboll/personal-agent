'use client'

import { useVisualViewportLayout } from '@/lib/useVisualViewportLayout'

/** Setzt `lifexp-keyboard-open` auf `<html>` wenn die iOS-Tastatur offen ist. */
export default function KeyboardViewportRoot() {
  useVisualViewportLayout()
  return null
}
