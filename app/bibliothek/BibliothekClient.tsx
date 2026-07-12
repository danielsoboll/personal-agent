'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import OnboardingShell, { PrimaryButton } from '@/components/onboarding/OnboardingShell'
import { downloadBlob } from '@/lib/analyzeClient'
import {
  formatLibraryDate,
  getLibraryDocument,
  listLibraryDocuments,
  type LibraryDocumentSummary,
} from '@/lib/localLibrary'

export default function BibliothekClient() {
  const [documents, setDocuments] = useState<LibraryDocumentSummary[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [openingId, setOpeningId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setDocuments(await listLibraryDocuments())
      setReady(true)
    }

    void load()
  }, [])

  async function openDocument(id: string) {
    setError('')
    setOpeningId(id)

    try {
      const record = await getLibraryDocument(id)
      if (!record) {
        throw new Error('Dokument nicht gefunden.')
      }

      downloadBlob(record.blob, record.fileName)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Dokument konnte nicht geöffnet werden.')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <OnboardingShell
      title="Bibliothek"
      subtitle="Generierte Schreiben"
      footer={<PrimaryButton href="/">Zur Fallübersicht</PrimaryButton>}
    >
      <section className="flex flex-1 flex-col gap-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Deine Dokumente</h2>
          <p className="leading-7 text-muted">
            Hier findest du alle Word-Schreiben, die du mit „Schritt vorbereiten“ erstellt hast. Tippe auf ein
            Dokument, um es erneut herunterzuladen.
          </p>
        </div>

        {!ready ? (
          <p className="text-sm text-muted">Bibliothek wird geladen …</p>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-5 text-sm leading-7 text-muted">
            Noch keine Dokumente. Nach der abschließenden Bewertung kannst du bei jedem Schritt ein Schreiben
            vorbereiten — es landet dann hier.
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => void openDocument(doc.id)}
                  disabled={openingId === doc.id}
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-accent disabled:opacity-60"
                >
                  <p className="text-base font-semibold">{doc.title}</p>
                  <p className="mt-1 text-sm text-muted">{doc.caseTitle}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{doc.previewText || doc.stepText}</p>
                  <p className="mt-2 text-xs text-muted">
                    {formatLibraryDate(doc.createdAt)} · {doc.fileName}
                  </p>
                  {openingId === doc.id ? (
                    <p className="mt-2 text-xs font-medium text-accent">Wird geöffnet …</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <Link href="/" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
          Zurück zur Fallübersicht
        </Link>
      </section>
    </OnboardingShell>
  )
}
