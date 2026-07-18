export const CASE_FILE_FORMAT = 'jsonl' as const

/** Erlaubte `typ`-Werte pro JSONL-Zeile. */
export const CASE_FILE_RECORD_TYPES = [
  'meta',
  'kontext',
  'block',
  'anfrage',
  'resultat',
  'dokument',
  'person',
  'frist',
  'offen',
  'aktion',
  'schritt',
] as const

/** Feste Block-ID für Bereich 1 — aktuelle Anfrage & Resultat. */
export const AKTUELL_BLOCK_ID = 'blk_aktuell'

export type CaseFileRecordType = (typeof CASE_FILE_RECORD_TYPES)[number]

export type BlockArt = 'aktuell' | 'historisch'
export type BlockStatus = 'offen' | 'abgeschlossen'
export type DokumentRolle = 'aktuell' | 'historisch'
export type SchrittPrioritaet = 'hoch' | 'mittel' | 'niedrig'

export type CaseFileRecord = {
  typ: CaseFileRecordType
  [key: string]: unknown
}

export function parseCaseFileJsonl(content: string): CaseFileRecord[] {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('JSONL-Fallakte ist leer.')
  }

  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as CaseFileRecord
    } catch {
      throw new Error(`JSONL-Zeile ${index + 1} ist kein gültiges JSON.`)
    }
  })
}

export function isCaseFileRecordType(value: unknown): value is CaseFileRecordType {
  return typeof value === 'string' && CASE_FILE_RECORD_TYPES.includes(value as CaseFileRecordType)
}

export function validateCaseFileJsonl(content: string): string | null {
  let records: CaseFileRecord[]

  try {
    records = parseCaseFileJsonl(content)
  } catch (error) {
    return error instanceof Error ? error.message : 'Ungültige JSONL-Fallakte.'
  }

  let hasMeta = false

  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return `JSONL-Zeile ${index + 1} muss ein JSON-Objekt sein.`
    }

    const typ = record.typ
    if (!isCaseFileRecordType(typ)) {
      return `JSONL-Zeile ${index + 1} hat einen ungültigen typ.`
    }

    if (typ === 'meta') {
      hasMeta = true
      const name = record.name
      const fall = record.fall
      if (typeof name !== 'string' || !name.trim()) {
        return `meta-Zeile ${index + 1} braucht ein name-Feld.`
      }
      if (typeof fall !== 'string' || !fall.trim()) {
        return `meta-Zeile ${index + 1} braucht ein fall-Feld.`
      }
    }

    if (typ === 'block') {
      const art = record.art
      const status = record.status
      const id = record.id
      if (typeof id !== 'string' || !id.trim()) {
        return `block-Zeile ${index + 1} braucht ein id-Feld.`
      }
      if (art !== 'aktuell' && art !== 'historisch') {
        return `block-Zeile ${index + 1} braucht art "aktuell" oder "historisch".`
      }
      if (status !== 'offen' && status !== 'abgeschlossen') {
        return `block-Zeile ${index + 1} braucht status "offen" oder "abgeschlossen".`
      }
    }

    if (typ === 'anfrage') {
      const blockId = record.block_id
      const text = record.text
      if (typeof blockId !== 'string' || !blockId.trim()) {
        return `anfrage-Zeile ${index + 1} braucht block_id.`
      }
      if (typeof text !== 'string' || !text.trim()) {
        return `anfrage-Zeile ${index + 1} braucht text.`
      }
    }

    if (typ === 'resultat') {
      const blockId = record.block_id
      const summary = record.summary
      const assessment = record.assessment
      if (typeof blockId !== 'string' || !blockId.trim()) {
        return `resultat-Zeile ${index + 1} braucht block_id.`
      }
      const hasSummary = typeof summary === 'string' && summary.trim()
      const hasAssessment = typeof assessment === 'string' && assessment.trim()
      if (!hasSummary && !hasAssessment) {
        return `resultat-Zeile ${index + 1} braucht summary oder assessment.`
      }
    }

    if (typ === 'schritt') {
      const id = record.id
      const text = record.text
      if (typeof id !== 'string' || !id.trim()) {
        return `schritt-Zeile ${index + 1} braucht ein id-Feld.`
      }
      if (typeof text !== 'string' || !text.trim()) {
        return `schritt-Zeile ${index + 1} braucht ein text-Feld.`
      }
    }
  }

  if (!hasMeta) {
    return 'JSONL-Fallakte braucht mindestens eine meta-Zeile.'
  }

  return null
}

export function normalizeCaseFileJsonl(content: string): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return `${lines.join('\n')}\n`
}

export { prepareCaseFileContent, tidyCaseFileJsonl, tidyCaseFileRecords } from '@/lib/caseFileTidy'
export type { CaseFileTidyReport } from '@/lib/caseFileTidy'

function findAktuellBlockId(records: CaseFileRecord[]): string {
  const blocks = records.filter((record) => record.typ === 'block' && record.art === 'aktuell')
  const open = blocks.find((record) => record.status === 'offen')
  if (open && typeof open.id === 'string') return open.id
  const anyBlock = blocks.find((record) => typeof record.id === 'string')
  if (anyBlock && typeof anyBlock.id === 'string') return anyBlock.id
  return AKTUELL_BLOCK_ID
}

export function mergeAktuellSectionCaseFile(
  existingCaseFile: string,
  input: {
    name: string
    fall: string
    anfrage: string
    resultat: AktuellResultatInput
  },
): string {
  let records: CaseFileRecord[]
  try {
    records = parseCaseFileJsonl(existingCaseFile)
  } catch {
    return createAktuellSectionCaseFile(input)
  }

  const preserved = records.filter(
    (record) =>
      record.typ !== 'meta' &&
      record.typ !== 'anfrage' &&
      record.typ !== 'resultat' &&
      !(record.typ === 'block' && record.art === 'aktuell'),
  )

  const freshAktuell = parseCaseFileJsonl(createAktuellSectionCaseFile(input))
  const meta = freshAktuell.find((record) => record.typ === 'meta')
  const aktuellRecords = freshAktuell.filter(
    (record) => record.typ !== 'meta',
  )

  return serializeCaseFileJsonl([...(meta ? [meta] : []), ...aktuellRecords, ...preserved])
}

export function hasHistorieRecords(caseFileContent: string): boolean {
  try {
    const records = parseCaseFileJsonl(caseFileContent)
    return records.some(
      (record) =>
        (record.typ === 'block' && record.art === 'historisch') ||
        (record.typ === 'dokument' && record.rolle === 'historisch'),
    )
  } catch {
    return false
  }
}

export function createMinimalCaseFileContent(name: string, fall: string): string {
  return createAktuellSectionCaseFile({
    name,
    fall,
    anfrage: 'Fall angelegt — noch keine Dokumente geprüft.',
    resultat: {
      summary: '',
      assessment: '',
      nextSteps: '',
      phase: 'interim',
    },
  })
}

export type AktuellResultatInput = {
  summary: string
  assessment: string
  nextSteps?: string
  phase?: string
}

/** Bereich 1: meta + aktueller Block + Anfrage + Resultat (keine Historie). */
export function createAktuellSectionCaseFile(input: {
  name: string
  fall: string
  anfrage: string
  resultat: AktuellResultatInput
}): string {
  const today = todayIsoDate()
  const blockId = AKTUELL_BLOCK_ID
  const summary = input.resultat.summary.trim()
  const assessment = input.resultat.assessment.trim()

  const records: CaseFileRecord[] = [
    {
      typ: 'meta',
      name: input.name.trim() || 'Nutzer',
      fall: input.fall.trim(),
      aktualisiert: today,
      phase: 'sammeln',
      version: 3,
    },
    {
      typ: 'block',
      id: blockId,
      art: 'aktuell',
      bereich: 'aktuell',
      status: 'offen',
      titel: 'Aktuelle Anfrage & Resultat',
      eroeffnet: today,
    },
    {
      typ: 'anfrage',
      block_id: blockId,
      text: input.anfrage.trim(),
      datum: today,
    },
  ]

  if (summary || assessment) {
    records.push({
      typ: 'resultat',
      block_id: blockId,
      summary,
      assessment,
      next_steps: input.resultat.nextSteps?.trim() ?? '',
      stand: today,
      phase: input.resultat.phase ?? 'interim',
    })
  }

  return serializeCaseFileJsonl(records)
}

/** Resultat aus Zwischenauswertung nachziehen, Historie-Bereich bleibt unangetastet. */
export function upsertAktuellResultatFromReview(
  caseFileContent: string,
  interim: { summary?: string; assessment?: string; nextSteps?: string },
  anfrageFallback = 'Gespeicherte Zwischenauswertung',
): string {
  const summary = interim.summary?.trim() ?? ''
  const assessment = interim.assessment?.trim() ?? ''
  if (!summary && !assessment) return caseFileContent

  let records: CaseFileRecord[]
  try {
    records = parseCaseFileJsonl(caseFileContent)
  } catch {
    return caseFileContent
  }

  const meta = records.find((record) => record.typ === 'meta')
  const blockId = findAktuellBlockId(records)
  const today = todayIsoDate()
  const historieAndRest = records.filter(
    (record) =>
      record.typ !== 'anfrage' &&
      record.typ !== 'resultat' &&
      !(record.typ === 'block' && record.art === 'aktuell'),
  )

  const existingAnfrage = records.find((record) => record.typ === 'anfrage')
  const anfrageText =
    typeof existingAnfrage?.text === 'string' && existingAnfrage.text.trim()
      ? existingAnfrage.text.trim()
      : anfrageFallback

  const nextRecords: CaseFileRecord[] = [
    ...historieAndRest.filter((record) => record.typ !== 'meta'),
    {
      typ: 'block',
      id: blockId,
      art: 'aktuell',
      bereich: 'aktuell',
      status: 'offen',
      titel: 'Aktuelle Anfrage & Resultat',
      eroeffnet: today,
    },
    { typ: 'anfrage', block_id: blockId, text: anfrageText, datum: today },
    {
      typ: 'resultat',
      block_id: blockId,
      summary,
      assessment,
      next_steps: interim.nextSteps?.trim() ?? '',
      stand: today,
      phase: 'interim',
    },
  ]

  if (meta) {
    nextRecords.unshift({ ...meta, aktualisiert: today })
  } else {
    nextRecords.unshift({
      typ: 'meta',
      name: 'Nutzer',
      fall: 'Fall',
      aktualisiert: today,
      phase: 'sammeln',
      version: 3,
    })
  }

  return serializeCaseFileJsonl(nextRecords)
}

/** Kontext aus Zwischenauswertung, wenn Bereich 1 noch kein resultat hat. */
export function enrichCaseFileForAssessment(
  caseFileContent: string,
  interim?: { summary?: string; assessment?: string; nextSteps?: string } | null,
): string {
  if (!interim) return caseFileContent

  let records: CaseFileRecord[]
  try {
    records = parseCaseFileJsonl(caseFileContent)
  } catch {
    return caseFileContent
  }

  const hasHistorieDokument = records.some(
    (record) => record.typ === 'dokument' && record.rolle === 'historisch',
  )
  const hasResultat = records.some((record) => record.typ === 'resultat')
  if (hasHistorieDokument || hasResultat) return caseFileContent

  return upsertAktuellResultatFromReview(caseFileContent, interim)
}

export function serializeCaseFileJsonl(records: CaseFileRecord[]): string {
  return normalizeCaseFileJsonl(records.map((record) => JSON.stringify(record)).join('\n'))
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Minimale Fallakte — nur Bereich 1 (Anfrage + Resultat Platzhalter). */
export const CASE_FILE_JSONL_MINIMAL_EXAMPLE = `{"typ":"meta","name":"Lukas","fall":"Finanzamt Steuerbescheid","aktualisiert":"2026-07-14","phase":"sammeln","version":3}
{"typ":"block","id":"blk_aktuell","art":"aktuell","bereich":"aktuell","status":"offen","titel":"Aktuelle Anfrage & Resultat","eroeffnet":"2026-07-14"}
{"typ":"anfrage","block_id":"blk_aktuell","text":"3 Fotos Finanzamt Steuerbescheid 2023","datum":"2026-07-14"}
{"typ":"resultat","block_id":"blk_aktuell","summary":"Finanzamt München — Steuerbescheid 2023, Nachzahlung 1.240 EUR","assessment":"Du hast einen Bescheid mit Nachzahlung erhalten …","next_steps":"1. Bescheid prüfen\\n2. Frist für Einspruch beachten","stand":"2026-07-14","phase":"interim"}`

/** Fallakte mit Bereich 2 Historie — Mehrwert bei vielen Hintergrundseiten. */
export const CASE_FILE_JSONL_EXAMPLE = `{"typ":"meta","name":"Lukas","fall":"Finanzamt Steuerbescheid","aktualisiert":"2026-07-15","phase":"sammeln","version":3}
{"typ":"block","id":"blk_aktuell","art":"aktuell","bereich":"aktuell","status":"abgeschlossen","titel":"Aktuelle Anfrage & Resultat","eroeffnet":"2026-07-14","abgeschlossen":"2026-07-15"}
{"typ":"anfrage","block_id":"blk_aktuell","text":"3 Fotos aktueller Steuerbescheid 2023","datum":"2026-07-14"}
{"typ":"resultat","block_id":"blk_aktuell","summary":"Finanzamt München — Steuerbescheid 2023, Nachzahlung 1.240 EUR","assessment":"Du hast einen Bescheid mit Nachzahlung erhalten …","next_steps":"1. Bescheid prüfen\\n2. Zahlung oder Einspruch bis Frist","stand":"2026-07-14","phase":"interim"}
{"typ":"block","id":"blk_hist_1","art":"historisch","bereich":"historie","status":"offen","titel":"Historie","eroeffnet":"2026-07-15"}
{"typ":"kontext","bereich":"historie","text":"Steuerbescheide und Erklärungen 2021–2022 als Hintergrund für den aktuellen Bescheid."}
{"typ":"dokument","block_id":"blk_hist_1","rolle":"historisch","datum":"2024-06-10","titel":"Steuerbescheid 2022 Seite 1","zusammenfassung":"Festsetzung 2022, bereits vergleichbare Nachzahlung — Muster für aktuellen Bescheid.","quelle":"scan_hist_foto1","runde":"historisch"}
{"typ":"dokument","block_id":"blk_hist_1","rolle":"historisch","datum":"2023-05-12","titel":"Steuerbescheid 2021","zusammenfassung":"Vorjahres-Bescheid, gleiche Steuernummer, keine Auffälligkeiten.","quelle":"scan_hist_foto2","runde":"historisch"}`
