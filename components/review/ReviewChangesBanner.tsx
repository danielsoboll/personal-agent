'use client'

import type { ReviewChangeItem } from '@/lib/reviewDiff'
import { buttonStyles } from '@/lib/buttonStyles'

type ReviewChangesBannerProps = {
  changes: ReviewChangeItem[]
  onDismiss: () => void
}

export default function ReviewChangesBanner({ changes, onDismiss }: ReviewChangesBannerProps) {
  if (changes.length === 0) return null

  return (
    <div
      className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4 dark:border-emerald-900 dark:bg-emerald-950/30"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Neu aktualisiert</p>
          <p className="mt-1 text-sm leading-6 text-emerald-900/90 dark:text-emerald-200/90">
            Das hat sich gegenüber der vorherigen Einordnung geändert:
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
        >
          Schließen
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {changes.map((change) => (
          <li
            key={change.id}
            className="rounded-xl bg-white/70 px-3 py-2 text-sm leading-6 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            {change.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
