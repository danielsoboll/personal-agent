export const CASE_FILE_FORMAT = 'jsonl' as const

/** Erlaubte `typ`-Werte pro JSONL-Zeile. */
export const CASE_FILE_RECORD_TYPES = [
  'meta',
  'kontext',
  'dokument',
  'person',
  'frist',
  'offen',
  'aktion',
] as const

export type CaseFileRecordType = (typeof CASE_FILE_RECORD_TYPES)[number]

export function parseCaseFileJsonl(content: string): unknown[] {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('JSONL-Fallakte ist leer.')
  }

  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as unknown
    } catch {
      throw new Error(`JSONL-Zeile ${index + 1} ist kein gültiges JSON.`)
    }
  })
}

export function isCaseFileRecordType(value: unknown): value is CaseFileRecordType {
  return typeof value === 'string' && CASE_FILE_RECORD_TYPES.includes(value as CaseFileRecordType)
}

export function validateCaseFileJsonl(content: string): string | null {
  let records: unknown[]

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

    const typ = (record as { typ?: unknown }).typ
    if (!isCaseFileRecordType(typ)) {
      return `JSONL-Zeile ${index + 1} hat einen ungültigen typ.`
    }

    if (typ === 'meta') {
      hasMeta = true
      const name = (record as { name?: unknown }).name
      const fall = (record as { fall?: unknown }).fall
      if (typeof name !== 'string' || !name.trim()) {
        return `meta-Zeile ${index + 1} braucht ein name-Feld.`
      }
      if (typeof fall !== 'string' || !fall.trim()) {
        return `meta-Zeile ${index + 1} braucht ein fall-Feld.`
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

/** Beispiel für den KI-Prompt — nicht dem Nutzer anzeigen. */
export const CASE_FILE_JSONL_EXAMPLE = `{"typ":"meta","name":"Nico","fall":"Unterhalt Neuberechnung","aktualisiert":"2026-07-12","version":1}
{"typ":"kontext","text":"Anwaltin der Mutter fordert Unterlagen für Unterhaltsneuberechnung."}
{"typ":"dokument","datum":"2026-06-01","titel":"Schreiben Anwältin","zusammenfassung":"Unterlagen zur Neuberechnung des Unterhalts werden angefordert.","quelle":"scan_r1_foto1","runde":"initial"}
{"typ":"offen","frage":"E-Mails und Schriftstücke zur bisherigen Unterhaltszahlung","prioritaet":"hoch"}
{"typ":"aktion","text":"Unterlagen sammeln und bei Anwältin einreichen","status":"offen"}`
