import {
  hasHistorieRecords,
  parseCaseFileJsonl,
  type CaseFileRecord,
} from '@/lib/caseFileJsonl'

const MAX_HISTORIE_DOKUMENTE_IN_PROMPT = 15
const MAX_DOKUMENT_SUMMARY_CHARS = 420

export type CasePromptContext = {
  scopeBlock: string
  aktuellBlock: string
  historieBlock: string | null
  hasHistorie: boolean
}

export type BuildCasePromptContextInput = {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent?: string | null
}

function trimText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 1)}…`
}

function readRecords(caseFileContent?: string | null): CaseFileRecord[] {
  if (!caseFileContent?.trim()) return []
  try {
    return parseCaseFileJsonl(caseFileContent)
  } catch {
    return []
  }
}

export function buildCaseScopeBlock(input: {
  userName: string
  caseTitle: string
  caseNumber?: number
}): string {
  const name = input.userName.trim() || 'Nutzer'
  const fall = input.caseTitle.trim()
  const numberLine =
    typeof input.caseNumber === 'number' && input.caseNumber > 0
      ? `Fallnummer: ${input.caseNumber} (nur zur Zuordnung — nicht in Nutzertext wiederholen)`
      : null

  return [
    '=== NUR DIESER FALL ===',
    `Anrede: ${name} (Du-Form)`,
    `Fall: „${fall}“`,
    ...(numberLine ? [numberLine] : []),
    'Alle Antworten beziehen sich ausschließlich auf diesen Fall.',
    'Keine Vermischung mit anderen Fällen, keine erfundene Vorgeschichte.',
    'Historie nur nutzen, wenn sie unten ausdrücklich zu diesem Fall steht.',
  ].join('\n')
}

function buildAktuellBlock(records: CaseFileRecord[]): string {
  const anfrage = records.find((record) => record.typ === 'anfrage')
  const resultat = records.find((record) => record.typ === 'resultat')

  const lines: string[] = []

  if (typeof anfrage?.text === 'string' && anfrage.text.trim()) {
    lines.push(`Anfrage: ${anfrage.text.trim()}`)
  }

  if (resultat) {
    const summary = trimText(resultat.summary, 600)
    const assessment = trimText(resultat.assessment, 1200)
    const nextSteps = trimText(resultat.next_steps, 800)
    const stand = typeof resultat.stand === 'string' ? resultat.stand : null

    if (summary) lines.push(`Zusammenfassung: ${summary}`)
    if (assessment) lines.push(`Einordnung: ${assessment}`)
    if (nextSteps) lines.push(`Nächste Schritte:\n${nextSteps}`)
    if (stand) lines.push(`Stand: ${stand}`)
  }

  if (lines.length === 0) {
    return 'Noch keine gespeicherte Einordnung — nur aus den neuen Dokumenten ableiten.'
  }

  return lines.join('\n\n')
}

function buildHistorieBlock(records: CaseFileRecord[]): string | null {
  const kontext = records.find(
    (record) =>
      record.typ === 'kontext' &&
      (record.bereich === 'historie' || !record.bereich) &&
      typeof record.text === 'string' &&
      record.text.trim(),
  )

  const dokumente = records.filter(
    (record) => record.typ === 'dokument' && record.rolle === 'historisch',
  )

  if (!kontext && dokumente.length === 0) return null

  const lines: string[] = [
    'Nutze die Historie als Hintergrund für bessere Einordnung — keine neuen Fristen aus Historie erfinden.',
  ]

  if (kontext && typeof kontext.text === 'string') {
    lines.push('', 'Gesamtbild Historie:', kontext.text.trim())
  }

  if (dokumente.length > 0) {
    lines.push('', 'Einzelne Historie-Dokumente:')
    const visible = dokumente.slice(-MAX_HISTORIE_DOKUMENTE_IN_PROMPT)
    for (const [index, doc] of visible.entries()) {
      const titel = typeof doc.titel === 'string' ? doc.titel.trim() : `Dokument ${index + 1}`
      const datum = typeof doc.datum === 'string' ? doc.datum : null
      const summary = trimText(doc.zusammenfassung, MAX_DOKUMENT_SUMMARY_CHARS)
      lines.push(
        `- ${datum ? `[${datum}] ` : ''}${titel}${summary ? `: ${summary}` : ''}`,
      )
    }
    const hidden = dokumente.length - visible.length
    if (hidden > 0) {
      lines.push(`- … und ${hidden} weitere Historie-Einträge in der Fallakte`)
    }
  }

  return lines.join('\n')
}

export function buildCasePromptContext(input: BuildCasePromptContextInput): CasePromptContext {
  const records = readRecords(input.caseFileContent)
  const scopeBlock = buildCaseScopeBlock(input)
  const aktuellBlock = buildAktuellBlock(records)
  const historieBlock = buildHistorieBlock(records)

  return {
    scopeBlock,
    aktuellBlock,
    historieBlock,
    hasHistorie: hasHistorieRecords(input.caseFileContent ?? '') || historieBlock !== null,
  }
}

export function appendFormattedCaseContext(
  sections: string[],
  ctx: CasePromptContext,
  options?: { includeAktuell?: boolean; includeHistorie?: boolean },
): string[] {
  const includeAktuell = options?.includeAktuell !== false
  const includeHistorie = options?.includeHistorie !== false

  sections.push(ctx.scopeBlock)

  if (includeAktuell) {
    sections.push('', '=== AKTUELLES SCHREIBEN (Bereich 1) ===', ctx.aktuellBlock)
  }

  if (includeHistorie && ctx.historieBlock) {
    sections.push('', '=== HISTORIE DIESES FALLS (Bereich 2) ===', ctx.historieBlock)
  }

  return sections
}
