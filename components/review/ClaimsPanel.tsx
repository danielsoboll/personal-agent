'use client'

import type { ContestablePoint, KeyClaim } from '@/lib/analyzeTypes'
import { buttonStyles } from '@/lib/buttonStyles'

type ClaimsPanelProps = {
  claims?: KeyClaim[]
  points?: ContestablePoint[]
  draftBusy?: boolean
  onRequestReplyDraft?: () => void
}

export default function ClaimsPanel({
  claims = [],
  points = [],
  draftBusy = false,
  onRequestReplyDraft,
}: ClaimsPanelProps) {
  if (claims.length === 0 && points.length === 0) return null

  return (
    <div className="space-y-6">
      {claims.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Was die andere Seite sagt</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Kurz die wichtigsten Behauptungen oder Forderungen aus dem Schreiben.
            </p>
          </div>
          <ol className="space-y-2">
            {claims.map((claim, index) => (
              <li
                key={claim.id}
                className="flex gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-foreground">{claim.text}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {points.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Das kannst du prüfen</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Punkte, bei denen sich ein genauerer Blick oder Widerspruch lohnen kann — keine Rechtsberatung.
            </p>
          </div>
          <ul className="space-y-3">
            {points.map((point, index) => (
              <li
                key={point.id}
                className="rounded-2xl border border-accent/25 bg-accent-soft/50 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  Punkt {index + 1}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-foreground">{point.claim}</p>
                <div className="mt-3 space-y-2 text-sm leading-7">
                  <p className="text-muted">
                    <span className="font-medium text-foreground">Warum: </span>
                    {point.why}
                  </p>
                  <p className="rounded-xl bg-surface/80 px-3 py-2 text-foreground">
                    <span className="font-medium">Was du tun kannst: </span>
                    {point.suggestedAction}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {onRequestReplyDraft ? (
            <button
              type="button"
              disabled={draftBusy}
              onClick={onRequestReplyDraft}
              className={buttonStyles.accentSoft}
            >
              {draftBusy ? 'Entwurf wird vorbereitet …' : 'Antwortschreiben vorbereiten'}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
