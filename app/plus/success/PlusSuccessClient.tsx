'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import PlusPurchaseConfirmation from '@/components/plus/PlusPurchaseConfirmation'
import { buttonStyles } from '@/lib/buttonStyles'
import { BILLING_CANCEL_PATH } from '@/lib/billingReturn'
import { markPlusWelcomePending } from '@/lib/plusWelcome'
import { syncPlusBillingFromStripe, verifyPlusCheckoutSession } from '@/lib/stripeBilling'

type VerificationState = 'pending' | 'missing_session' | 'unpaid' | 'paid' | 'error'

async function confirmPlusFromStripe(sessionId: string): Promise<boolean> {
  const verified = await verifyPlusCheckoutSession(sessionId)

  if (verified.plusActive) {
    return true
  }

  const synced = await syncPlusBillingFromStripe()
  return synced.plusActive
}

export default function PlusSuccessClient() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [verification, setVerification] = useState<VerificationState>('pending')
  const [error, setError] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function verify() {
      if (!sessionId?.trim()) {
        setVerification('missing_session')
        return
      }

      try {
        const active = await confirmPlusFromStripe(sessionId.trim())
        if (!active) {
          setVerification('unpaid')
          setError('Bei Stripe ist die Zahlung noch nicht abgeschlossen oder PLUS konnte nicht synchronisiert werden.')
          return
        }

        setVerification('paid')
        markPlusWelcomePending()
      } catch (caught) {
        setVerification('error')
        setError(caught instanceof Error ? caught.message : 'Checkout konnte nicht geprüft werden.')
      }
    }

    void verify()
  }, [sessionId])

  async function handleManualSync() {
    if (syncBusy) return
    setSyncBusy(true)
    setError('')

    try {
      if (sessionId?.trim()) {
        const active = await confirmPlusFromStripe(sessionId.trim())
        if (active) {
          setVerification('paid')
          markPlusWelcomePending()
          return
        }
      }

      const syncResult = await syncPlusBillingFromStripe()
      if (syncResult.plusActive) {
        setVerification('paid')
        markPlusWelcomePending()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Synchronisation fehlgeschlagen.')
    } finally {
      setSyncBusy(false)
    }
  }

  if (verification === 'pending') {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Zahlung wird geprüft …</h2>
        <p className="text-sm leading-7 text-muted">
          Einen Moment — wir schreiben dein PLUS in die Datenbank und fragen Stripe ab.
        </p>
      </section>
    )
  }

  if (verification === 'paid') {
    return (
      <section className="space-y-5">
        <PlusPurchaseConfirmation />
        <Link href="/" className={buttonStyles.primaryActive}>
          Gemeinsam starten
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">
        {verification === 'missing_session' ? 'Kein Checkout gefunden' : 'PLUS noch nicht aktiv'}
      </h2>
      <p className="text-sm leading-7 text-muted">
        {error ||
          (verification === 'missing_session'
            ? 'Diese Seite funktioniert nur direkt nach einem Stripe-Checkout.'
            : 'Ohne abgeschlossene Zahlung bleibt PLUS aus.')}
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={syncBusy || !sessionId}
          onClick={() => void handleManualSync()}
          className={`${buttonStyles.secondary} disabled:opacity-60`}
        >
          {syncBusy ? 'Wird geprüft …' : 'Status von Stripe holen'}
        </button>
        <Link href={BILLING_CANCEL_PATH} className={buttonStyles.secondary}>
          Zurück
        </Link>
        <Link href="/" className={buttonStyles.primaryActive}>
          Zur Startseite
        </Link>
      </div>
    </section>
  )
}
