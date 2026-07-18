'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import HomeHeroFlow from '@/components/home/HomeHeroFlow'
import HomePlusTeaser from '@/components/home/HomePlusTeaser'
import FreeTrialCallout from '@/components/home/FreeTrialCallout'
import { statusBadgeClassName } from '@/lib/caseStatus'
import { buttonStyles } from '@/lib/buttonStyles'
import {
  type CaseListItem,
  listCasesForHome,
  setActiveCaseId,
  toggleCaseDone,
} from '@/lib/localCases'
import { usePlusDiscoverHeader } from '@/hooks/usePlusDiscoverHeader'
import { ensurePlusDiscoverFromCaseCount } from '@/lib/plusEngagement'
import OnboardingShell, { PageIntro, PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
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

  const loadCases = useCallback(async () => {
    const nextCases = await listCasesForHome()
    ensurePlusDiscoverFromCaseCount(nextCases.length)
    setCases(nextCases)
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
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/bibliothek" className={buttonStyles.header}>
            <span className="sm:hidden" aria-label="Bibliothek">
              📄
            </span>
            <span className="hidden sm:inline">Bibliothek</span>
          </Link>
          {plus.headerAction}
        </div>
      }
      footer={
        <PrimaryButton href="/fall/neu">
          {hasCases ? 'Neuen Fall anlegen' : 'Jetzt Dokument fotografieren'}
        </PrimaryButton>
      }
    >
      <section className="flex flex-col gap-6">
        {!ready ? (
          <p className="text-sm text-muted">Fälle werden geladen …</p>
        ) : !hasCases ? (
          <>
            <PageIntro
              showBrand={false}
              title="Briefe, Anträge und E-Mails besser verstehen"
              description="Mit klaren nächsten Schritten — direkt auf dem Handy."
            />
            <HomeHeroFlow />
            <FreeTrialCallout />
            {plus.visible && !plus.plusActive ? (
              <HomePlusTeaser onDiscover={plus.openPlusDiscover} />
            ) : null}
            <PrivacyTrustPoints />
          </>
        ) : (
          <>
            <PageIntro
              showBrand={false}
              title="Deine Fälle"
              description="Fall öffnen oder neu anlegen — jeder Fall getrennt auf dem Handy."
            />
            <PrivacyNote variant="storage" />
            <ul className="space-y-3">
              {cases.map((caseItem) => (
                <li key={caseItem.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCase(caseItem)}
                    className={`${buttonStyles.caseListItem} min-w-0 flex-1`}
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

                    <span className="shrink-0 text-lg text-muted" aria-hidden>
                      ›
                    </span>
                  </button>

                  <button
                    type="button"
                    title={
                      caseItem.userStatus === 'vorerst_erledigt'
                        ? 'Vorerst erledigt aufheben'
                        : 'Als vorerst erledigt markieren'
                    }
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
            {plus.visible && !plus.plusActive ? (
              <HomePlusTeaser onDiscover={plus.openPlusDiscover} />
            ) : null}
          </>
        )}

        <div className="flex flex-col items-center gap-6 pt-2">
          <Link href="/admin" className={buttonStyles.admin}>
            Admin
          </Link>
          <LegalFooterNav />
        </div>
      </section>
      {plus.portals}
    </OnboardingShell>
  )
}
