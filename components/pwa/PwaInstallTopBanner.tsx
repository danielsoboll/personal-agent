'use client'

import { useCallback, useEffect, useState } from 'react'

import PwaInstallPanel from '@/components/pwa/PwaInstallPanel'
import { buttonStyles } from '@/lib/buttonStyles'
import { APP_NAME } from '@/lib/appIcon'
import {
  isStandaloneDisplayMode,
  loadHomeScreenIconPreference,
  PWA_DAILY_HINT_DELAY_MS,
  recordPwaInstallLaterChoice,
  recordPwaInstallSuccess,
  shouldShowPwaInstallDailyHint,
} from '@/lib/pwaInstall'

export default function PwaInstallTopBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [delayElapsed, setDelayElapsed] = useState(false)
  const [installSaving, setInstallSaving] = useState(false)

  const syncVisibility = useCallback(() => {
    if (isStandaloneDisplayMode() || loadHomeScreenIconPreference() === 'yes') {
      setVisible(false)
      return
    }
    setVisible(shouldShowPwaInstallDailyHint() && delayElapsed)
  }, [delayElapsed])

  useEffect(() => {
    if (isStandaloneDisplayMode() || loadHomeScreenIconPreference() === 'yes') {
      return
    }
    if (!shouldShowPwaInstallDailyHint()) {
      return
    }

    const timer = window.setTimeout(() => setDelayElapsed(true), PWA_DAILY_HINT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    syncVisibility()
    const onChange = () => syncVisibility()
    window.addEventListener('storage', onChange)
    return () => window.removeEventListener('storage', onChange)
  }, [syncVisibility])

  function handleDismissLater() {
    recordPwaInstallLaterChoice()
    setVisible(false)
    setExpanded(false)
  }

  function handleInstallDone() {
    setInstallSaving(true)
    recordPwaInstallSuccess()
    setInstallSaving(false)
    setVisible(false)
    setExpanded(false)
  }

  if (!visible) return null

  if (!expanded) {
    return (
      <div
        className="sticky top-0 z-[30] border-b border-accent/30 bg-gradient-to-r from-accent-soft via-surface to-surface px-3 py-2.5 shadow-sm"
        role="region"
        aria-label="App auf den Home-Bildschirm"
      >
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
            App auf den Home-Bildschirm — {APP_NAME} ohne Browser-Leiste starten.
          </p>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={`shrink-0 ${buttonStyles.header} !px-3 !py-2 text-xs font-semibold text-accent`}
          >
            Hinzufügen
          </button>
          <button
            type="button"
            onClick={handleDismissLater}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-muted underline-offset-2 hover:underline"
            aria-label="Später"
          >
            Später
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="sticky top-0 z-[30] border-b border-accent/30 bg-gradient-to-b from-accent-soft via-surface to-surface px-3 py-3 shadow-md"
      role="region"
      aria-label="App auf den Home-Bildschirm"
    >
      <div className="mx-auto max-w-lg space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-accent">Empfohlen</p>
            <h2 className="mt-0.5 text-base font-bold text-foreground">App auf den Home-Bildschirm</h2>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:underline"
          >
            Schließen
          </button>
        </div>

        <PwaInstallPanel
          prominent
          showIosDoneButton
          iosInstallConfirmed={false}
          iosDoneSaving={installSaving}
          onIosDone={handleInstallDone}
          onInstalled={handleInstallDone}
        />

        <button
          type="button"
          onClick={handleDismissLater}
          className="w-full text-center text-sm font-semibold text-muted underline underline-offset-2"
        >
          Vielleicht später
        </button>
      </div>
    </div>
  )
}
