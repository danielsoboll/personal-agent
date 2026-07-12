'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import type { AnalyzeResult } from '@/lib/analyzeTypes'
import { getActiveCase, type StoredCase } from '@/lib/localCases'

export default function ReviewPage() {
  const router = useRouter()
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [review, setReview] = useState<AnalyzeResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReview() {
      const currentCase = await getActiveCase()
      if (!currentCase) {
        router.replace('/')
        return
      }

      setActiveCase(currentCase)
      setReview(currentCase.latestReview)
      setLoading(false)
    }

    void loadReview()
  }, [router])

  const followUpHref = '/scan?mode=followup'

  return (
    <OnboardingShell
      title="Auswertung"
      subtitle={activeCase?.title ?? 'Behördenpost'}
      footer={
        review ? (
          <div className="space-y-3">
            {review.needsMoreDocuments && !review.isComplete ? (
              <PrimaryButton href={followUpHref}>Weitere Unterlagen fotografieren</PrimaryButton>
            ) : (
              <PrimaryButton href="/">Zur Fallübersicht</PrimaryButton>
            )}
            <Link
              href="/fall/neu"
              className="flex h-12 w-full items-center justify-center text-sm font-medium text-muted"
            >
              Neuen Fall anlegen
            </Link>
          </div>
        ) : (
          <PrimaryButton href="/scan">Zum Fotografieren</PrimaryButton>
        )
      }
    >
      <section className="flex flex-1 flex-col gap-6">
        {loading ? (
          <p className="text-sm text-muted">Auswertung wird geladen …</p>
        ) : review ? (
          <>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Deine Bewertung</h2>
              <p className="leading-8 text-foreground">{review.assessment}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-base font-semibold">Nächste Schritte</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{review.nextSteps}</p>
            </div>

            {review.needsMoreDocuments && review.requestedDocuments ? (
              <div className="rounded-2xl border border-accent/25 bg-accent-soft p-5">
                <h3 className="text-base font-semibold">Dafür brauchen wir noch Fotos</h3>
                <p className="mt-3 text-sm leading-7 text-foreground">{review.requestedDocuments}</p>
              </div>
            ) : null}

            {review.isComplete ? (
              <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                Aus unserer Sicht ist genug Kontext da, um die aktuelle Post belastbar einzuordnen.
              </p>
            ) : null}

            <PrivacyNote variant="storage" />

            <p className="text-xs leading-6 text-muted">
              {review.photoCount} Foto{review.photoCount === 1 ? '' : 's'} ausgewertet · verarbeitete
              Fotos wurden vom Gerät gelöscht
            </p>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Noch keine Auswertung</h2>
              <p className="leading-7 text-muted">
                Fotografiere zuerst ein Schreiben und tippe auf Prüfen. Danach siehst du hier die
                Bewertung und nächsten Schritte für „{activeCase?.title}“.
              </p>
            </div>
            <PrivacyNote variant="analysis" />
          </>
        )}
      </section>
    </OnboardingShell>
  )
}
