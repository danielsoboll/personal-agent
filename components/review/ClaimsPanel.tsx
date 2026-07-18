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
  const visibleClaims = claims.slice(0, 3)
  const visiblePoints = points.slice(0, 3)

  if (visibleClaims.length === 0 && visiblePoints.length === 0 && !onRequestReplyDraft) {
    return null
  }

  return (
    <div className="space-y-4">
      {visibleClaims.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-base font-semibold tracking-tight">Was behauptet wird</h3>
          <ul className="space-y-1.5">
            {visibleClaims.map((claim) => (
              <li
                key={claim.id}
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm leading-6 text-foreground"
              >
                {claim.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visiblePoints.length > 0 ? (
        <section className="space-y-2.5">
          <h3 className="text-base font-semibold tracking-tight">Wo du ansetzen kannst</h3>
          <ul className="space-y-1.5">
            {visiblePoints.map((point) => (
              <li
                key={point.id}
                className="rounded-xl border border-accent/30 bg-accent-soft/60 px-3.5 py-2.5"
              >
                <p className="text-sm font-semibold leading-6 text-foreground">{point.claim}</p>
                <p className="mt-0.5 text-sm leading-5 text-muted">{point.why}</p>
                <p className="mt-1.5 text-sm font-semibold text-accent">{point.suggestedAction}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {onRequestReplyDraft ? (
        <button
          type="button"
          disabled={draftBusy}
          onClick={onRequestReplyDraft}
          className={buttonStyles.primaryActive}
        >
          {draftBusy ? 'Wird vorbereitet …' : 'Antwortschreiben erstellen'}
        </button>
      ) : null}
    </div>
  )
}
