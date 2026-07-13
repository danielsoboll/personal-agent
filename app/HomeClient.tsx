'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { statusBadgeClassName } from '@/lib/caseStatus'
import { buttonStyles } from '@/lib/buttonStyles'
import { isLocalDevClient } from '@/lib/clientDev'
import {
  type CaseListItem,
  listCasesForHome,
  setActiveCaseId,
  toggleCaseDone,
} from '@/lib/localCases'
import FreeTrialCallout from '@/components/home/FreeTrialCallout'
import HomeHeroFlow from '@/components/home/HomeHeroFlow'
import { usePlusDiscoverHeader } from '@/hooks/usePlusDiscoverHeader'
import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import PrivacyTrustPoints from '@/components/onboarding/PrivacyTrustPoints'
import LegalFooterNav from '@/components/legal/LegalFooterNav'

function formatCaseDateShort(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short' }).format(new Date(timestamp))
}

export default function HomeClient() {
  const router = useRouter()
  const plus = usePlusDiscoverHeader()
  const [cases, setCases] = useState<CaseListItem[]>([])
  const [ready, setReady] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const loadCases = useCallback(async () => {
    setCases(await listCasesForHome())
    setReady(true)
  }, [])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  useEffect(() => {
    setShowAdmin(isLocalDevClient())
  }, [])

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
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/bibliothek" className={buttonStyles.header}>
            Bibliothek
          </Link>
          {plus.headerAction}
        </div>
      }
      footer={<PrimaryButton href="/fall/neu">Jetzt Dokument fotografieren</PrimaryButton>}
    >
      <section className="flex flex-1 flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Dein persönlicher Helfer
          </p>
          <h2 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-balance">
            {hasCases ? 'Deine Fälle' : 'Briefe, Anträge und E-Mails besser verstehen'}
          </h2>
        </div>

        {!hasCases && ready ? <HomeHeroFlow /> : null}

        <p className="text-lg leading-8 text-muted">
          {hasCases
            ? 'Wähle einen bestehenden Fall oder lege einen neuen an. Jeder Fall bleibt getrennt auf deinem Handy gespeichert.'
            : 'Behördenpost und wichtige Schreiben verstehen — mit klaren nächsten Schritten, direkt auf dem Handy.'}
        </p>

        {!hasCases && ready ? <FreeTrialCallout /> : null}

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
                  className={`${buttonStyles.caseDoneToggle} ${
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
        ) : null}

        {!hasCases && ready ? (
          <p className="text-sm text-muted">
            Bereit?{' '}
            <Link href="/fall/neu" className="font-medium text-accent underline-offset-4 hover:underline">
              Jetzt Dokument fotografieren
            </Link>
          </p>
        ) : null}

        <div className={`flex flex-col items-center pt-4 ${showAdmin ? 'gap-6' : 'gap-0'}`}>
          {showAdmin ? (
            <Link href="/admin" className={buttonStyles.admin}>
              Admin
            </Link>
          ) : null}
          <LegalFooterNav />
        </div>
      </section>
      {plus.portals}
    </OnboardingShell>
  )
}
