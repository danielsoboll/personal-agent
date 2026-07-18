'use client'

import { useEffect, useState } from 'react'

import RecoveryCodePanel from '@/components/admin/RecoveryCodePanel'
import { buttonStyles } from '@/lib/buttonStyles'
import {
  fetchBillingRecoveryCode,
  markBillingRecoveryCodeDoneClient,
  restorePlusWithRecoveryCode,
  RECOVERY_RESTORE_MAX_ATTEMPTS,
} from '@/lib/billingRecoveryClient'
import { isPlusActive } from '@/lib/plusStatus'
import { PLUS_BILLING_CHANGED_EVENT } from '@/lib/plusBillingStorage'
import { normalizeRecoveryCodeInput } from '@/lib/recoveryCode'
import { syncPlusBillingFromStripe } from '@/lib/stripeBilling'

export default function AdminRecoverySection() {
  const [plusActive, setPlusActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recCode, setRecCode] = useState<string | null>(null)
  const [recCodeOk, setRecCodeOk] = useState(false)
  const [doneSaving, setDoneSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState('')

  const [restoreCode, setRestoreCode] = useState('')
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [restoreAttempts, setRestoreAttempts] = useState(0)
  const [restoreLocked, setRestoreLocked] = useState(false)
  const [restoreError, setRestoreError] = useState('')

  async function loadCode() {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      if (isPlusActive()) {
        void syncPlusBillingFromStripe().catch(() => {
          /* optional */
        })
      }

      const result = await fetchBillingRecoveryCode()
      const active = isPlusActive() || result.available
      setPlusActive(active)
      if (result.available && result.recCode) {
        setRecCode(result.recCode)
        setRecCodeOk(result.recCodeOk)
      } else {
        setRecCode(null)
        setRecCodeOk(false)
        if (result.reason === 'no_device' && isPlusActive()) {
          setInfo(
            'PLUS ist lokal aktiv — Sync mit dem Server noch ausstehend. Bitte kurz warten und Admin neu öffnen.',
          )
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Recovery-Code konnte nicht geladen werden.')
      setPlusActive(isPlusActive())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCode()
    function onBillingChanged() {
      setPlusActive(isPlusActive())
    }
    window.addEventListener(PLUS_BILLING_CHANGED_EVENT, onBillingChanged)
    return () => window.removeEventListener(PLUS_BILLING_CHANGED_EVENT, onBillingChanged)
  }, [])

  async function handleDone() {
    setDoneSaving(true)
    setError('')
    try {
      await markBillingRecoveryCodeDoneClient()
      setRecCodeOk(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Speichern fehlgeschlagen.')
    } finally {
      setDoneSaving(false)
    }
  }

  function registerRestoreFailure(message: string) {
    const nextAttempt = restoreAttempts + 1
    setRestoreAttempts(nextAttempt)
    if (nextAttempt >= RECOVERY_RESTORE_MAX_ATTEMPTS) {
      setRestoreLocked(true)
      setRestoreError('Zu viele Fehlversuche. Recovery-Code-Eingabe ist vorübergehend gesperrt.')
      return
    }
    const remaining = RECOVERY_RESTORE_MAX_ATTEMPTS - nextAttempt
    setRestoreError(`${message} Noch ${remaining} ${remaining === 1 ? 'Versuch' : 'Versuche'}.`)
  }

  async function handleRestore() {
    if (restoreLocked || restoreBusy) return
    setRestoreBusy(true)
    setRestoreError('')
    setRestoreSuccess('')
    try {
      const { rebound } = await restorePlusWithRecoveryCode(restoreCode)
      setPlusActive(true)
      setRestoreCode('')
      setRestoreAttempts(0)
      setRestoreSuccess(
        rebound
          ? 'PLUS ist auf diesem Gerät aktiv. Auf dem alten Handy endet PLUS beim nächsten Sync.'
          : 'PLUS ist auf diesem Gerät aktiv.',
      )
      await loadCode()
    } catch (caught) {
      registerRestoreFailure(
        caught instanceof Error ? caught.message : 'Wiederherstellung fehlgeschlagen.',
      )
    } finally {
      setRestoreBusy(false)
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Recovery-Code</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Sichert dein PLUS bei Geräteverlust. Fälle bleiben nur lokal — die siehst du auf einem neuen Handy
          nicht mehr.
        </p>
      </div>

      {loading ? <p className="text-sm text-muted">Wird geladen …</p> : null}

      {!loading ? (
        <RecoveryCodePanel
          code={recCode ?? ''}
          empty={!recCode}
          recCodeOk={recCodeOk}
          showDoneButton={Boolean(recCode)}
          doneSaving={doneSaving}
          onDone={() => void handleDone()}
        />
      ) : null}

      {!loading && plusActive && !recCode && info ? (
        <p className="text-sm text-muted">{info}</p>
      ) : null}

      <div className="space-y-3 border-t border-border pt-5">
        <h3 className="text-sm font-semibold tracking-tight">Aus Recovery-Code wiederherstellen</h3>
        <p className="text-sm leading-6 text-muted">
          Auf einem neuen Gerät: Code eingeben. PLUS wechselt hierher — auf dem alten Gerät gilt es danach
          nicht mehr. Kündigung und Portal laufen weiter über dein Stripe-Abo.
        </p>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-muted">Recovery-Code</span>
          <input
            type="text"
            value={restoreCode}
            onChange={(event) => setRestoreCode(normalizeRecoveryCodeInput(event.target.value))}
            placeholder="POST-7K3P-92XQ"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            disabled={restoreLocked || restoreBusy}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-center font-mono text-lg tracking-[0.08em] text-foreground outline-none ring-accent focus:ring-2 disabled:opacity-50 [font-size:16px]"
            aria-label="Recovery-Code"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleRestore()}
          disabled={restoreLocked || restoreBusy || restoreCode.trim().length < 8}
          className={
            restoreLocked || restoreBusy || restoreCode.trim().length < 8
              ? buttonStyles.primaryInactive
              : buttonStyles.accentSoft
          }
        >
          {restoreBusy ? 'Wird wiederhergestellt …' : 'PLUS wiederherstellen'}
        </button>

        {restoreSuccess ? (
          <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100">
            {restoreSuccess}
          </p>
        ) : null}

        {restoreError ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
            {restoreError}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </p>
      ) : null}
    </section>
  )
}
