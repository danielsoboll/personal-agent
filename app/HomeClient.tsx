'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { type CaseSummary, listCases, setActiveCaseId } from '@/lib/localCases'

function formatCaseDate(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function caseStatus(caseItem: CaseSummary): { label: string; tone: 'open' | 'done' | 'new' } {
  if (!caseItem.latestReview) {
    return { label: 'Neu', tone: 'new' }
  }
  if (caseItem.latestReview.phase === 'final' || caseItem.latestReview.isComplete) {
    return { label: 'Bewertet', tone: 'done' }
  }
  if (caseItem.latestReview.readyForFinalAssessment) {
    return { label: 'Bereit zur Bewertung', tone: 'open' }
  }
  return { label: 'In Bearbeitung', tone: 'open' }
}

export default function HomeClient() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function loadCases() {
      setCases(await listCases())
      setReady(true)
    }

    void loadCases()
  }, [])

  function openCase(caseItem: CaseSummary) {
    setActiveCaseId(caseItem.id)
    if (caseItem.latestReview) {
      router.push('/pruefen')
      return
    }
    router.push('/scan')
  }

  const hasCases = ready && cases.length > 0

  return (
    <OnboardingShell
      title="Behördenpost"
      headerAction={
        <Link
          href="/bibliothek"
          className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Bibliothek
        </Link>
      }
      footer={<PrimaryButton href="/fall/neu">Neuen Fall anlegen</PrimaryButton>}
    >
      <section className="flex flex-1 flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Dein persönlicher Helfer
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
            {hasCases ? 'Deine Fälle' : 'Briefe, Anträge und E-Mails besser verstehen'}
          </h2>
          <p className="text-lg leading-8 text-muted">
            {hasCases
              ? 'Wähle einen bestehenden Fall oder lege einen neuen an. Jeder Fall bleibt getrennt auf deinem Handy gespeichert.'
              : 'Diese App hilft dir, alltägliche Briefe, Anträge und E-Mails mit deinem persönlichen Hintergrund besser zu verstehen.'}
          </p>
        </div>

        <PrivacyNote variant="storage" />

        {!ready ? (
          <p className="text-sm text-muted">Fälle werden geladen …</p>
        ) : hasCases ? (
          <ul className="space-y-3">
            {cases.map((caseItem) => {
              const status = caseStatus(caseItem)
              return (
                <li key={caseItem.id}>
                  <button
                    type="button"
                    onClick={() => openCase(caseItem)}
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{caseItem.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          Zuletzt bearbeitet: {formatCaseDate(caseItem.updatedAt)}
                        </p>
                        {caseItem.latestReview ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                            {caseItem.latestReview.assessment}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-muted">Noch keine Prüfung gestartet</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          status.tone === 'done'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : status.tone === 'open'
                              ? 'bg-accent-soft text-accent'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="space-y-3 text-sm leading-6 text-muted">
            <p>So geht&apos;s beim ersten Fall:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Fall benennen (z. B. „Unterhalt Neuberechnung“)</li>
              <li>Deinen Vornamen eingeben</li>
              <li>Dokument fotografieren und prüfen lassen</li>
            </ol>
            <p>Später findest du hier alle Fälle wieder — klar getrennt voneinander.</p>
          </div>
        )}

        {ready && !hasCases ? (
          <p className="text-sm text-muted">
            Bereit?{' '}
            <Link href="/fall/neu" className="font-medium text-accent underline-offset-4 hover:underline">
              Ersten Fall anlegen
            </Link>
          </p>
        ) : null}
      </section>
    </OnboardingShell>
  )
}
