'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'

import SheetPortal from '@/components/plus/SheetPortal'
import { buttonStyles } from '@/lib/buttonStyles'
import {
  buildAttachmentMetaSummary,
  getFollowUpUserText,
  MAX_CHAT_ATTACHMENTS,
  normalizeFollowUpMessage,
} from '@/lib/chatFollowUp'
import type { FollowUpAttachmentMeta, FollowUpMessage, FollowUpWordDocument } from '@/lib/analyzeTypes'
import { UPLOAD_ACCEPT, prepareUploadFile } from '@/lib/documentUpload'
import { PRIVACY_CHAT_LOCAL } from '@/lib/privacyCopy'

type PendingAttachment = FollowUpAttachmentMeta & {
  id: string
  file: File
}

type ChatHistorySheetProps = {
  messages: FollowUpMessage[]
  busy: boolean
  disabled?: boolean
  wordDocBusyAt?: number | null
  onClose: () => void
  onSubmit: (input: { userText?: string; files?: File[] }) => Promise<void>
  onSaveWordDocument?: (messageAt: number, wordDocument: FollowUpWordDocument) => Promise<void>
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  }).format(new Date(timestamp))
}

function AttachmentChips({ attachments }: { attachments: FollowUpAttachmentMeta[] }) {
  if (attachments.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
      {attachments.map((attachment, index) => (
        <span
          key={`${attachment.fileName}-${index}`}
          className="rounded-full bg-white/20 px-2.5 py-1 text-[0.7rem] font-medium text-white"
        >
          {attachment.kind === 'pdf' ? '📄' : '📷'} {attachment.fileName}
        </span>
      ))}
    </div>
  )
}

export default function ChatHistorySheet({
  messages,
  busy,
  disabled = false,
  wordDocBusyAt = null,
  onClose,
  onSubmit,
  onSaveWordDocument,
}: ChatHistorySheetProps) {
  const uploadRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const [error, setError] = useState('')

  const normalizedMessages = messages.map(normalizeFollowUpMessage)
  const canSend = (draft.trim().length > 0 || pending.length > 0) && !busy && !disabled

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [normalizedMessages.length, busy])

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    if (!canSend) return

    setError('')
    try {
      await onSubmit({
        userText: draft.trim() || undefined,
        files: pending.map((item) => item.file),
      })
      setDraft('')
      setPending([])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nachricht fehlgeschlagen.')
    }
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setError('')
    const remaining = MAX_CHAT_ATTACHMENTS - pending.length
    const accepted = files.slice(0, remaining)

    try {
      const next = accepted.map((file) => {
        const prepared = prepareUploadFile(file)
        return {
          id: `${prepared.fileName}-${Date.now()}-${Math.random()}`,
          file,
          fileName: prepared.fileName,
          kind: prepared.kind,
        }
      })
      setPending((current) => [...current, ...next])
      if (files.length > remaining) {
        setError(`Maximal ${MAX_CHAT_ATTACHMENTS} Anhänge pro Nachricht.`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Datei konnte nicht hinzugefügt werden.')
    }
  }

  return (
    <SheetPortal>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="lifexp-bottom-sheet flex max-h-[92dvh] min-h-[70dvh] flex-col border-t border-border bg-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-history-title"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />

          <div className="flex shrink-0 items-center justify-between px-5 pb-3">
            <div>
              <h2 id="chat-history-title" className="text-lg font-semibold tracking-tight">
                Chatverlauf
              </h2>
              <p className="text-sm text-muted">Nachfragen mit optionalen Fotos oder PDFs</p>
            </div>
            <button type="button" onClick={onClose} className={buttonStyles.header}>
              Schließen
            </button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
            {normalizedMessages.length === 0 ? (
              <p className="rounded-2xl border border-border bg-accent-soft/40 px-4 py-3 text-sm leading-7 text-muted">
                Stelle eine Frage oder lade ergänzende Unterlagen hoch — beides zusammen geht auch.
              </p>
            ) : (
              <ul className="space-y-4 pb-2">
                {normalizedMessages.map((message, index) => {
                  if (message.role === 'user') {
                    const userText = getFollowUpUserText(message)
                    const attachments = message.attachments ?? []

                    return (
                      <li key={`${message.at}-${index}`} className="flex flex-col items-end gap-1">
                        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-sm leading-7 text-white shadow-sm">
                          {userText ? <p className="whitespace-pre-wrap">{userText}</p> : null}
                          <AttachmentChips attachments={attachments} />
                          {!userText && attachments.length === 0 ? (
                            <p className="italic opacity-90">Nachfrage mit Anhang</p>
                          ) : null}
                        </div>
                        {message.contextSummary ? (
                          <p className="max-w-[88%] text-right text-[0.68rem] leading-5 text-muted">
                            {message.contextSummary}
                          </p>
                        ) : null}
                        <p className="text-[0.65rem] text-muted">{formatTime(message.at)}</p>
                      </li>
                    )
                  }

                  return (
                    <li key={`${message.at}-${index}`} className="flex flex-col items-start gap-1">
                      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 text-sm leading-7 text-foreground shadow-sm">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.wordDocument ? (
                          <div className="mt-3 space-y-2 rounded-xl border border-accent/25 bg-accent-soft/40 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                              Schreiben-Entwurf
                            </p>
                            <p className="text-sm font-medium text-foreground">{message.wordDocument.title}</p>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
                              {message.wordDocument.previewText}
                            </p>
                            {message.wordDocument.savedFileName ? (
                              <p className="text-xs text-muted">
                                „{message.wordDocument.savedFileName}“ in der Bibliothek gespeichert.
                              </p>
                            ) : onSaveWordDocument ? (
                              <button
                                type="button"
                                disabled={disabled || wordDocBusyAt === message.at}
                                onClick={() => void onSaveWordDocument(message.at, message.wordDocument!)}
                                className={buttonStyles.accentSoft}
                              >
                                {wordDocBusyAt === message.at ? 'Wird erstellt …' : 'Als Word speichern'}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <p className="text-[0.65rem] text-muted">{formatTime(message.at)}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-4 pt-3">
            {pending.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {pending.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft/50 px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {item.kind === 'pdf' ? '📄' : '📷'} {item.fileName}
                    <button
                      type="button"
                      aria-label={`${item.fileName} entfernen`}
                      onClick={() => setPending((current) => current.filter((entry) => entry.id !== item.id))}
                      className="text-muted hover:text-foreground"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Frage stellen …"
                rows={2}
                maxLength={2000}
                disabled={busy || disabled}
                className="w-full resize-none rounded-2xl border-2 border-border bg-surface px-4 py-3 text-sm leading-7 text-foreground shadow-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || disabled || pending.length >= MAX_CHAT_ATTACHMENTS}
                  onClick={() => uploadRef.current?.click()}
                  className={buttonStyles.secondary}
                >
                  Anhang
                </button>
                <button
                  type="submit"
                  disabled={!canSend}
                  className={`flex-1 ${canSend ? buttonStyles.primaryActive : buttonStyles.primaryInactive}`}
                >
                  {busy ? 'Wird gesendet …' : 'Senden'}
                </button>
              </div>
            </form>

            <input
              ref={uploadRef}
              type="file"
              accept={UPLOAD_ACCEPT}
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />

            {error ? (
              <p className="mt-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}

            <p className="mt-3 text-xs leading-6 text-muted">{PRIVACY_CHAT_LOCAL}</p>
          </div>
        </div>
      </div>
    </SheetPortal>
  )
}