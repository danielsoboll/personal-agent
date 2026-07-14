'use client'

import PlusActiveWelcome from '@/components/plus/PlusActiveWelcome'
import PlusBillingControls from '@/components/plus/PlusBillingControls'
import PlusAboCallout from '@/components/plus/PlusAboCallout'
import PlusFeaturesList from '@/components/plus/PlusFeaturesList'
import PlusPriceDisplay from '@/components/plus/PlusPriceDisplay'
import { PLUS_SECONDARY_BUTTON_CLASS } from '@/components/plus/PlusLockHeaderButton'
import SheetPortal from '@/components/plus/SheetPortal'
import PlusCheckoutLegalNote from '@/components/legal/PlusCheckoutLegalNote'
import { isPlusActive } from '@/lib/plusStatus'
import { PLUS_PRODUCT_NAME, PLUS_SHEET } from '@/lib/plusFeatures'
import { PLUS_SHEET_SURFACE_ACTIVE_CLASS, PLUS_SHEET_SURFACE_CLASS } from '@/lib/plusShell'

type PlusFeaturesSheetProps = {
  onClose: () => void
}

export default function PlusFeaturesSheet({ onClose }: PlusFeaturesSheetProps) {
  const plusActive = isPlusActive()

  return (
    <SheetPortal>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-amber-950/25 dark:bg-black/55"
        onClick={onClose}
        role="presentation"
      >
        <div
          className={`lifexp-bottom-sheet ${plusActive ? PLUS_SHEET_SURFACE_ACTIVE_CLASS : PLUS_SHEET_SURFACE_CLASS} flex max-h-[88dvh] min-h-[50dvh] flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plus-features-sheet-title"
        >
          <div className="mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-border" />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <p
              className={`text-xs font-bold uppercase tracking-wide ${plusActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}
            >
              {PLUS_PRODUCT_NAME}
            </p>
            <h2 id="plus-features-sheet-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">
              {plusActive ? PLUS_SHEET.titleActive : PLUS_SHEET.titleFree}
            </h2>

            {!plusActive ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted">{PLUS_SHEET.introFree}</p>
                <div className="mt-4 space-y-3">
                  <PlusPriceDisplay variant="hero" />
                  <PlusAboCallout showPrice={false} />
                  <PlusCheckoutLegalNote />
                </div>
                <PlusFeaturesList />
                <div className="mt-5">
                  <PlusBillingControls compact showPriceBadge={false} showActiveWelcome={false} showLegalNote={false} />
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted">{PLUS_SHEET.introActive}</p>
                <PlusActiveWelcome className="mt-4" />
                <div className="mt-5">
                  <PlusBillingControls compact showPriceBadge={false} showActiveWelcome={false} showLegalNote={false} />
                </div>
              </>
            )}
          </div>

          <button type="button" onClick={onClose} className={`${PLUS_SECONDARY_BUTTON_CLASS} mt-4 shrink-0`}>
            Schließen
          </button>
        </div>
      </div>
    </SheetPortal>
  )
}
