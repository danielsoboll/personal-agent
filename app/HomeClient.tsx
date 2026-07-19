'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import HomeHeroFlow from '@/components/home/HomeHeroFlow'
import HomePlusTeaser from '@/components/home/HomePlusTeaser'
import FreeCaseLimitSheet from '@/components/home/FreeCaseLimitSheet'
import { statusBadgeClassName } from '@/lib/caseStatus'
import { buttonStyles } from '@/lib/buttonStyles'
import { deleteCaseCompletely } from '@/lib/caseDelete'
import {
  type CaseListItem,
  listCasesForHome,
  setActiveCaseId,
  toggleCaseDone,
} from '@/lib/localCases'
import { usePlusDiscoverHeader } from '@/hooks/usePlusDiscoverHeader'
import { ensurePlusDiscoverFromHomeCases, unlockPlusDiscoverNow } from '@/lib/plusEngagement'
import { isAtFreeCaseLimit } from '@/lib/freeCaseLimit'
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [freeLimitOpen, setFreeLimitOpen] = useState(false)
  const [freeLimitBusy, setFreeLimitBusy] = useState(false)

  const loadCases = useCallback(async () => {
    const nextCases = await listCasesForHome()
    ensurePlusDiscoverFromHomeCases(nextCases)
    setCases(nextCases)
    setReady(true)
  }, [])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  function openCase(caseItem: CaseListItem) {
    setActiveCaseId(caseItem.id)
    if (caseItem.latestReview) {
      router.push('/fall')
      return
    }
    router.push('/scan')
  }

  async function handleToggleDone(caseItem: CaseListItem, event: React.MouseEvent) {
    event.stopPropagation()
    await toggleCaseDone(caseItem.id)
    await loadCases()
  }

  async function handleConfirmDelete(caseItem: CaseListItem) {
    setDeletingId(caseItem.id)
    setDeleteError('')
    try {
      await deleteCaseCompletely(caseItem.id)
      setConfirmDeleteId(null)
      await loadCases()
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'Fall konnte nicht gelöscht werden.')
    } finally {
      setDeletingId(null)
    }
  }

  const hasCases = ready && cases.length > 0
  const atFreeLimit = ready && isAtFreeCaseLimit(cases.length)
  const primaryCase = cases[0]

  function handleNewCaseClick() {
    if (!atFreeLimit) {
      router.push('/fall/neu')
      return
    }
    unlockPlusDiscoverNow()
    setFreeLimitOpen(true)
  }

  async function handleFreeLimitDelete() {
    if (!primaryCase) return
    setFreeLimitBusy(true)
    setDeleteError('')
    try {
      await deleteCaseCompletely(primaryCase.id)
      setFreeLimitOpen(false)
      await loadCases()
      router.push('/fall/neu')
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'Fall konnte nicht gelöscht werden.')
    } finally {
      setFreeLimitBusy(false)
    }
  }

  return (
    <OnboardingShell
      title="Behördenpost"
      headerAction={plus.headerAction}
      footer={
        <PrimaryButton type="button" onClick={handleNewCaseClick}>
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
              description={
                <>
                  Für den ersten Fall kannst du alle zugehörigen Dokumente kostenlos erfassen und eine Fallakte
                  aufbauen. Darauf basiert die Bewertung des gesamten Kontexts — nicht wie bei einem reinen
                  Chatbot.
                </>
              }
            />
            <HomeHeroFlow />
            <PrivacyTrustPoints />
          </>
        ) : (
          <>
            <PageIntro
              showBrand={false}
              title="Deine Fälle"
              description="Fall öffnen oder neu anlegen — kostenlos einen Fall gleichzeitig, mit PLUS mehrere parallel."
            />
            <PrivacyNote variant="storage" />
            <ul className="space-y-3">
              {cases.map((caseItem) => {
                const isEmpty = !caseItem.latestReview
                const confirming = confirmDeleteId === caseItem.id
                const deleting = deletingId === caseItem.id

                return (
                  <li key={caseItem.id} className="space-y-2">
                    <div className="flex items-center gap-2">
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

                      {isEmpty ? (
                        <button
                          type="button"
                          title="Fall löschen"
                          aria-label={`Fall „${caseItem.title}“ löschen`}
                          disabled={deleting}
                          onClick={() => {
                            setDeleteError('')
                            setConfirmDeleteId(confirming ? null : caseItem.id)
                          }}
                          className={`${buttonStyles.caseDoneToggle} border-red-300 text-red-600 hover:border-red-400 hover:text-red-700 dark:border-red-900 dark:text-red-300`}
                        >
                          ✕
                        </button>
                      ) : (
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
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveCaseId(caseItem.id)
                        router.push('/fallakte')
                      }}
                      className={buttonStyles.secondary}
                    >
                      Fallakte einsehen
                    </button>

                    {confirming ? (
                      <div className="rounded-2xl border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                        <p className="text-sm text-red-900 dark:text-red-100">
                          Fall „{caseItem.title}“ löschen?
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => void handleConfirmDelete(caseItem)}
                            className={buttonStyles.dangerSolid}
                          >
                            {deleting ? 'Wird gelöscht …' : 'Ja'}
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className={buttonStyles.dangerCancel}
                          >
                            Nein
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            {deleteError ? (
              <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {deleteError}
              </p>
            ) : null}
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
      {freeLimitOpen && primaryCase ? (
        <FreeCaseLimitSheet
          caseTitle={primaryCase.title}
          busy={freeLimitBusy}
          onDeleteCase={() => void handleFreeLimitDelete()}
          onDiscoverPlus={() => {
            setFreeLimitOpen(false)
            plus.openPlusDiscover()
          }}
          onClose={() => setFreeLimitOpen(false)}
        />
      ) : null}
    </OnboardingShell>
  )
}
