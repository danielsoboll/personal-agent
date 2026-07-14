'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'

import PlusActiveHeaderButton from '@/components/plus/PlusActiveHeaderButton'
import PlusFeaturesSheet from '@/components/plus/PlusFeaturesSheet'
import PlusLockHeaderButton from '@/components/plus/PlusLockHeaderButton'
import { logUserActivity } from '@/lib/activityLog'
import { PLUS_BILLING_CHANGED_EVENT } from '@/lib/plusBillingStorage'
import { PLUS_DISCOVER_UNLOCK_CHANGED_EVENT } from '@/lib/plusEngagement'
import { consumePlusWelcomePending } from '@/lib/plusWelcome'
import { isPlusActive, shouldShowPlusDiscoverHeader } from '@/lib/plusStatus'

export function usePlusDiscoverHeader() {
  const [visible, setVisible] = useState(false)
  const [plusActive, setPlusActive] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const refresh = useCallback(() => {
    setVisible(shouldShowPlusDiscoverHeader())
    setPlusActive(isPlusActive())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(PLUS_DISCOVER_UNLOCK_CHANGED_EVENT, refresh)
    window.addEventListener(PLUS_BILLING_CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener(PLUS_DISCOVER_UNLOCK_CHANGED_EVENT, refresh)
      window.removeEventListener(PLUS_BILLING_CHANGED_EVENT, refresh)
    }
  }, [refresh])

  useEffect(() => {
    if (!isPlusActive() || !consumePlusWelcomePending()) return
    setSheetOpen(true)
  }, [])

  const openPlusDiscover = useCallback(() => {
    logUserActivity('plus_discover_opened')
    setSheetOpen(true)
  }, [])

  const headerAction: ReactNode = visible ? (
    plusActive ? (
      <PlusActiveHeaderButton onClick={openPlusDiscover} />
    ) : (
      <PlusLockHeaderButton onClick={openPlusDiscover} />
    )
  ) : null

  const portals: ReactNode = sheetOpen ? <PlusFeaturesSheet onClose={() => setSheetOpen(false)} /> : null

  return { visible, plusActive, headerAction, portals, openPlusDiscover }
}
