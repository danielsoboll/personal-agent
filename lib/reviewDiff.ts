import type { AnalyzeResult } from '@/lib/analyzeTypes'
import { formatDeadlineShort } from '@/lib/deadlineDisplay'

export type ReviewChangeItem = {
  id: string
  text: string
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function textsEqual(a: string | undefined, b: string | undefined): boolean {
  return normalizeText(a) === normalizeText(b)
}

/** Freundliche Kurzbeschreibung, was sich zwischen zwei Auswertungen geändert hat. */
export function buildReviewChanges(
  previous: AnalyzeResult | null | undefined,
  next: AnalyzeResult,
): ReviewChangeItem[] {
  if (!previous) return []

  const changes: ReviewChangeItem[] = []

  if (!textsEqual(previous.primaryDeadline, next.primaryDeadline)) {
    if (next.primaryDeadline) {
      const label = next.primaryDeadlineLabel?.trim() || 'Frist'
      changes.push({
        id: 'deadline',
        text: `${label} ist jetzt der ${formatDeadlineShort(next.primaryDeadline)}.`,
      })
    } else if (previous.primaryDeadline) {
      changes.push({ id: 'deadline-cleared', text: 'Die bisherige Hauptfrist entfällt laut neuer Einordnung.' })
    }
  }

  if (!textsEqual(previous.summary, next.summary)) {
    changes.push({ id: 'summary', text: 'Die Kurzfassung wurde angepasst.' })
  }

  if (!textsEqual(previous.assessment, next.assessment)) {
    changes.push({ id: 'assessment', text: 'Die Einordnung („Was das für dich bedeutet“) wurde aktualisiert.' })
  }

  const prevSteps = (previous.structuredSteps ?? []).map((step) => step.text.trim()).filter(Boolean)
  const nextSteps = (next.structuredSteps ?? []).map((step) => step.text.trim()).filter(Boolean)
  if (prevSteps.join('|') !== nextSteps.join('|')) {
    changes.push({ id: 'steps', text: 'Die nächsten Schritte wurden neu sortiert oder ergänzt.' })
  }

  const prevClaims = (previous.keyClaims ?? []).map((claim) => claim.text.trim()).join('|')
  const nextClaims = (next.keyClaims ?? []).map((claim) => claim.text.trim()).join('|')
  if (prevClaims !== nextClaims) {
    changes.push({ id: 'claims', text: 'Die Liste „Was die andere Seite sagt“ hat sich geändert.' })
  }

  const prevPoints = (previous.contestablePoints ?? []).map((point) => point.claim.trim()).join('|')
  const nextPoints = (next.contestablePoints ?? []).map((point) => point.claim.trim()).join('|')
  if (prevPoints !== nextPoints) {
    changes.push({ id: 'points', text: 'Die Prüfpunkte („Das kannst du prüfen“) wurden aktualisiert.' })
  }

  return changes.slice(0, 5)
}
