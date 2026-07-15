'use client'

import { useState } from 'react'

import { buttonStyles } from '@/lib/buttonStyles'
import type { FollowUpMessage } from '@/lib/analyzeTypes'

type FollowUpQuestionPanelProps = {
  messages: FollowUpMessage[]
  busy: boolean
  disabled?: boolean
  onSubmit: (question: string) => Promise<void>
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(new Date(timestamp))
}

export default function FollowUpQuestionPanel({
  messages,
  busy,
  disabled = false,
  onSubmit,
}: FollowUpQuestionPanelProps) {
  const [question, setQuestion] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || busy || disabled) return

    await onSubmit(trimmed)
    setQuestion('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">Nachfrage stellen</h3>
        <p className="text-sm leading-7 text-muted">
          Stelle eine konkrete Frage zur Auswertung. Die ursprüngliche Einordnung bleibt unverändert — die
          Antwort erscheint unten.
        </p>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        <label className="block">
          <span className="sr-only">Deine Nachfrage</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="z. B. Was passiert, wenn ich die Frist verpasse?"
            rows={3}
            maxLength={2000}
            disabled={busy || disabled}
            className="w-full resize-y rounded-2xl border-2 border-border bg-surface px-4 py-3 text-sm leading-7 text-foreground shadow-sm ring-1 ring-border/20 placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={busy || disabled || !question.trim()}
          className={`w-full ${busy || disabled || !question.trim() ? buttonStyles.primaryInactive : buttonStyles.accentSoft}`}
        >
          {busy ? 'Wird beantwortet …' : 'Nachfrage stellen'}
        </button>
      </form>

      {messages.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Nachfragen & Antworten</p>
          <ul className="space-y-3">
            {messages.map((message, index) => {
              if (message.role === 'user') {
                const answer = messages[index + 1]
                if (answer?.role !== 'assistant') return null

                return (
                  <li
                    key={`${message.at}-${index}`}
                    className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Deine Nachfrage</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{message.content}</p>

                    <div className="mt-4 border-t border-border/70 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Antwort</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{answer.content}</p>
                      {answer.correctionNote ? (
                        <p className="mt-3 rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-sm leading-7 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                          <span className="font-semibold">Hinweis zur Auswertung:</span> {answer.correctionNote}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted">{formatTime(answer.at)}</p>
                    </div>
                  </li>
                )
              }
              return null
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
