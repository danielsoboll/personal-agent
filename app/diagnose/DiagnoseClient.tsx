'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, { PageIntro } from '@/components/onboarding/OnboardingShell'
import {
  diagnoseActiveCase,
  inferCurrentDocumentIdFromDocuments,
  type CaseDiagnosisReport,
} from '@/lib/caseDiagnosis'
import { getActiveCase, restorePreviousLatestReview } from '@/lib/localCases'

export default function DiagnoseClient() {
  const router = useRouter()
  const [report, setReport] = useState<CaseDiagnosisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function reload() {
    const next = await diagnoseActiveCase()
    setReport(next)
  }

  useEffect(() => {
    async function load() {
      const active = await getActiveCase()
      if (!active) {
        router.replace('/')
        return
      }
      await reload()
      setLoading(false)
    }
    void load()
  }, [router])

  return (
    <OnboardingShell
      title="Fall-Diagnose"
      subtitle={report?.title ?? 'Behördenpost'}
      backNav={{ href: '/fall', label: 'Zurück zum Fall' }}
    >
      <section className="flex flex-col gap-4">
        {loading || !report ? (
          <p className="text-sm text-muted">Diagnose wird geladen …</p>
        ) : (
          <>
            <PageIntro
              showBrand={false}
              title="Lokale Diagnose (nur Lesen + gezielte Reparatur)"
              description="Kein Reset. Fallakte wird nicht gelöscht. Hilft bei inkonsistenter Auswertung nach Historie-Uploads."
            />

            <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-3 text-xs leading-5 text-foreground">
              {JSON.stringify(report, null, 2)}
            </pre>

            <ul className="space-y-2 text-sm leading-6 text-muted">
              {report.recoveryHints.map((hint) => (
                <li key={hint}>• {hint}</li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <button
                type="button"
                disabled={busy || !report.previousLatestReview}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    setError('')
                    setMessage('')
                    try {
                      const restored = await restorePreviousLatestReview(report.caseId)
                      setMessage(
                        restored
                          ? 'Vorherige Auswertung wiederhergestellt.'
                          : 'Keine vorherige Version vorhanden.',
                      )
                      await reload()
                    } catch (caught) {
                      setError(caught instanceof Error ? caught.message : 'Wiederherstellen fehlgeschlagen.')
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
                className="text-left text-sm font-medium text-accent disabled:opacity-40"
              >
                Vorherige Auswertung wiederherstellen
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    setError('')
                    setMessage('')
                    try {
                      const id = await inferCurrentDocumentIdFromDocuments(report.caseId)
                      setMessage(
                        id
                          ? `currentDocumentId gesetzt: ${id}`
                          : 'Kein Dokument gefunden — aktuelles Schreiben ggf. erneut hochladen.',
                      )
                      await reload()
                    } catch (caught) {
                      setError(caught instanceof Error ? caught.message : 'Zuordnung fehlgeschlagen.')
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
                className="text-left text-sm font-medium text-accent disabled:opacity-40"
              >
                currentDocumentId aus Dokumenten ableiten
              </button>
              <button
                type="button"
                onClick={() => router.push('/pruefen')}
                className="text-left text-sm font-medium text-accent"
              >
                Zur Auswertung / Neubewertung
              </button>
            </div>

            {message ? <p className="text-sm text-emerald-800 dark:text-emerald-200">{message}</p> : null}
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
