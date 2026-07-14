import { PLUS_PURCHASE_CONFIRMATION } from '@/lib/plusFeatures'

type PlusPurchaseConfirmationProps = {
  className?: string
}

export default function PlusPurchaseConfirmation({ className = '' }: PlusPurchaseConfirmationProps) {
  const { headline, subline, body } = PLUS_PURCHASE_CONFIRMATION

  return (
    <div
      className={`rounded-2xl border-2 border-emerald-300/75 bg-gradient-to-b from-emerald-50/95 via-emerald-50/50 to-surface px-4 py-4 ring-1 ring-emerald-200/50 dark:border-emerald-800/55 dark:from-emerald-950/35 dark:via-emerald-950/20 dark:to-slate-900 dark:ring-emerald-900/35 ${className}`.trim()}
    >
      <p className="text-lg font-bold leading-snug text-emerald-950 dark:text-emerald-50">{headline}</p>
      <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">{subline}</p>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-emerald-900/90 dark:text-emerald-100/90">
        {body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
}
