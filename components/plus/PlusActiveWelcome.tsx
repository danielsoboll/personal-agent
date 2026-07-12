import { PLUS_ACTIVE_WELCOME } from '@/lib/plusFeatures'

type PlusActiveWelcomeProps = {
  className?: string
  compact?: boolean
}

export default function PlusActiveWelcome({ className = '', compact = false }: PlusActiveWelcomeProps) {
  const { headline, body, availableHeading, availableItems } = PLUS_ACTIVE_WELCOME

  return (
    <div
      className={`rounded-2xl border-2 border-emerald-300/70 bg-gradient-to-b from-emerald-50/80 via-emerald-50/40 to-surface px-4 py-3.5 ring-1 ring-emerald-200/40 dark:border-emerald-800/50 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-slate-900 dark:ring-emerald-900/30 ${className}`.trim()}
    >
      <p className={`font-bold text-emerald-950 dark:text-emerald-100 ${compact ? 'text-sm' : 'text-base'}`}>
        {headline}
      </p>
      <div className={`space-y-1 text-emerald-900/90 dark:text-emerald-100/90 ${compact ? 'mt-2 text-xs' : 'mt-2.5 text-sm'}`}>
        {body.map((line) => (
          <p key={line} className="leading-relaxed">
            {line}
          </p>
        ))}
      </div>
      <div className={compact ? 'mt-3' : 'mt-4'}>
        <p
          className={`font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200 ${compact ? 'text-[10px]' : 'text-xs'}`}
        >
          {availableHeading}
        </p>
        <ul className={`mt-2 space-y-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
          {availableItems.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-emerald-950 dark:text-emerald-50">
              <span className="shrink-0 leading-none" aria-hidden>
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
