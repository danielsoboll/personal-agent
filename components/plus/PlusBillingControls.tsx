'use client'

import { useEffect, useState } from 'react'

import PlusCheckoutLegalNote from '@/components/legal/PlusCheckoutLegalNote'
import PlusActiveWelcome from '@/components/plus/PlusActiveWelcome'
import PlusLockHeaderButton, { PLUS_SECONDARY_BUTTON_CLASS } from '@/components/plus/PlusLockHeaderButton'
import PlusPriceDisplay from '@/components/plus/PlusPriceDisplay'
import { PLUS_BILLING_CHANGED_EVENT, readPlusBillingState } from '@/lib/plusBillingStorage'
import { plusTarifLine } from '@/lib/plusEntitlement'
import { isPlusActive } from '@/lib/plusStatus'
import {
  PLUS_CHECKOUT_UNAVAILABLE,
  PLUS_TAGLINE,
} from '@/lib/plusFeatures'
import { createPlusCheckoutSession, createPlusPortalSession } from '@/lib/stripeBilling'

type PlusBillingControlsProps = {
  compact?: boolean
  showPriceBadge?: boolean
  showActiveWelcome?: boolean
  showLegalNote?: boolean
}

export default function PlusBillingControls({
  compact = false,
  showPriceBadge = true,
  showActiveWelcome = true,
  showLegalNote = true,
}: PlusBillingControlsProps) {
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState('')
  const [tarifLine, setTarifLine] = useState('Dein Tarif: Kostenlos')
  const plusActive = isPlusActive()

  useEffect(() => {
    function refreshTarif() {
      setTarifLine(plusTarifLine(readPlusBillingState()))
    }

    refreshTarif()
    window.addEventListener(PLUS_BILLING_CHANGED_EVENT, refreshTarif)
    return () => window.removeEventListener(PLUS_BILLING_CHANGED_EVENT, refreshTarif)
  }, [])

  async function startCheckout() {
    setError('')
    setBusy('checkout')

    try {
      const { url } = await createPlusCheckoutSession()
      window.location.assign(url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : PLUS_CHECKOUT_UNAVAILABLE)
      setBusy(null)
    }
  }

  async function openPortal() {
    setError('')
    setBusy('portal')

    try {
      const { url } = await createPlusPortalSession()
      window.location.assign(url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Portal konnte nicht geöffnet werden.')
      setBusy(null)
    }
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {plusActive && showActiveWelcome ? <PlusActiveWelcome compact={compact} /> : null}
      {!plusActive && !compact ? (
        <p className="text-sm leading-relaxed text-muted">{PLUS_TAGLINE}</p>
      ) : null}
      <p className="text-sm font-semibold text-foreground">{tarifLine}</p>

      {plusActive ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void openPortal()}
          className={`${PLUS_SECONDARY_BUTTON_CLASS} disabled:opacity-60`}
        >
          {busy === 'portal' ? 'Wird geöffnet …' : 'Abo verwalten'}
        </button>
      ) : (
        <>
          {showPriceBadge ? <PlusPriceDisplay variant="inline" /> : null}
          <PlusLockHeaderButton
            variant="cta"
            disabled={busy !== null}
            onClick={() => void startCheckout()}
            showLock
          >
            {busy === 'checkout' ? 'Weiter zu Stripe …' : undefined}
          </PlusLockHeaderButton>
          {showLegalNote ? <PlusCheckoutLegalNote /> : null}
        </>
      )}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  )
}
