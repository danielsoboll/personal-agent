'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, { PageIntro } from '@/components/onboarding/OnboardingShell'
import FallakteCorrectSheet from '@/components/fallakte/FallakteCorrectSheet'
import FallakteDateGroupCard from '@/components/fallakte/FallakteDateGroupCard'
import FallakteEventCard from '@/components/fallakte/FallakteEventCard'
import FallakteLinkSheet from '@/components/fallakte/FallakteLinkSheet'
import { getActiveCase, type StoredCase } from '@/lib/localCases'
import {
  confirmFallakteEvent,
  correctFallakteEvent,
  deferFallakteEvent,
  listFallakteEvents,
  rejectFallakteEvent,
} from '@/lib/localFallakte'
import {
  createConfirmedFallakteRelation,
  listFallakteRelations,
  removeFallakteRelation,
  updateFallakteRelation,
} from '@/lib/localFallakteRelations'
import { groupEventsByDate } from '@/lib/fallakteGroupByDate'
import type { FallakteRelation } from '@/lib/fallakteRelationTypes'
import {
  FALLAKTE_CONFIRMATION_LABELS,
  type FallakteEvent,
  type FallakteEventEditable,
} from '@/lib/fallakteTypes'

function formatUploadDate(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeZone: 'Europe/Berlin',
  }).format(new Date(timestamp))
}

export default function FallakteClient() {
  const router = useRouter()
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [events, setEvents] = useState<FallakteEvent[]>([])
  const [relations, setRelations] = useState<FallakteRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRejected, setShowRejected] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editing, setEditing] = useState<FallakteEvent | null>(null)
  const [linkingFrom, setLinkingFrom] = useState<FallakteEvent | null>(null)
  const [editingRelation, setEditingRelation] = useState<FallakteRelation | null>(null)

  async function reload(caseId: string) {
    const [nextEvents, nextRelations] = await Promise.all([
      listFallakteEvents(caseId),
      listFallakteRelations(caseId),
    ])
    setEvents(nextEvents)
    setRelations(nextRelations)
  }

  useEffect(() => {
    async function load() {
      const current = await getActiveCase()
      if (!current) {
        router.replace('/')
        return
      }
      setActiveCase(current)
      await reload(current.id)
      setLoading(false)
    }
    void load()
  }, [router])

  const activeEvents = useMemo(
    () => events.filter((event) => event.confirmationStatus !== 'rejected'),
    [events],
  )
  const rejectedEvents = useMemo(
    () => events.filter((event) => event.confirmationStatus === 'rejected'),
    [events],
  )
  const dateGroups = useMemo(() => groupEventsByDate(activeEvents), [activeEvents])
  const eventsById = useMemo(() => {
    const map = new Map<string, FallakteEvent>()
    for (const event of events) map.set(event.id, event)
    return map
  }, [events])

  const pendingCount = useMemo(
    () =>
      activeEvents.filter(
        (event) => event.confirmationStatus === 'pending' || event.confirmationStatus === 'deferred',
      ).length,
    [activeEvents],
  )
  const confirmedCount = useMemo(
    () =>
      activeEvents.filter(
        (event) =>
          event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected',
      ).length,
    [activeEvents],
  )

  async function withBusy(id: string, action: () => Promise<void>) {
    setBusyId(id)
    setError('')
    try {
      await action()
      if (activeCase) await reload(activeCase.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Aktion fehlgeschlagen.')
    } finally {
      setBusyId(null)
    }
  }

  const linkSheetFrom = linkingFrom
  const linkSheetEditing = editingRelation
  const linkSheetEvent =
    linkSheetFrom ??
    (linkSheetEditing ? eventsById.get(linkSheetEditing.fromEventId) ?? null : null)

  return (
    <OnboardingShell
      title="Fallakte"
      subtitle={activeCase?.title ?? 'Behördenpost'}
      backNav={{ href: '/fall', label: 'Zurück zum Fall' }}
    >
      <section className="flex flex-col gap-6">
        {loading ? (
          <p className="text-sm text-muted">Fallakte wird geladen …</p>
        ) : (
          <>
            <PageIntro
              showBrand={false}
              title={activeCase?.title ?? 'Fallakte'}
              description="KI schlägt Ereignisse vor — du bestätigst die tatsächlichen Fakten."
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                <p className="text-xs font-medium text-muted">Bestätigt</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{confirmedCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Noch prüfen</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-950 dark:text-amber-50">
                  {pendingCount}
                </p>
              </div>
            </div>

            {pendingCount > 0 ? (
              <p className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-50">
                {pendingCount === 1
                  ? '1 Eintrag wartet noch auf deine Bestätigung.'
                  : `${pendingCount} Einträge warten noch auf deine Bestätigung.`}
              </p>
            ) : null}

            <div className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">Chronologie</h2>
              {activeEvents.length === 0 ? (
                <p className="rounded-2xl border border-border bg-surface px-4 py-4 text-base leading-7 text-muted">
                  Für diesen Fall wurden noch keine Timeline-Einträge erstellt. Nach einer neuen
                  Dokumentprüfung erscheinen hier Vorschläge zur Bestätigung.
                </p>
              ) : (
                <ol className="relative space-y-5 border-l-2 border-accent/30 pl-5">
                  {dateGroups.map((group) => (
                    <li key={group.dateKey} className="relative">
                      <span
                        className="absolute -left-[1.6rem] top-5 h-3 w-3 rounded-full border-2 border-accent bg-surface"
                        aria-hidden
                      />
                      <FallakteDateGroupCard
                        group={group}
                        busyId={busyId}
                        eventsById={eventsById}
                        relations={relations}
                        onConfirm={(event) =>
                          void withBusy(event.id, async () => {
                            await confirmFallakteEvent(event.id)
                          })
                        }
                        onCorrect={(event) => setEditing(event)}
                        onReject={(event) =>
                          void withBusy(event.id, async () => {
                            await rejectFallakteEvent(event.id)
                          })
                        }
                        onDefer={(event) =>
                          void withBusy(event.id, async () => {
                            await deferFallakteEvent(event.id)
                          })
                        }
                        onLink={(event) => {
                          setEditingRelation(null)
                          setLinkingFrom(event)
                        }}
                        onEditRelation={(relation) => {
                          setLinkingFrom(null)
                          setEditingRelation(relation)
                        }}
                        onRemoveRelation={(relation) =>
                          void withBusy(relation.fromEventId, async () => {
                            await removeFallakteRelation(relation.id)
                          })
                        }
                        formatUploadDate={formatUploadDate}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {rejectedEvents.length > 0 ? (
              <div className="space-y-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowRejected((value) => !value)}
                  className="text-sm font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  {showRejected
                    ? 'Verworfene Einträge ausblenden'
                    : `Verworfene Einträge anzeigen (${rejectedEvents.length})`}
                </button>
                {showRejected ? (
                  <ul className="space-y-2.5 opacity-85">
                    {rejectedEvents.map((event) => (
                      <li key={`rejected-${event.id}`}>
                        <FallakteEventCard
                          event={event}
                          busy={false}
                          readOnly
                          formatUploadDate={formatUploadDate}
                        />
                        {event.rejectionReason ? (
                          <p className="mt-1 text-xs text-muted">
                            {FALLAKTE_CONFIRMATION_LABELS.rejected} — {event.rejectionReason}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => router.push('/fall')}
              className="text-sm font-medium text-accent"
            >
              Zum Fall
            </button>

            {error ? (
              <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            ) : null}
          </>
        )}
      </section>

      {editing ? (
        <FallakteCorrectSheet
          event={editing}
          onClose={() => setEditing(null)}
          onSave={(edits: FallakteEventEditable) =>
            void withBusy(editing.id, async () => {
              await correctFallakteEvent(editing.id, edits)
              setEditing(null)
            })
          }
        />
      ) : null}

      {linkSheetEvent && activeCase ? (
        <FallakteLinkSheet
          fromEvent={linkSheetEvent}
          allEvents={activeEvents}
          editingRelation={editingRelation}
          onClose={() => {
            setLinkingFrom(null)
            setEditingRelation(null)
          }}
          onSave={(payload) =>
            void withBusy(linkSheetEvent.id, async () => {
              if (editingRelation) {
                await updateFallakteRelation(editingRelation.id, payload)
              } else {
                await createConfirmedFallakteRelation({
                  caseId: activeCase.id,
                  fromEventId: linkSheetEvent.id,
                  ...payload,
                })
              }
              setLinkingFrom(null)
              setEditingRelation(null)
            })
          }
        />
      ) : null}
    </OnboardingShell>
  )
}
