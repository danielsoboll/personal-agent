'use client'

import { useEffect, useState } from 'react'

import PwaInstallPanel from '@/components/pwa/PwaInstallPanel'
import {
  isStandaloneDisplayMode,
  loadHomeScreenIconPreference,
  recordPwaInstallSuccess,
  shouldShowPwaInstallPromo,
} from '@/lib/pwaInstall'

export default function AdminPwaInstallSection() {
  const [showPromo, setShowPromo] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setShowPromo(shouldShowPwaInstallPromo())
    setConfirmed(loadHomeScreenIconPreference() === 'yes' || isStandaloneDisplayMode())
  }, [])

  function handleDone() {
    setSaving(true)
    recordPwaInstallSuccess()
    setConfirmed(true)
    setShowPromo(false)
    setSaving(false)
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold tracking-tight">Zum Home-Bildschirm</h2>

      {showPromo ? (
        <PwaInstallPanel
          prominent
          showIosDoneButton
          iosInstallConfirmed={confirmed}
          iosDoneSaving={saving}
          onIosDone={handleDone}
          onInstalled={handleDone}
        />
      ) : (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✓ Schon eingerichtet</p>
      )}
    </section>
  )
}
