'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, { PageIntro } from '@/components/onboarding/OnboardingShell'
import DeleteCaseSection from '@/components/review/DeleteCaseSection'
import { buttonStyles } from '@/lib/buttonStyles'
import { openAktuellBlock } from '@/lib/caseFileOps'
import { deriveCaseHistoryStatus, type CaseHistoryStatus } from '@/lib/caseHistoryStatus'
import { formatDeadlineDate } from '@/lib/deadlineDisplay'
import { displaySummary, shouldShowSummary } from '@/lib/reviewDisplay'
import { getActiveCase, restorePreviousLatestReview, saveCaseFileContent, type StoredCase } from '@/lib/localCases'
import { assessmentSubjectLabel } from '@/lib/caseReviewIdentity'
import { listFallakteEvents } from '@/lib/localFallakte'
import { listFallakteRelations } from '@/lib/localFallakteRelations'
import type { FallakteEvent } from '@/lib/fallakteTypes'
import type { FallakteRelation } from '@/lib/fallakteRelationTypes'

const cardActionClass = `${buttonStyles.secondary} mt-3`

export default function FallHubClient() {
  const router = useRouter()
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [events, setEvents] = useState<FallakteEvent[]>([])
  const [relations, setRelations] = useState<FallakteRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function load() {
      const current = await getActiveCase()
      if (!current) {
        router.replace('/')
        return
      }
      if (!current.latestReview) {
        router.replace('/scan')
        return
      }
      setActiveCase(current)
      const [nextEvents, nextRelations] = await Promise.all([
        listFallakteEvents(current.id),
        listFallakteRelations(current.id),
      ])
      setEvents(nextEvents)
      setRelations(nextRelations)
      setLoading(false)
    }
    void load()
  }, [router])

  const review = activeCase?.latestReview ?? null
  const status: CaseHistoryStatus | null =
    activeCase && review
      ? deriveCaseHistoryStatus({
          latestReview: review,
          caseFileContent: activeCase.caseFileContent ?? review.caseFileContent,
          events,
          relations,
        })
      : null

  async function startCurrentMore() {
    if (!activeCase || !review) return
    setBusy(true)
    try {
      const content = activeCase.caseFileContent || review.caseFileContent || ''
      if (content.trim()) {
        await saveCaseFileContent(
          activeCase.id,
          openAktuellBlock(content, 'Ergänzung aktuelles Schreiben'),
        )
      }
      router.push('/scan?intent=current_more')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Weiterleiten fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <OnboardingShell
      title="Dein Fall"
      subtitle={activeCase?.title ?? 'Behördenpost'}
      backNav={{ href: '/', label: 'Zurück zur Fallübersicht' }}
    >
      <section className="flex flex-col gap-4">
        {loading || !activeCase || !review || !status ? (
          <p className="text-sm text-muted">Fall wird geladen …</p>
        ) : (
          <>
            <PageIntro showBrand={false} title={activeCase.title} description={status.detail} />

            <article className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Aktuelles Schreiben
              </p>
              {shouldShowSummary(review.summary, review.assessment) ? (
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-foreground/90">
                  {displaySummary(review.summary)}
                </p>
              ) : (
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-foreground/90">
                  {review.assessment}
                </p>
              )}
              {review.primaryDeadline ? (
                <p className="mt-1.5 text-sm font-medium text-amber-900 dark:text-amber-100">
                  Frist: {formatDeadlineDate(review.primaryDeadline)}
                </p>
              ) : null}
              <button type="button" onClick={() => router.push('/pruefen')} className={cardActionClass}>
                Auswertung ansehen
              </button>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Vorgeschichte</p>
              <p className="mt-1 text-base font-semibold tracking-tight">{status.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {status.historicalDocCount === 0
                  ? 'Noch keine früheren Dokumente'
                  : `${status.historicalDocCount} frühere Dokumente · ${status.openCount} offen`}
              </p>
              <button
                type="button"
                onClick={() => router.push('/vorgeschichte')}
                className={cardActionClass}
              >
                Vorgeschichte ergänzen
              </button>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fallakte</p>
              <p className="mt-1 text-sm leading-6 text-foreground/90">
                {status.timelineTotal} Punkte · {status.confirmedCount} bestätigt · {status.openCount}{' '}
                offen
                {status.relationCount > 0 ? ` · ${status.relationCount} Zusammenhänge` : ''}
              </p>
              <button type="button" onClick={() => router.push('/fallakte')} className={cardActionClass}>
                Fallakte ansehen
              </button>
            </article>

            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className="text-sm font-medium text-accent"
              >
                {moreOpen ? 'Weitere Optionen ausblenden' : 'Weitere Optionen'}
              </button>
              {moreOpen ? (
                <ul className="mt-3 space-y-3">
                  <li>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void startCurrentMore()}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Antwort oder Anlage ergänzen
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => router.push('/scan?intent=initial')}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Neues Schreiben zum Fall hinzufügen
                    </button>
                  </li>
                  {review.readyForFinalAssessment || review.phase === 'final' ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => router.push('/pruefen')}
                        className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        {assessmentSubjectLabel({
                          latestReview: review,
                        })}
                      </button>
                    </li>
                  ) : null}
                  {activeCase.previousLatestReview ? (
                    <li>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          void (async () => {
                            setBusy(true)
                            setError('')
                            try {
                              const restored = await restorePreviousLatestReview(activeCase.id)
                              if (!restored) {
                                setError('Keine vorherige Auswertung gefunden.')
                                return
                              }
                              const refreshed = await getActiveCase()
                              if (refreshed) setActiveCase(refreshed)
                            } catch (caught) {
                              setError(
                                caught instanceof Error
                                  ? caught.message
                                  : 'Wiederherstellen fehlgeschlagen.',
                              )
                            } finally {
                              setBusy(false)
                            }
                          })()
                        }}
                        className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        Vorherige Auswertung wiederherstellen
                      </button>
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      onClick={() => router.push('/diagnose')}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Fall-Diagnose (lokal)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => router.push('/pruefen?chat=1')}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Chatverlauf
                      {(review.followUpMessages?.length ?? 0) > 0
                        ? ` (${Math.ceil((review.followUpMessages?.length ?? 0) / 2)})`
                        : ''}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => router.push('/bibliothek')}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Bibliothek
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}

            <div className="mt-6 border-t border-border pt-6">
              <DeleteCaseSection
                caseId={activeCase.id}
                caseTitle={activeCase.title}
                disabled={busy}
                onDeleted={() => router.replace('/')}
                onError={setError}
              />
            </div>
          </>
        )}
      </section>
    </OnboardingShell>
  )
}
