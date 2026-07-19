import type { AnalyzeResult } from '@/lib/analyzeTypes'
import { parseCaseFileJsonl } from '@/lib/caseFileJsonl'
import type { FallakteEvent } from '@/lib/fallakteTypes'
import type { FallakteRelation } from '@/lib/fallakteRelationTypes'

export type CaseHistoryStatusKind =
  | 'only_current'
  | 'partial_history'
  | 'history_solid'
  | 'open_gaps'

export type CaseHistoryStatus = {
  kind: CaseHistoryStatusKind
  /** Kurzer Status-Titel für Karten */
  title: string
  /** Ein Satz Erklärung */
  detail: string
  historicalDocCount: number
  timelineTotal: number
  confirmedCount: number
  openCount: number
  relationCount: number
}

export function countHistorischeDokumente(caseFileContent: string | null | undefined): number {
  if (!caseFileContent?.trim()) return 0
  try {
    const records = parseCaseFileJsonl(caseFileContent)
    return records.filter(
      (record) => record.typ === 'dokument' && record.rolle === 'historisch',
    ).length
  } catch {
    return 0
  }
}

function countConfirmed(events: FallakteEvent[]): number {
  return events.filter(
    (event) =>
      event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected',
  ).length
}

function countOpen(events: FallakteEvent[]): number {
  return events.filter(
    (event) =>
      event.confirmationStatus === 'pending' || event.confirmationStatus === 'deferred',
  ).length
}

/**
 * Reine UI-Ableitung — keine Persistenz.
 *
 * Heuristik (einfach, bewusst grob):
 * 1. Offene Timeline-Punkte + mindestens ein historisches Dokument → „offene Lücken“
 * 2. Kein historisches Dokument → „nur aktuelles Schreiben“
 * 3. ≥2 historische Dokumente, ≥3 bestätigte Punkte, keine offenen → „gut dokumentiert“
 * 4. Sonst → „teilweise ergänzt“
 *
 * Niemals „vollständig“.
 */
export function deriveCaseHistoryStatus(input: {
  latestReview: AnalyzeResult | null
  caseFileContent: string | null | undefined
  events: FallakteEvent[]
  relations?: FallakteRelation[]
}): CaseHistoryStatus {
  const activeEvents = input.events.filter((event) => event.confirmationStatus !== 'rejected')
  const historicalDocCount = countHistorischeDokumente(
    input.caseFileContent ?? input.latestReview?.caseFileContent,
  )
  const timelineTotal = activeEvents.length
  const confirmedCount = countConfirmed(activeEvents)
  const openCount = countOpen(activeEvents)
  const relationCount = (input.relations ?? []).filter(
    (relation) => relation.status === 'confirmed',
  ).length

  let kind: CaseHistoryStatusKind
  let title: string
  let detail: string

  if (openCount > 0 && historicalDocCount >= 1) {
    kind = 'open_gaps'
    title = 'Fallakte enthält offene Lücken'
    detail =
      historicalDocCount === 1
        ? `Die Vorgeschichte wurde ergänzt, enthält aber noch ungeprüfte Punkte (${openCount} noch zu prüfen).`
        : `Vorgeschichte teilweise ergänzt: ${historicalDocCount} frühere Dokumente, ${openCount} Punkte noch unbestätigt.`
  } else if (historicalDocCount === 0) {
    kind = 'only_current'
    title = 'Nur aktuelles Schreiben vorhanden'
    detail = input.latestReview
      ? 'Bisher kennen wir nur das aktuelle Schreiben.'
      : 'Noch keine Auswertung vorhanden.'
  } else if (historicalDocCount >= 2 && confirmedCount >= 3 && openCount === 0) {
    kind = 'history_solid'
    title = 'Vorgeschichte gut dokumentiert'
    detail =
      'Die Fallakte enthält eine bestätigte Vorgeschichte und kann für spätere Schreiben wiederverwendet werden.'
  } else {
    kind = 'partial_history'
    title = 'Vorgeschichte teilweise ergänzt'
    detail =
      openCount > 0
        ? `${historicalDocCount} frühere Dokumente vorhanden, ${openCount} Punkte noch unbestätigt.`
        : `${historicalDocCount} frühere Dokumente vorhanden, ${confirmedCount} bestätigte Punkte.`
  }

  return {
    kind,
    title,
    detail,
    historicalDocCount,
    timelineTotal,
    confirmedCount,
    openCount,
    relationCount,
  }
}
