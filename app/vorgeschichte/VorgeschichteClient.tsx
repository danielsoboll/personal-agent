'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import OnboardingShell, { PageIntro } from '@/components/onboarding/OnboardingShell'
import { buttonStyles } from '@/lib/buttonStyles'
import { openHistorischBlock } from '@/lib/caseFileOps'
import { getActiveCase, saveCaseFileContent, type StoredCase } from '@/lib/localCases'

export default function VorgeschichteClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const done = searchParams.get('done') === '1'
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const current = await getActiveCase()
      if (!current) {
        router.replace('/')
        return
      }
      setActiveCase(current)
      setLoading(false)
    }
    void load()
  }, [router])

  async function startUpload() {
    if (!activeCase) return
    setBusy(true)
    setError('')
    try {
      const content = activeCase.caseFileContent || activeCase.latestReview?.caseFileContent || ''
      if (content.trim()) {
        const next = openHistorischBlock(content)
        await saveCaseFileContent(activeCase.id, next)
      }
      router.push('/scan?intent=historical&from=vorgeschichte')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Weiterleiten fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <OnboardingShell
      title="Vorgeschichte"
      subtitle={activeCase?.title ?? 'Behördenpost'}
      backNav={{ href: '/fall', label: 'Zurück zum Fall' }}
    >
      <section className="flex flex-col gap-5">
        {loading ? (
          <p className="text-sm text-muted">Wird geladen …</p>
        ) : done ? (
          <>
            <PageIntro
              showBrand={false}
              title="Noch ein früheres Dokument ergänzen?"
              description="Das Dokument wurde ausgewertet und in die Fallakte einsortiert."
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void startUpload()}
              className={buttonStyles.primaryActive}
            >
              Weiteres Dokument hochladen
            </button>
            <button
              type="button"
              onClick={() => router.push('/fall')}
              className="text-center text-sm font-medium text-accent"
            >
              Zurück zum Fall
            </button>
          </>
        ) : (
          <>
            <PageIntro
              showBrand={false}
              title="Vorgeschichte ergänzen"
              description="Lade frühere Schreiben, E-Mails, Bescheide, Antworten oder Nachweise hoch. Die App ordnet sie anschließend zeitlich und inhaltlich ein."
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void startUpload()}
              className={buttonStyles.primaryActive}
            >
              Früheres Dokument hochladen
            </button>
            <p className="text-center text-sm leading-6 text-muted">
              Du kannst mehrere Unterlagen nacheinander ergänzen.
            </p>
            <button
              type="button"
              onClick={() => router.push('/fall')}
              className="text-center text-sm font-medium text-accent"
            >
              Zurück zum Fall
            </button>
            {error ? (
              <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </>
        )}
      </section>
    </OnboardingShell>
  )
}
