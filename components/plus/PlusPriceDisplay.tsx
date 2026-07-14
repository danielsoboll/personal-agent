import {
  PLUS_PRICE_AMOUNT,
  PLUS_PRICE_PERIOD,
  PLUS_PRICE_TAGLINE,
  PLUS_PRODUCT_NAME,
} from '@/lib/plusFeatures'
import { PLUS_PRICE_HERO_CLASS, PLUS_PRICE_INLINE_CLASS } from '@/lib/plusShell'

type PlusPriceDisplayProps = {
  variant?: 'hero' | 'inline'
  className?: string
}

export default function PlusPriceDisplay({ variant = 'hero', className = '' }: PlusPriceDisplayProps) {
  if (variant === 'inline') {
    return (
      <div className={`${PLUS_PRICE_INLINE_CLASS} ${className}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            {PLUS_PRODUCT_NAME}
          </p>
          <p className="text-xs font-semibold text-muted">{PLUS_PRICE_TAGLINE}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold tabular-nums leading-none tracking-tight text-foreground">
            {PLUS_PRICE_AMOUNT}
          </p>
          <p className="mt-0.5 text-xs font-bold text-muted">{PLUS_PRICE_PERIOD}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${PLUS_PRICE_HERO_CLASS} ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">
        {PLUS_PRODUCT_NAME}
      </p>
      <div className="mt-1 flex items-baseline justify-center gap-1">
        <span className="text-[1.75rem] font-extrabold tabular-nums leading-none tracking-tight text-foreground">
          {PLUS_PRICE_AMOUNT}
        </span>
        <span className="pb-0.5 text-sm font-bold text-muted">/ Monat</span>
      </div>
      <p className="mt-1 text-sm font-bold text-foreground/90">{PLUS_PRICE_TAGLINE}</p>
    </div>
  )
}
