'use client'

import type { ReviewChangeItem } from '@/lib/reviewDiff'

type ReviewChangesBannerProps = {
  changes: ReviewChangeItem[]
  onDismiss: () => void
}

export default function ReviewChangesBanner({ changes, onDismiss }: ReviewChangesBannerProps) {
  if (changes.length === 0) return null

  return (
    <div
      className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Aktualisiert</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-emerald-800 underline dark:text-emerald-200"
        >
          OK
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {changes.map((change) => (
          <li key={change.id} className="text-sm leading-6 text-emerald-950 dark:text-emerald-100">
            • {change.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
