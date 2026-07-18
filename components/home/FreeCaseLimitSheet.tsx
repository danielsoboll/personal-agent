'use client'

import SheetPortal from '@/components/plus/SheetPortal'
import { buttonStyles } from '@/lib/buttonStyles'
import { PLUS_CTA_LABEL } from '@/lib/plusFeatures'
import { PLUS_CTA_BUTTON_CLASS } from '@/lib/plusShell'

type FreeCaseLimitSheetProps = {
  caseTitle: string
  busy?: boolean
  onDeleteCase: () => void
  onDiscoverPlus: () => void
  onClose: () => void
}

export default function FreeCaseLimitSheet({
  caseTitle,
  busy = false,
  onDeleteCase,
  onDiscoverPlus,
  onClose,
}: FreeCaseLimitSheetProps) {
  return (
    <SheetPortal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 sm:items-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="w-full max-w-md rounded-3xl border border-border bg-surface p-5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="free-case-limit-title"
        >
          <h2 id="free-case-limit-title" className="text-lg font-semibold tracking-tight">
            Noch ein Fall?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Kostenlos darfst du einen Fall gleichzeitig nutzen — ausprobieren und spielen ist okay.
            Für einen neuen Fall lösche zuerst „{caseTitle}“, oder hol dir PLUS für mehrere Fälle parallel.
          </p>

          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={onDeleteCase}
              className={buttonStyles.dangerOutline}
            >
              {busy ? 'Wird gelöscht …' : `„${caseTitle}“ löschen`}
            </button>
            <button type="button" disabled={busy} onClick={onDiscoverPlus} className={PLUS_CTA_BUTTON_CLASS}>
              {PLUS_CTA_LABEL}
            </button>
            <button type="button" disabled={busy} onClick={onClose} className={buttonStyles.secondary}>
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </SheetPortal>
  )
}
