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
      className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3.5 dark:border-emerald-700 dark:bg-emerald-950/40"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-emerald-950 dark:text-emerald-50">Aktualisiert</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm font-semibold text-emerald-900 underline dark:text-emerald-100"
        >
          OK
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {changes.map((change) => (
          <li key={change.id} className="text-base leading-7 text-emerald-950 dark:text-emerald-50">
            • {change.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
