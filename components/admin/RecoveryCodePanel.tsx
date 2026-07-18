'use client'

import { formatRecoveryCodeDisplay } from '@/lib/recoveryCode'
import { buttonStyles } from '@/lib/buttonStyles'

type RecoveryCodePanelProps = {
  code: string
  /** Noch kein PLUS — Code-Platzhalter anzeigen */
  empty?: boolean
  recCodeOk?: boolean
  showDoneButton?: boolean
  doneSaving?: boolean
  onDone?: () => void
}

export default function RecoveryCodePanel({
  code,
  empty = false,
  recCodeOk = false,
  showDoneButton = false,
  doneSaving = false,
  onDone,
}: RecoveryCodePanelProps) {
  const displayCode = empty ? '' : formatRecoveryCodeDisplay(code)
  const hasCode = Boolean(displayCode)

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border-2 border-border bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-50 px-4 py-4 text-center dark:from-slate-800 dark:via-slate-900/90 dark:to-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recovery-Code</p>
        <p
          className={`mt-2 font-mono text-2xl font-black tracking-[0.12em] ${
            hasCode ? 'text-foreground' : 'text-muted/50'
          }`}
          aria-label={hasCode ? `Recovery-Code ${displayCode}` : 'Recovery-Code noch nicht vergeben'}
        >
          {hasCode ? displayCode : 'POST-····-····'}
        </p>
      </div>

      {empty ? (
        <p className="text-sm leading-6 text-muted">
          Der Code erscheint hier, sobald du PLUS aktivierst — dann notieren oder Screenshot machen.
        </p>
      ) : (
        <>
          <p className="text-sm leading-6 text-muted">
            Notiere oder speichere diesen Code (Screenshot). Mit ihm kannst du PLUS auf einem neuen Gerät
            wiederherstellen — Fälle bleiben lokal und kommen nicht mit.
          </p>
          <p className="text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">
            Bitte jetzt einen Screenshot machen.
          </p>
        </>
      )}

      {recCodeOk && hasCode ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100">
          ✓ Recovery-Code gespeichert — Erledigt
        </p>
      ) : null}

      {showDoneButton && hasCode && !recCodeOk ? (
        <button
          type="button"
          onClick={onDone}
          disabled={doneSaving || !displayCode}
          className={
            doneSaving || !displayCode ? buttonStyles.primaryInactive : buttonStyles.primaryActive
          }
        >
          {doneSaving ? 'Wird gespeichert …' : 'Erledigt!'}
        </button>
      ) : null}
    </div>
  )
}
