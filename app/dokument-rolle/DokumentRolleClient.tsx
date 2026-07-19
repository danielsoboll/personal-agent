'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, { PageIntro } from '@/components/onboarding/OnboardingShell'
import { buttonStyles } from '@/lib/buttonStyles'
import type { AnalyzeIntent } from '@/lib/analyzeTypes'
import { openAktuellBlock, openHistorischBlock } from '@/lib/caseFileOps'
import { getActiveCase, saveCaseFileContent, type StoredCase } from '@/lib/localCases'

type RoleOption = {
  id: string
  label: string
  intent: AnalyzeIntent
  hint?: string
  prepare: 'aktuell' | 'historisch' | 'none'
}

const ROLES: RoleOption[] = [
  {
    id: 'history',
    label: 'Frühere Vorgeschichte',
    intent: 'historical',
    prepare: 'historisch',
  },
  {
    id: 'reply',
    label: 'Antwort oder Anlage zum aktuellen Schreiben',
    intent: 'current_more',
    prepare: 'aktuell',
  },
  {
    id: 'current_more',
    label: 'Weiteres aktuelles Dokument',
    intent: 'current_more',
    prepare: 'aktuell',
  },
  {
    id: 'new_letter',
    label: 'Späteres neues Schreiben',
    intent: 'initial',
    prepare: 'none',
  },
  {
    id: 'unknown',
    label: 'Weiß ich nicht',
    intent: 'historical',
    prepare: 'historisch',
    hint: 'Kein Problem. Die App ordnet das Dokument zunächst vorsichtig ein.',
  },
]

export default function DokumentRolleClient() {
  const router = useRouter()
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

  async function choose(role: RoleOption) {
    if (!activeCase) return
    setBusy(true)
    setError('')
    try {
      const content = activeCase.caseFileContent || activeCase.latestReview?.caseFileContent || ''
      if (content.trim() && role.prepare === 'historisch') {
        await saveCaseFileContent(activeCase.id, openHistorischBlock(content))
      } else if (content.trim() && role.prepare === 'aktuell') {
        await saveCaseFileContent(
          activeCase.id,
          openAktuellBlock(content, 'Ergänzung aktuelles Schreiben'),
        )
      }
      const params = new URLSearchParams({ intent: role.intent, from: 'rolle' })
      router.push(`/scan?${params.toString()}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Weiterleiten fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <OnboardingShell
      title="Dokument ergänzen"
      subtitle={activeCase?.title ?? 'Behördenpost'}
      backNav={{ href: '/fall', label: 'Zurück zum Fall' }}
    >
      <section className="flex flex-col gap-5">
        {loading ? (
          <p className="text-sm text-muted">Wird geladen …</p>
        ) : (
          <>
            <PageIntro
              showBrand={false}
              title="Welche Rolle hat dieses Dokument im Fall?"
              description="So kann die App das Dokument richtig einordnen — ohne etwas zu überschreiben."
            />
            <ul className="space-y-2">
              {ROLES.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void choose(role)}
                    className={`${buttonStyles.secondary} h-auto min-h-12 py-3 text-left`}
                  >
                    <span className="block">{role.label}</span>
                    {role.hint ? (
                      <span className="mt-1 block text-xs font-normal leading-5 text-muted">
                        {role.hint}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
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
