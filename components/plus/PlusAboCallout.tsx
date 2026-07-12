import PlusPriceDisplay from '@/components/plus/PlusPriceDisplay'
import { PLUS_ABO_SLOGAN, PLUS_CANCEL_NOTE } from '@/lib/plusFeatures'
import { PLUS_CALLOUT_CLASS } from '@/lib/plusShell'

type PlusAboCalloutProps = {
  showPrice?: boolean
}

export default function PlusAboCallout({ showPrice = true }: PlusAboCalloutProps) {
  return (
    <div className="space-y-3">
      {showPrice ? <PlusPriceDisplay variant="hero" /> : null}
      <div className={PLUS_CALLOUT_CLASS}>
        <p className="text-base font-bold leading-snug text-foreground">{PLUS_ABO_SLOGAN}</p>
        <p className="mt-1.5 text-sm font-semibold text-muted">{PLUS_CANCEL_NOTE}</p>
      </div>
    </div>
  )
}
