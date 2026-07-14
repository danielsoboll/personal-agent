'use client'

import { useEffect, useRef } from 'react'

import {
  clearBillingReturnSnapshot,
  readBillingReturnSnapshot,
} from '@/lib/billingReturn'
import { getOrCreateBillingDeviceId } from '@/lib/billingDevice'
import { readPlusBillingState } from '@/lib/plusBillingStorage'
import { isStripeBillingConfigured, syncPlusBillingFromStripe } from '@/lib/stripeBilling'

/** App-Start & Rückkehr von Stripe: PLUS-Status aus DB/Stripe synchronisieren (LifeXP-Family-Muster). */
export default function PlusBillingSync() {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (!isStripeBillingConfigured()) return

    getOrCreateBillingDeviceId()
    if (readBillingReturnSnapshot()) {
      clearBillingReturnSnapshot()
    }

    void syncPlusBillingFromStripe().catch(() => {
      /* Hintergrund-Sync — Fehler still ignorieren */
    })
  }, [])

  return null
}
