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
    <div className="space-y-5">
      {claims.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight">Behauptungen</h3>
          <ul className="space-y-2">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-base leading-7 text-foreground"
              >
                {claim.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {points.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight">Prüfpunkte</h3>
          <ul className="space-y-2">
            {points.map((point) => (
              <li
                key={point.id}
                className="rounded-2xl border-2 border-accent/30 bg-accent-soft/60 px-4 py-3"
              >
                <p className="text-base font-semibold leading-7 text-foreground">{point.claim}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{point.why}</p>
                <p className="mt-2 text-sm font-semibold text-accent">{point.suggestedAction}</p>
              </li>
            ))}
          </ul>

          {onRequestReplyDraft ? (
            <button
              type="button"
              disabled={draftBusy}
              onClick={onRequestReplyDraft}
              className={buttonStyles.primaryActive}
            >
              {draftBusy ? 'Wird vorbereitet …' : 'Antwortschreiben machen'}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
