'use client'

import { useEffect, useState } from 'react'

import PwaInstallPanel from '@/components/pwa/PwaInstallPanel'
import { APP_NAME } from '@/lib/appIcon'
import {
  isStandaloneDisplayMode,
  loadHomeScreenIconPreference,
  recordPwaInstallSuccess,
  shouldShowPwaInstallPromo,
} from '@/lib/pwaInstall'

export default function AdminPwaInstallSection() {
  const [showPromo, setShowPromo] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setShowPromo(shouldShowPwaInstallPromo())
    setStandalone(isStandaloneDisplayMode())
    setConfirmed(loadHomeScreenIconPreference() === 'yes' || isStandaloneDisplayMode())
  }, [])

  function handleDone() {
    setSaving(true)
    recordPwaInstallSuccess()
    setConfirmed(true)
    setShowPromo(false)
    setStandalone(isStandaloneDisplayMode())
    setSaving(false)
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">App zum Home-Bildschirm</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          {standalone || confirmed
            ? `${APP_NAME} ist als App eingerichtet — oder du hast das Hinzufügen bestätigt.`
            : `Lege ${APP_NAME} auf den Home-Bildschirm — schneller Start ohne Browser-Leiste.`}
        </p>
      </div>

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
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          ✓ {APP_NAME} läuft als App auf dem Home-Bildschirm.
        </p>
      )}
    </section>
  )
}
