export const CASE_FILE_FORMAT = 'jsonl' as const

/** Erlaubte `typ`-Werte pro JSONL-Zeile. */
export const CASE_FILE_RECORD_TYPES = [
  'meta',
  'kontext',
  'block',
  'dokument',
  'person',
  'frist',
  'offen',
  'aktion',
  'schritt',
] as const

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

export function serializeCaseFileJsonl(records: CaseFileRecord[]): string {
  return normalizeCaseFileJsonl(records.map((record) => JSON.stringify(record)).join('\n'))
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Beispiel für den KI-Prompt — nicht dem Nutzer anzeigen. */
export const CASE_FILE_JSONL_EXAMPLE = `{"typ":"meta","name":"Lukas","fall":"Finanzamt Steuerbescheid","aktualisiert":"2026-07-12","phase":"sammeln","version":2}
{"typ":"kontext","text":"Finanzamt München sendet Steuerbescheid 2023 mit Nachzahlung. Einspruchsfrist läuft."}
{"typ":"block","id":"blk_aktuell_1","art":"aktuell","status":"offen","titel":"Finanzamt München — Steuerbescheid 2023","eroeffnet":"2026-07-12"}
{"typ":"dokument","block_id":"blk_aktuell_1","rolle":"aktuell","datum":"2026-06-15","titel":"Steuerbescheid 2023 Seite 1","zusammenfassung":"Finanzamt München, Steuernummer 123/456/78910. Festsetzung Einkommensteuer 2023. Festgesetzte Einkommensteuer: 4.820 EUR, bereits gezahlt 3.580 EUR, Ergebnis Nachzahlung 1.240 EUR. Hinweis auf Einspruch innerhalb eines Monats nach Bekanntgabe.","quelle":"scan_r1_foto1","runde":"initial"}
{"typ":"dokument","block_id":"blk_aktuell_1","rolle":"aktuell","datum":"2026-06-15","titel":"Steuerbescheid 2023 Seite 2 — Fristen","zusammenfassung":"Bekanntgabe gilt am 20.06.2026 als zugegangen. Zahlung bis 04.07.2026 ohne Säumniszuschlag. Rechtsbehelfsbelehrung: Einspruch binnen eines Monats schriftlich oder elektronisch.","quelle":"scan_r1_foto2","runde":"initial"}
{"typ":"person","name":"Finanzamt München","rolle":"Behörde"}
{"typ":"frist","datum":"2026-07-20","beschreibung":"Einspruchsfrist (1 Monat nach Bekanntgabe 20.06.2026)","quelle":"blk_aktuell_1"}
{"typ":"frist","datum":"2026-07-04","beschreibung":"Zahlung Nachzahlung 1.240 EUR ohne Säumniszuschlag","quelle":"blk_aktuell_1"}
{"typ":"schritt","id":"schritt_1","text":"Bescheid prüfen: Beträge und Steuernummer mit deiner Erklärung vergleichen","prioritaet":"hoch","status":"offen","block_id":"blk_aktuell_1"}
{"typ":"schritt","id":"schritt_2","text":"Bei Unstimmigkeit: Einspruch schriftlich/ELSTER einlegen","frist":"2026-07-20","prioritaet":"hoch","status":"offen","block_id":"blk_aktuell_1"}`
