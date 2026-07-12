'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { statusBadgeClassName } from '@/lib/caseStatus'
import {
  type CaseListItem,
  listCasesForHome,
  setActiveCaseId,
  toggleCaseDone,
} from '@/lib/localCases'
import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import PrivacyTrustPoints from '@/components/onboarding/PrivacyTrustPoints'
import LegalFooterNav from '@/components/legal/LegalFooterNav'

function formatCaseDateShort(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' }).format(new Date(timestamp))
}

export default function HomeClient() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseListItem[]>([])
  const [ready, setReady] = useState(false)

  const loadCases = useCallback(async () => {
    setCases(await listCasesForHome())
    setReady(true)
  }, [])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  function openCase(caseItem: CaseListItem) {
    setActiveCaseId(caseItem.id)
    if (caseItem.latestReview) {
      router.push('/pruefen')
      return
    }
    router.push('/scan')
  }

  async function handleToggleDone(caseItem: CaseListItem, event: React.MouseEvent) {
    event.stopPropagation()
    await toggleCaseDone(caseItem.id)
    await loadCases()
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
              : 'Behördenpost und wichtige Schreiben verstehen — mit klaren nächsten Schritten, direkt auf dem Handy.'}
          </p>
        </div>

        {!hasCases && ready ? <PrivacyTrustPoints /> : null}

        {hasCases ? <PrivacyNote variant="storage" /> : null}

        {!ready ? (
          <p className="text-sm text-muted">Fälle werden geladen …</p>
        ) : hasCases ? (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {cases.map((caseItem) => (
              <li key={caseItem.id} className="flex items-center gap-2.5 px-4 py-4">
                <button
                  type="button"
                  onClick={() => openCase(caseItem)}
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left transition-colors hover:opacity-80"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold tabular-nums text-accent">
                    {caseItem.caseNumber}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold leading-snug">{caseItem.title}</p>
                    <p className="truncate text-sm text-muted">{formatCaseDateShort(caseItem.updatedAt)}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClassName(caseItem.displayStatus.tone)}`}
                  >
                    {caseItem.displayStatus.label}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label={
                    caseItem.userStatus === 'vorerst_erledigt'
                      ? 'Vorerst erledigt aufheben'
                      : 'Als vorerst erledigt markieren'
                  }
                  onClick={(event) => void handleToggleDone(caseItem, event)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm transition-colors ${
                    caseItem.userStatus === 'vorerst_erledigt'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-border text-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  {caseItem.userStatus === 'vorerst_erledigt' ? '✓' : '○'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3 text-sm leading-6 text-muted">
            <p>So geht&apos;s beim ersten Fall:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Fall benennen (z. B. „Unterhalt Neuberechnung“)</li>
              <li>Dokument fotografieren und prüfen lassen</li>
            </ol>
            <p>Später findest du hier alle Fälle wieder — klar getrennt voneinander.</p>
          </div>
        )}

        {!hasCases && ready ? (
          <p className="text-sm text-muted">
            Bereit?{' '}
            <Link href="/fall/neu" className="font-medium text-accent underline-offset-4 hover:underline">
              Ersten Fall anlegen
            </Link>
          </p>
        ) : null}

        <LegalFooterNav className="pt-2" />
      </section>
    </OnboardingShell>
  )
}
