'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { buttonStyles } from '@/lib/buttonStyles'
import { BILLING_CANCEL_PATH } from '@/lib/billingReturn'
import { activatePlusBilling } from '@/lib/plusBillingStorage'
import { syncPlusBillingFromStripe, verifyPlusCheckoutSession } from '@/lib/stripeBilling'

type VerificationState = 'pending' | 'missing_session' | 'unpaid' | 'paid' | 'error'

export default function PlusSuccessClient() {
  const router = useRouter()
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
        const result = await verifyPlusCheckoutSession(sessionId.trim())

        if (!result.plusActive) {
          setVerification(result.sessionStatus === 'open' ? 'unpaid' : 'unpaid')
          setError('Bei Stripe ist die Zahlung noch nicht abgeschlossen.')
          return
        }

        activatePlusBilling({
          customerId: result.customerId,
          subscriptionId: result.subscriptionId,
          paymentStatus: result.paymentStatus,
          sessionStatus: result.sessionStatus,
        })

        try {
          const syncResult = await syncPlusBillingFromStripe()
          if (!syncResult.plusActive && !result.plusSynced) {
            /* Stripe paid, DB sync pending — local activation from verify is enough */
          }
        } catch {
          /* Webhook/Sync optional — lokaler PLUS-Status reicht für den Start */
        }

        setVerification('paid')
        window.setTimeout(() => router.replace('/'), 1400)
      } catch (caught) {
        setVerification('error')
        setError(caught instanceof Error ? caught.message : 'Checkout konnte nicht geprüft werden.')
      }
    }

    void verify()
  }, [router, sessionId])

  async function handleManualSync() {
    if (syncBusy) return
    setSyncBusy(true)
    setError('')
    try {
      const syncResult = await syncPlusBillingFromStripe()
      if (syncResult.plusActive) {
        setVerification('paid')
        return
      }

      if (sessionId?.trim()) {
        const result = await verifyPlusCheckoutSession(sessionId.trim())
        if (result.plusActive) {
          activatePlusBilling({
            customerId: result.customerId,
            subscriptionId: result.subscriptionId,
            paymentStatus: result.paymentStatus,
            sessionStatus: result.sessionStatus,
          })
          setVerification('paid')
        }
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
        <p className="text-sm leading-7 text-muted">Einen Moment — wir fragen Stripe ab.</p>
      </section>
    )
  }

  if (verification === 'paid') {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Danke — PLUS ist aktiv</h2>
        <p className="text-sm leading-7 text-muted">Stripe hat die Zahlung bestätigt. Du wirst gleich weitergeleitet.</p>
        <Link href="/" className={buttonStyles.secondary}>
          Zur Startseite
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
