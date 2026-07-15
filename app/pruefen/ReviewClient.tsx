'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import AnalyzingOverlay from '@/components/AnalyzingOverlay'
import OnboardingShell, { PageIntro, PrimaryButton, SecondaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import DocumentsStatusPanel from '@/components/review/DocumentsStatusPanel'
import DeadlineBanner from '@/components/review/DeadlineBanner'
import ClaimsPanel from '@/components/review/ClaimsPanel'
import ReviewChangesBanner from '@/components/review/ReviewChangesBanner'
import ChatHistorySheet from '@/components/review/ChatHistorySheet'
import DeleteCaseSection from '@/components/review/DeleteCaseSection'
import { usePlusDiscoverHeader } from '@/hooks/usePlusDiscoverHeader'
import { buttonStyles } from '@/lib/buttonStyles'
import { logUserActivity } from '@/lib/activityLog'
import { scheduleCaseFileReorganize } from '@/lib/caseFileReorganizeClient'
import {
  base64ToBlob,
  buildWordDocument,
  downloadBlob,
  submitChatMessage,
  requestFinalAssessment,
} from '@/lib/analyzeClient'
import type { AnalyzeResult, FollowUpAttachmentMeta, FollowUpMessage, FollowUpWordDocument, StructuredStep } from '@/lib/analyzeTypes'
import { normalizeDecisionFields, normalizeDocumentsFields, normalizeStructuredSteps } from '@/lib/analyzeSchema'
import { buildAttachmentMetaSummary, buildDefaultContextSummary } from '@/lib/chatFollowUp'
import { upsertAktuellResultatFromReview } from '@/lib/caseFileJsonl'
import {
  closeOpenAktuellBlock,
  markReadyForAssessment,
  openAktuellBlock,
  openHistorischBlock,
} from '@/lib/caseFileOps'
import { displaySummary, shouldShowSummary } from '@/lib/reviewDisplay'
import { formatDeadlineShort } from '@/lib/deadlineDisplay'
import { downloadDeadlineIcs } from '@/lib/calendarExport'
import { documentKindLabel } from '@/lib/documentKindLabel'
import { buildReviewChanges, type ReviewChangeItem } from '@/lib/reviewDiff'
import { loadDoneStepIds, toggleDoneStepId } from '@/lib/stepProgress'
import { documentChoiceHint, reviewFooterState } from '@/lib/reviewFooter'
import {
  getActiveCase,
  saveCaseFileContent,
  saveLatestReview,
  type StoredCase,
} from '@/lib/localCases'
import { saveLibraryDocument } from '@/lib/localLibrary'
import { recordFinalAssessmentCompleted, recordWordDocumentCreated } from '@/lib/plusEngagement'
import { PRIVACY_CHAT_LOCAL } from '@/lib/privacyCopy'

function normalizeReview(review: AnalyzeResult & { round?: string }): AnalyzeResult {
  const legacyIntent =
    review.intent ??
    (review.round === 'initial' ? 'initial' : review.round === 'followup' ? 'current_more' : 'initial')

  const docs = normalizeDocumentsFields(review)
  const decision = normalizeDecisionFields(review)

  return {
    ...review,
    summary: review.summary?.trim() ?? '',
    structuredSteps: review.structuredSteps ?? [],
    documentChoiceRequired:
      docs.documentsStatus === 'not_needed'
        ? false
        : (review.documentChoiceRequired ?? legacyIntent === 'initial'),
    readyForFinalAssessment: review.readyForFinalAssessment ?? false,
    phase: review.phase ?? (review.isComplete ? 'final' : 'interim'),
    intent: legacyIntent,
    followUpMessages: review.followUpMessages ?? [],
    ...docs,
    ...decision,
  }
}

function priorityLabel(priority?: string): string | null {
  if (priority === 'hoch') return 'Dringend'
  if (priority === 'mittel') return 'Bald erledigen'
  if (priority === 'niedrig') return 'Kann warten'
  return null
}

export default function ReviewClient() {
  const router = useRouter()
  const plus = usePlusDiscoverHeader()
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [review, setReview] = useState<AnalyzeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [followUpBusy, setFollowUpBusy] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [wordDocBusyAt, setWordDocBusyAt] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [reviewChanges, setReviewChanges] = useState<ReviewChangeItem[]>([])
  const [doneStepIds, setDoneStepIds] = useState<string[]>([])
  const [replyDraftBusy, setReplyDraftBusy] = useState(false)

  useEffect(() => {
    async function loadReview() {
      const currentCase = await getActiveCase()
      if (!currentCase) {
        router.replace('/')
        return
      }

      setActiveCase(currentCase)
      setReview(currentCase.latestReview ? normalizeReview(currentCase.latestReview) : null)
      setDoneStepIds(loadDoneStepIds(currentCase.id))
      logUserActivity('review_opened', {
        case_id: currentCase.id,
        case_number: currentCase.caseNumber,
        has_review: Boolean(currentCase.latestReview),
      })
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
      scheduleCaseFileReorganize(activeCase.id, 'consolidate_historie')
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
      const previous = review
      const result = await requestFinalAssessment()
      const nextReview: AnalyzeResult = {
        ...normalizeReview({
          ...result,
          documentChoiceRequired: false,
          readyForFinalAssessment: false,
          analyzedAt: Date.now(),
          intent: 'final',
          photoCount: review.photoCount,
          followUpMessages: review.followUpMessages ?? [],
        }),
      }

      await saveCaseFileContent(activeCase.id, result.caseFileContent)
      await persistReview(nextReview)
      setReviewChanges(buildReviewChanges(previous, nextReview))
      recordFinalAssessmentCompleted()
      logUserActivity('final_assessment', {
        case_id: activeCase.id,
        case_number: activeCase.caseNumber,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Bewertung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  async function handleChatSubmit(input: { userText?: string; files?: File[] }) {
    if (!activeCase || !review) return

    setError('')
    setFollowUpBusy(true)

    try {
      const previous = review
      const result = await submitChatMessage(input)
      const now = Date.now()
      const attachmentMeta: FollowUpAttachmentMeta[] = (input.files ?? []).map((file) => {
        const kind = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
        return { fileName: file.name || (kind === 'pdf' ? 'Dokument.pdf' : 'Foto.jpg'), kind } as FollowUpAttachmentMeta
      })

      const pdfCount = attachmentMeta.filter((item) => item.kind === 'pdf').length
      const contextSummary =
        result.contextSummary.trim() ||
        (attachmentMeta.length > 0
          ? buildDefaultContextSummary(attachmentMeta.length, pdfCount)
          : 'Fallakte + bisherige Auswertung')

      const nextMessages: FollowUpMessage[] = [
        ...(review.followUpMessages ?? []),
        {
          role: 'user',
          userText: input.userText?.trim() || undefined,
          content: input.userText?.trim() || buildAttachmentMetaSummary(attachmentMeta),
          attachments: attachmentMeta.length > 0 ? attachmentMeta : undefined,
          contextSummary,
          at: now,
        },
        {
          role: 'assistant',
          content: result.answer,
          wordDocument: result.wordDocument,
          at: now + 1,
        },
      ]

      const updatedSteps = normalizeStructuredSteps(result.updatedStructuredSteps)
      const nextReview: AnalyzeResult = {
        ...review,
        summary: result.updatedSummary || review.summary,
        assessment: result.updatedAssessment || review.assessment,
        nextSteps: result.updatedNextSteps || review.nextSteps,
        structuredSteps: updatedSteps.length > 0 ? updatedSteps : review.structuredSteps,
        documentKind: result.documentKind,
        primaryDeadline: result.primaryDeadline,
        primaryDeadlineLabel: result.primaryDeadlineLabel,
        keyClaims: result.keyClaims,
        contestablePoints: result.contestablePoints,
        followUpMessages: nextMessages,
        analyzedAt: now,
      }

      const nextCaseFile = upsertAktuellResultatFromReview(review.caseFileContent, {
        summary: nextReview.summary,
        assessment: nextReview.assessment,
        nextSteps: nextReview.nextSteps,
      })
      nextReview.caseFileContent = nextCaseFile
      await persistCaseFile(nextCaseFile)
      await persistReview(nextReview)
      setReviewChanges(buildReviewChanges(previous, nextReview))
      logUserActivity('follow_up_question', {
        case_id: activeCase.id,
        case_number: activeCase.caseNumber,
        has_attachments: attachmentMeta.length > 0,
        has_word_document: Boolean(result.wordDocument),
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nachfrage fehlgeschlagen.')
      throw caught
    } finally {
      setFollowUpBusy(false)
    }
  }

  function handleToggleStepDone(stepId: string) {
    if (!activeCase) return
    setDoneStepIds(toggleDoneStepId(activeCase.id, stepId))
  }

  async function handleRequestReplyDraft() {
    if (!review?.contestablePoints?.length) return

    const pointsText = review.contestablePoints
      .map(
        (point, index) =>
          `${index + 1}. ${point.claim} — Warum: ${point.why}. Aktion: ${point.suggestedAction}`,
      )
      .join('\n')

    const question = [
      'Bitte erstelle einen höflichen Entwurf eines Antwortschreibens als Word-Dokument.',
      'Gehe besonders auf diese Prüfpunkte ein:',
      pointsText,
      'Sachlich, klar, ohne unnötige Fachsprache.',
    ].join('\n')

    setReplyDraftBusy(true)
    setChatOpen(true)
    try {
      await handleChatSubmit({ userText: question })
    } finally {
      setReplyDraftBusy(false)
    }
  }

  async function handleSaveWordDocument(messageAt: number, wordDocument: FollowUpWordDocument) {
    if (!activeCase || !review) return

    setError('')
    setWordDocBusyAt(messageAt)

    try {
      const result = await buildWordDocument(wordDocument)
      const blob = base64ToBlob(result.contentBase64, result.mimeType)

      await saveLibraryDocument({
        caseId: activeCase.id,
        caseTitle: activeCase.title,
        stepId: `chat_${messageAt}`,
        stepText: wordDocument.previewText || wordDocument.title,
        title: result.title,
        previewText: result.previewText,
        fileName: result.fileName,
        mimeType: result.mimeType,
        blob,
      })

      downloadBlob(blob, result.fileName)
      recordWordDocumentCreated()
      logUserActivity('word_document_created', {
        case_id: activeCase.id,
        source: 'chat',
        file_name: result.fileName,
      })

      const nextMessages = (review.followUpMessages ?? []).map((message) =>
        message.at === messageAt && message.wordDocument
          ? {
              ...message,
              wordDocument: { ...message.wordDocument, savedFileName: result.fileName },
            }
          : message,
      )

      await persistReview({ ...review, followUpMessages: nextMessages })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Word-Schreiben konnte nicht gespeichert werden.')
      throw caught
    } finally {
      setWordDocBusyAt(null)
    }
  }

  const footer = reviewFooterState(review)
  const showDocumentChoice = footer.showDocumentChoice
  const showOptionalDocumentChoice = footer.showOptionalDocumentChoice
  const showFinalButton = footer.showFinalButton
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
      {followUpBusy ? <AnalyzingOverlay message="Chat wird beantwortet …" /> : null}

      <OnboardingShell
        title="Auswertung"
        subtitle={activeCase?.title ?? 'Behördenpost'}
        backNav={{ href: '/', label: 'Zurück zur Fallübersicht' }}
        headerAction={plus.headerAction}
        footer={
          !loading && activeCase ? (
            <div className="space-y-3">
              {review ? (
                <>
                  {footer.showDocumentChoice ? (
                    <>
                      {footer.showAllCapturedButton ? (
                        <PrimaryButton inactive={busy} onClick={() => void handleDocumentChoice('all_captured')}>
                          Alle Dokumente erfasst — weiter
                        </PrimaryButton>
                      ) : null}
                      {footer.showCurrentMoreButton ? (
                        <SecondaryButton inactive={busy} onClick={() => void handleDocumentChoice('current_more')}>
                          Weitere Fotos (aktuell)
                        </SecondaryButton>
                      ) : null}
                      {footer.showHistoricalButton ? (
                        <SecondaryButton inactive={busy} onClick={() => void handleDocumentChoice('historical')}>
                          Ältere Unterlagen
                        </SecondaryButton>
                      ) : null}
                    </>
                  ) : null}
                  {footer.showOptionalDocumentChoice ? (
                    <>
                      {footer.showProceedToAssessment ? (
                        <PrimaryButton inactive={busy} onClick={() => void handleDocumentChoice('all_captured')}>
                          Weiter zur Bewertung
                        </PrimaryButton>
                      ) : null}
                      {footer.showCurrentMoreButton ? (
                        <SecondaryButton inactive={busy} onClick={() => void handleDocumentChoice('current_more')}>
                          Optional: Weitere Unterlagen
                        </SecondaryButton>
                      ) : null}
                      {footer.showHistoricalButton ? (
                        <SecondaryButton inactive={busy} onClick={() => void handleDocumentChoice('historical')}>
                          Optional: Ältere Unterlagen
                        </SecondaryButton>
                      ) : null}
                    </>
                  ) : null}
                  {footer.showFinalButton ? (
                    <PrimaryButton inactive={busy} onClick={() => void handleFinalAssessment()}>
                      Bewertung einholen
                    </PrimaryButton>
                  ) : null}
                  {review.phase === 'final' ? (
                    <PrimaryButton href="/scan">Neues Schreiben fotografieren</PrimaryButton>
                  ) : null}
                </>
              ) : (
                <PrimaryButton href="/scan">Zum Fotografieren</PrimaryButton>
              )}
            </div>
          ) : null
        }
      >
        <section className="flex flex-1 flex-col gap-6">
          {loading ? (
            <p className="text-sm text-muted">Auswertung wird geladen …</p>
          ) : review ? (
            <>
              <PageIntro
                title={review.phase === 'final' ? 'Deine Auswertung' : 'Erste Einordnung'}
                description="Kurz verstehen, was das Schreiben will — und was du als Nächstes tun kannst."
              />

              <div className="flex justify-end -mt-2">
                <Link href="/bibliothek" className={buttonStyles.secondary}>
                  <span className="sm:hidden" aria-label="Bibliothek">
                    📄 Bibliothek
                  </span>
                  <span className="hidden sm:inline">Zur Bibliothek</span>
                </Link>
              </div>

              <ReviewChangesBanner changes={reviewChanges} onDismiss={() => setReviewChanges([])} />

              <DeadlineBanner
                deadline={review.primaryDeadline}
                label={review.primaryDeadlineLabel}
                caseTitle={activeCase?.title}
              />

              {documentKindLabel(review.documentKind) ? (
                <p className="text-sm text-muted">
                  Art des Schreibens:{' '}
                  <span className="font-medium text-foreground">{documentKindLabel(review.documentKind)}</span>
                </p>
              ) : null}

              {shouldShowSummary(review.summary, review.assessment) ? (
                <div className="rounded-2xl border border-accent/25 bg-accent-soft p-5">
                  <p className="text-sm font-semibold text-accent">In wenigen Worten</p>
                  <p className="mt-2 whitespace-pre-line text-base leading-7 text-foreground">
                    {displaySummary(review.summary)}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Was das für dich bedeutet</h2>
                <p className="leading-8 text-foreground">{review.assessment}</p>
              </div>

              <ClaimsPanel
                claims={review.keyClaims}
                points={review.contestablePoints}
                draftBusy={replyDraftBusy || followUpBusy}
                onRequestReplyDraft={
                  (review.contestablePoints?.length ?? 0) > 0
                    ? () => void handleRequestReplyDraft()
                    : undefined
                }
              />

              <DocumentsStatusPanel
                status={review.documentsStatus}
                comment={review.documentsComment}
                requestedDocuments={review.requestedDocuments}
              />

              {steps.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Deine nächsten Schritte</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Abhaken, wenn erledigt — speichert nur auf diesem Gerät.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {steps.map((step, index) => {
                      const label = priorityLabel(step.priority)
                      const done = doneStepIds.includes(step.id)
                      return (
                        <li
                          key={step.id}
                          className={`rounded-2xl border p-4 shadow-sm ${
                            done
                              ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'
                              : 'border-border bg-surface'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              aria-pressed={done}
                              aria-label={done ? `Schritt ${index + 1} wieder öffnen` : `Schritt ${index + 1} erledigt`}
                              disabled={busy || followUpBusy}
                              onClick={() => handleToggleStepDone(step.id)}
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                done
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-accent text-white'
                              }`}
                            >
                              {done ? '✓' : index + 1}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm leading-7 ${
                                  done ? 'text-muted line-through' : 'text-foreground'
                                }`}
                              >
                                {step.text}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {step.deadline ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadDeadlineIcs({
                                        deadline: step.deadline!,
                                        title: `${step.text.slice(0, 80)}${activeCase?.title ? ` — ${activeCase.title}` : ''}`,
                                        fileName: `Schritt_${step.deadline}.ics`,
                                      })
                                    }
                                    className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-200"
                                  >
                                    Bis {formatDeadlineShort(step.deadline)} · Kalender
                                  </button>
                                ) : null}
                                {label ? (
                                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                    {label}
                                  </span>
                                ) : null}
                                {done ? (
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                                    Erledigt
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="text-base font-semibold">Deine nächsten Schritte</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{review.nextSteps}</p>
                </div>
              )}

              {(showDocumentChoice || showOptionalDocumentChoice) && review ? (
                <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-7 text-muted">
                  {documentChoiceHint(review, footer.showAllCapturedButton, showOptionalDocumentChoice)}
                </p>
              ) : null}

              {showFinalButton ? (
                <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  Unterlagen sind erfasst. Mit „Bewertung einholen“ bekommst du die klare Gesamtübersicht mit Fristen.
                </p>
              ) : null}


              <button
                type="button"
                disabled={busy || wordDocBusyAt !== null}
                onClick={() => setChatOpen(true)}
                className={buttonStyles.primaryActive}
              >
                Chatverlauf
                {(review.followUpMessages?.length ?? 0) > 0
                  ? ` (${Math.ceil((review.followUpMessages?.length ?? 0) / 2)})`
                  : ''}
              </button>

              {activeCase ? (
                <div className="space-y-3 border-t border-border pt-6">
                  <DeleteCaseSection
                    caseId={activeCase.id}
                    caseTitle={activeCase.title}
                    disabled={busy || wordDocBusyAt !== null || followUpBusy}
                    onDeleted={() => router.replace('/')}
                    onError={setError}
                  />
                  <p className="text-sm leading-7 text-muted">{PRIVACY_CHAT_LOCAL}</p>
                </div>
              ) : null}

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
              <PageIntro
                title="Noch keine Auswertung"
                description={
                  <>
                    Fotografiere zuerst ein Schreiben und tippe auf Prüfen. Danach siehst du hier die Bewertung
                    und nächsten Schritte für „{activeCase?.title}“.
                  </>
                }
              />
              <div className="space-y-3 border-t border-border pt-6">
                {activeCase ? (
                  <DeleteCaseSection
                    caseId={activeCase.id}
                    caseTitle={activeCase.title}
                    disabled={busy}
                    onDeleted={() => router.replace('/')}
                    onError={setError}
                  />
                ) : null}
                <p className="text-sm leading-7 text-muted">{PRIVACY_CHAT_LOCAL}</p>
              </div>
              <PrivacyNote variant="analysis" />
            </>
          )}
        </section>
      </OnboardingShell>
      {plus.portals}
      {chatOpen && review ? (
        <ChatHistorySheet
          messages={review.followUpMessages ?? []}
          busy={followUpBusy}
          disabled={busy || wordDocBusyAt !== null}
          onClose={() => setChatOpen(false)}
          onSubmit={handleChatSubmit}
          onSaveWordDocument={handleSaveWordDocument}
          wordDocBusyAt={wordDocBusyAt}
        />
      ) : null}
    </>
  )
}
