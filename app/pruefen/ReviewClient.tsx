'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import AnalyzingOverlay from '@/components/AnalyzingOverlay'
import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import DocumentsStatusPanel from '@/components/review/DocumentsStatusPanel'
import {
  base64ToBlob,
  downloadBlob,
  prepareStepDocument,
  requestFinalAssessment,
} from '@/lib/analyzeClient'
import type { AnalyzeResult, StructuredStep } from '@/lib/analyzeTypes'
import { normalizeDocumentsFields } from '@/lib/analyzeSchema'
import {
  closeOpenAktuellBlock,
  markReadyForAssessment,
  openAktuellBlock,
  openHistorischBlock,
} from '@/lib/caseFileOps'
import {
  getActiveCase,
  saveCaseFileContent,
  saveLatestReview,
  type StoredCase,
} from '@/lib/localCases'
import { saveLibraryDocument } from '@/lib/localLibrary'

function normalizeReview(review: AnalyzeResult & { round?: string }): AnalyzeResult {
  const legacyIntent =
    review.intent ??
    (review.round === 'initial' ? 'initial' : review.round === 'followup' ? 'current_more' : 'initial')

  const docs = normalizeDocumentsFields(review)

  return {
    ...review,
    summary: review.summary || review.assessment?.slice(0, 180) || '',
    structuredSteps: review.structuredSteps ?? [],
    documentChoiceRequired: review.documentChoiceRequired ?? legacyIntent === 'initial',
    readyForFinalAssessment: review.readyForFinalAssessment ?? false,
    phase: review.phase ?? (review.isComplete ? 'final' : 'interim'),
    intent: legacyIntent,
    ...docs,
  }
}

function priorityLabel(priority?: string): string | null {
  if (priority === 'hoch') return 'Dringend'
  if (priority === 'mittel') return 'Mittel'
  if (priority === 'niedrig') return 'Niedrig'
  return null
}

export default function ReviewClient() {
  const router = useRouter()
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [review, setReview] = useState<AnalyzeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [busyStepId, setBusyStepId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [preparedPreview, setPreparedPreview] = useState<{ title: string; text: string; fileName: string } | null>(
    null,
  )

  useEffect(() => {
    async function loadReview() {
      const currentCase = await getActiveCase()
      if (!currentCase) {
        router.replace('/')
        return
      }

      setActiveCase(currentCase)
      setReview(currentCase.latestReview ? normalizeReview(currentCase.latestReview) : null)
      setLoading(false)
    }

    void loadReview()
  }, [router])

  async function persistCaseFile(content: string) {
    if (!activeCase) return
    await saveCaseFileContent(activeCase.id, content)
  }

  async function persistReview(nextReview: AnalyzeResult) {
    if (!activeCase) return
    await saveLatestReview(activeCase.id, nextReview)
    setReview(nextReview)
    setActiveCase({ ...activeCase, latestReview: nextReview })
  }

  async function handleDocumentChoice(mode: 'current_more' | 'historical' | 'all_captured') {
    if (!activeCase || !review?.caseFileContent) return

    setError('')
    setBusy(true)

    try {
      let caseFile = closeOpenAktuellBlock(review.caseFileContent)

      if (mode === 'current_more') {
        caseFile = openAktuellBlock(caseFile, 'Ergänzung aktuelles Schreiben')
        await persistCaseFile(caseFile)
        await persistReview({
          ...review,
          caseFileContent: caseFile,
          documentChoiceRequired: false,
          readyForFinalAssessment: false,
        })
        router.push('/scan?intent=current_more')
        return
      }

      if (mode === 'historical') {
        caseFile = openHistorischBlock(caseFile)
        await persistCaseFile(caseFile)
        await persistReview({
          ...review,
          caseFileContent: caseFile,
          documentChoiceRequired: false,
          readyForFinalAssessment: false,
        })
        router.push('/scan?intent=historical')
        return
      }

      caseFile = markReadyForAssessment(caseFile)
      await persistCaseFile(caseFile)
      await persistReview({
        ...review,
        caseFileContent: caseFile,
        documentChoiceRequired: false,
        readyForFinalAssessment: true,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Aktion fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  async function handleFinalAssessment() {
    if (!activeCase || !review) return

    setError('')
    setBusy(true)

    try {
      const result = await requestFinalAssessment()
      const nextReview: AnalyzeResult = {
        ...result,
        documentChoiceRequired: false,
        readyForFinalAssessment: false,
        analyzedAt: Date.now(),
        intent: 'final',
        photoCount: review.photoCount,
      }

      await saveCaseFileContent(activeCase.id, result.caseFileContent)
      await persistReview(nextReview)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Bewertung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePrepareStep(step: StructuredStep) {
    if (!activeCase) return

    setError('')
    setBusyStepId(step.id)

    try {
      const result = await prepareStepDocument(step)
      const blob = base64ToBlob(result.contentBase64, result.mimeType)

      await saveLibraryDocument({
        caseId: activeCase.id,
        caseTitle: activeCase.title,
        stepId: step.id,
        stepText: step.text,
        title: result.title,
        previewText: result.previewText,
        fileName: result.fileName,
        mimeType: result.mimeType,
        blob,
      })

      downloadBlob(blob, result.fileName)
      setPreparedPreview({
        title: result.title,
        text: result.previewText,
        fileName: result.fileName,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Schritt konnte nicht vorbereitet werden.')
    } finally {
      setBusyStepId(null)
    }
  }

  const showDocumentChoice = review?.phase === 'interim' && !review?.readyForFinalAssessment
  const showFinalButton = review?.readyForFinalAssessment && review.phase !== 'final'
  const steps: StructuredStep[] = review?.structuredSteps?.length
    ? review.structuredSteps
    : review?.nextSteps
        ?.split('\n')
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
        .map((text, index) => ({ id: `legacy_${index}`, text })) ?? []

  return (
    <>
      {busy ? <AnalyzingOverlay message="Wird bearbeitet …" /> : null}

      <OnboardingShell
        title="Auswertung"
        subtitle={activeCase?.title ?? 'Behördenpost'}
        headerAction={
          <Link
            href="/bibliothek"
            className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Bibliothek
          </Link>
        }
        footer={
          review ? (
            <div className="space-y-3">
              {showDocumentChoice ? (
                <>
                  <PrimaryButton inactive={busy} onClick={() => void handleDocumentChoice('current_more')}>
                    Weitere Fotos zum aktuellen Schreiben
                  </PrimaryButton>
                  <PrimaryButton inactive={busy} onClick={() => void handleDocumentChoice('historical')}>
                    Ältere Dokumente erfassen
                  </PrimaryButton>
                  <PrimaryButton inactive={busy} onClick={() => void handleDocumentChoice('all_captured')}>
                    Alle relevanten Dokumente erfasst
                  </PrimaryButton>
                </>
              ) : showFinalButton ? (
                <PrimaryButton inactive={busy} onClick={() => void handleFinalAssessment()}>
                  Bewertung einholen
                </PrimaryButton>
              ) : review.phase === 'final' ? (
                <PrimaryButton href="/">Zur Fallübersicht</PrimaryButton>
              ) : (
                <PrimaryButton href="/">Zur Fallübersicht</PrimaryButton>
              )}
              <Link
                href="/fall/neu"
                className="flex h-12 w-full items-center justify-center text-sm font-medium text-muted"
              >
                Neuen Fall anlegen
              </Link>
            </div>
          ) : (
            <PrimaryButton href="/scan">Zum Fotografieren</PrimaryButton>
          )
        }
      >
        <section className="flex flex-1 flex-col gap-6">
          {loading ? (
            <p className="text-sm text-muted">Auswertung wird geladen …</p>
          ) : review ? (
            <>
              <div className="rounded-2xl border border-accent/25 bg-accent-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Zusammenfassung</p>
                <p className="mt-3 text-base leading-7 text-foreground">{review.summary || review.assessment}</p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  {review.phase === 'final' ? 'Bewertung' : 'Erste Einordnung'}
                </h2>
                <p className="leading-8 text-foreground">{review.assessment}</p>
              </div>

              <DocumentsStatusPanel
                status={review.documentsStatus}
                comment={review.documentsComment}
                requestedDocuments={review.requestedDocuments}
              />

              {steps.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight">Nächste Schritte</h3>
                  <ul className="space-y-3">
                    {steps.map((step, index) => {
                      const label = priorityLabel(step.priority)
                      return (
                        <li
                          key={step.id}
                          className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-7 text-foreground">{step.text}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {step.deadline ? (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                    Frist: {step.deadline}
                                  </span>
                                ) : null}
                                {label ? (
                                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                    {label}
                                  </span>
                                ) : null}
                              </div>
                              {review.phase === 'final' ? (
                                <button
                                  type="button"
                                  disabled={busyStepId === step.id}
                                  onClick={() => void handlePrepareStep(step)}
                                  className="mt-3 rounded-xl border border-accent bg-accent-soft px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
                                >
                                  {busyStepId === step.id ? 'Wird vorbereitet …' : 'Schritt vorbereiten'}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="text-base font-semibold">Nächste Schritte</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{review.nextSteps}</p>
                </div>
              )}

              {showDocumentChoice ? (
                <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-7 text-muted">
                  Wähle, wie es weitergeht: Ergänzungsfotos zum aktuellen Schreiben, ältere Unterlagen für den
                  Hintergrund — oder signalisiere, dass alle relevanten Dokumente erfasst sind.
                </p>
              ) : null}

              {showFinalButton ? (
                <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  Alle Unterlagen sind erfasst. Mit „Bewertung einholen“ erhältst du eine präzise Gesamtbewertung
                  mit klaren Fristen aus dem heute relevanten Schreiben.
                </p>
              ) : null}

              {review.phase === 'final' && review.isComplete ? (
                <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  Bewertung abgeschlossen. Du kannst für jeden Schritt ein Word-Schreiben vorbereiten und in der
                  Bibliothek wiederfinden.
                </p>
              ) : null}

              {preparedPreview ? (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="text-base font-semibold">{preparedPreview.title}</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{preparedPreview.text}</p>
                  <p className="mt-3 text-xs text-muted">
                    „{preparedPreview.fileName}“ wurde heruntergeladen und in der Bibliothek gespeichert.
                  </p>
                </div>
              ) : null}

              <PrivacyNote variant="storage" />

              <p className="text-xs leading-6 text-muted">
                {review.photoCount} Foto{review.photoCount === 1 ? '' : 's'} zuletzt ausgewertet · verarbeitete Fotos
                wurden vom Gerät gelöscht
              </p>

              {error ? (
                <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight">Noch keine Auswertung</h2>
                <p className="leading-7 text-muted">
                  Fotografiere zuerst ein Schreiben und tippe auf Prüfen. Danach siehst du hier die Bewertung und
                  nächsten Schritte für „{activeCase?.title}“.
                </p>
              </div>
              <PrivacyNote variant="analysis" />
            </>
          )}
        </section>
      </OnboardingShell>
    </>
  )
}
