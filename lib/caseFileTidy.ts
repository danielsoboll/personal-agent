import {
  parseCaseFileJsonl,
  serializeCaseFileJsonl,
  todayIsoDate,
  type BlockArt,
  type CaseFileRecord,
  type CaseFileRecordType,
} from '@/lib/caseFileJsonl'

/** Kanonische Reihenfolge der Record-Typen in der Fallakte. */
const TYPE_ORDER: Record<CaseFileRecordType, number> = {
  meta: 0,
  kontext: 1,
  block: 2,
  anfrage: 3,
  resultat: 4,
  dokument: 5,
  person: 6,
  frist: 7,
  schritt: 8,
  offen: 9,
  aktion: 10,
}

const RUNDE_ORDER: Record<string, number> = {
  initial: 0,
  ergaenzung: 1,
  historisch: 2,
  followup: 3,
}

const PRIORITY_ORDER: Record<string, number> = {
  hoch: 0,
  mittel: 1,
  niedrig: 2,
}

export type CaseFileTidyReport = {
  removedDuplicates: number
  mergedMetaLines: number
  mergedKontextLines: number
  warnings: string[]
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function mergeRecords(base: CaseFileRecord, patch: CaseFileRecord): CaseFileRecord {
  return { ...base, ...patch, typ: base.typ }
}

function consolidateMeta(records: CaseFileRecord[]): { meta: CaseFileRecord | null; mergedCount: number } {
  const metaLines = records.filter((record) => record.typ === 'meta')
  if (metaLines.length === 0) return { meta: null, mergedCount: 0 }

  let merged = { ...metaLines[0] }
  for (const line of metaLines.slice(1)) {
    merged = mergeRecords(merged, line)
  }

  if (typeof merged.aktualisiert !== 'string' || !merged.aktualisiert.trim()) {
    merged.aktualisiert = todayIsoDate()
  }

  return { meta: merged, mergedCount: Math.max(0, metaLines.length - 1) }
}

function consolidateKontext(records: CaseFileRecord[]): { kontext: CaseFileRecord | null; mergedCount: number } {
  const lines = records.filter((record) => record.typ === 'kontext' && typeof record.text === 'string')
  if (lines.length === 0) return { kontext: null, mergedCount: 0 }

  const best = lines.reduce((current, candidate) => {
    const currentText = normalizeText(current.text)
    const candidateText = normalizeText(candidate.text)
    return candidateText.length >= currentText.length ? candidate : current
  })

  return { kontext: { typ: 'kontext', text: String(best.text).trim() }, mergedCount: Math.max(0, lines.length - 1) }
}

function latestByKey<T extends CaseFileRecord>(
  records: T[],
  keyFn: (record: T) => string | null,
): { kept: T[]; removed: number } {
  const byKey = new Map<string, T>()

  for (const record of records) {
    const key = keyFn(record)
    if (!key) continue
    const existing = byKey.get(key)
    byKey.set(key, (existing ? mergeRecords(existing, record) : record) as T)
  }

  return { kept: [...byKey.values()], removed: records.length - byKey.size }
}

function dedupeSchritte(records: CaseFileRecord[]): { kept: CaseFileRecord[]; removed: number } {
  const schritte = records.filter((record) => record.typ === 'schritt')
  const byId = latestByKey(schritte, (record) =>
    typeof record.id === 'string' ? `id:${record.id}` : null,
  )

  const byText = latestByKey(byId.kept, (record) => {
    const text = normalizeText(record.text)
    return text ? `text:${text}` : null
  })

  return { kept: byText.kept, removed: schritte.length - byText.kept.length }
}

function sortBlocks(a: CaseFileRecord, b: CaseFileRecord): number {
  const artOrder = (art: unknown) => (art === 'historisch' ? 1 : 0)
  const artDiff = artOrder(a.art) - artOrder(b.art)
  if (artDiff !== 0) return artDiff

  const dateA = typeof a.eroeffnet === 'string' ? a.eroeffnet : ''
  const dateB = typeof b.eroeffnet === 'string' ? b.eroeffnet : ''
  return dateA.localeCompare(dateB)
}

function sortDokumente(a: CaseFileRecord, b: CaseFileRecord): number {
  const blockA = typeof a.block_id === 'string' ? a.block_id : ''
  const blockB = typeof b.block_id === 'string' ? b.block_id : ''
  const blockDiff = blockA.localeCompare(blockB)
  if (blockDiff !== 0) return blockDiff

  const rundeA = RUNDE_ORDER[String(a.runde)] ?? 99
  const rundeB = RUNDE_ORDER[String(b.runde)] ?? 99
  if (rundeA !== rundeB) return rundeA - rundeB

  const quelleA = typeof a.quelle === 'string' ? a.quelle : ''
  const quelleB = typeof b.quelle === 'string' ? b.quelle : ''
  return quelleA.localeCompare(quelleB)
}

function sortFristen(a: CaseFileRecord, b: CaseFileRecord): number {
  const dateA = typeof a.datum === 'string' ? a.datum : '9999-12-31'
  const dateB = typeof b.datum === 'string' ? b.datum : '9999-12-31'
  return dateA.localeCompare(dateB)
}

function sortSchritte(a: CaseFileRecord, b: CaseFileRecord): number {
  const dateA = typeof a.frist === 'string' ? a.frist : '9999-12-31'
  const dateB = typeof b.frist === 'string' ? b.frist : '9999-12-31'
  const dateDiff = dateA.localeCompare(dateB)
  if (dateDiff !== 0) return dateDiff

  const prioA = PRIORITY_ORDER[String(a.prioritaet)] ?? 99
  const prioB = PRIORITY_ORDER[String(b.prioritaet)] ?? 99
  return prioA - prioB
}

function sortByType(records: CaseFileRecord[]): CaseFileRecord[] {
  return [...records].sort((a, b) => {
    const typeDiff = TYPE_ORDER[a.typ] - TYPE_ORDER[b.typ]
    if (typeDiff !== 0) return typeDiff

    switch (a.typ) {
      case 'block':
        return sortBlocks(a, b)
      case 'dokument':
        return sortDokumente(a, b)
      case 'person': {
        const nameA = normalizeText(a.name)
        const nameB = normalizeText(b.name)
        return nameA.localeCompare(nameB)
      }
      case 'frist':
        return sortFristen(a, b)
      case 'schritt':
        return sortSchritte(a, b)
      case 'offen': {
        const frageA = normalizeText(a.frage)
        const frageB = normalizeText(b.frage)
        return frageA.localeCompare(frageB)
      }
      case 'aktion': {
        const textA = normalizeText(a.text)
        const textB = normalizeText(b.text)
        return textA.localeCompare(textB)
      }
      default:
        return 0
    }
  })
}

function collectWarnings(records: CaseFileRecord[]): string[] {
  const warnings: string[] = []
  const blocks = records.filter((record) => record.typ === 'block')
  const dokumente = records.filter((record) => record.typ === 'dokument')
  const blockIds = new Set(
    blocks.map((block) => (typeof block.id === 'string' ? block.id : '')).filter(Boolean),
  )

  for (const dokument of dokumente) {
    const blockId = typeof dokument.block_id === 'string' ? dokument.block_id : ''
    if (blockId && !blockIds.has(blockId)) {
      warnings.push(`dokument ohne passenden block: ${blockId}`)
    }
    if (!normalizeText(dokument.zusammenfassung)) {
      warnings.push('dokument ohne zusammenfassung')
    }
  }

  const openAktuell = blocks.filter(
    (block) => block.art === 'aktuell' && block.status === 'offen',
  )
  if (openAktuell.length > 1) {
    warnings.push('mehr als ein offener aktuell-Block')
  }

  return warnings
}

export function tidyCaseFileRecords(records: CaseFileRecord[]): {
  records: CaseFileRecord[]
  report: CaseFileTidyReport
} {
  const warnings = collectWarnings(records)
  let removedDuplicates = 0

  const { meta, mergedCount: mergedMetaLines } = consolidateMeta(records)
  const { kontext, mergedCount: mergedKontextLines } = consolidateKontext(records)

  const blocks = latestByKey(
    records.filter((record) => record.typ === 'block'),
    (record) => (typeof record.id === 'string' ? record.id : null),
  )
  removedDuplicates += blocks.removed

  const anfragen = latestByKey(
    records.filter((record) => record.typ === 'anfrage'),
    (record) => (typeof record.block_id === 'string' ? record.block_id : null),
  )
  removedDuplicates += anfragen.removed

  const resultate = latestByKey(
    records.filter((record) => record.typ === 'resultat'),
    (record) => (typeof record.block_id === 'string' ? record.block_id : null),
  )
  removedDuplicates += resultate.removed

  const dokumente = latestByKey(
    records.filter((record) => record.typ === 'dokument'),
    (record) => {
      const quelle = typeof record.quelle === 'string' ? record.quelle.trim() : ''
      if (quelle) return `quelle:${quelle}`
      const blockId = typeof record.block_id === 'string' ? record.block_id : 'unknown'
      const summary = normalizeText(record.zusammenfassung).slice(0, 120)
      return `doc:${blockId}|${summary}`
    },
  )
  removedDuplicates += dokumente.removed

  const personen = latestByKey(
    records.filter((record) => record.typ === 'person'),
    (record) => {
      const name = normalizeText(record.name)
      const rolle = normalizeText(record.rolle)
      return name ? `person:${name}|${rolle}` : null
    },
  )
  removedDuplicates += personen.removed

  const fristen = latestByKey(
    records.filter((record) => record.typ === 'frist'),
    (record) => {
      const datum = typeof record.datum === 'string' ? record.datum : 'ohne-datum'
      const beschreibung = normalizeText(record.beschreibung)
      return beschreibung ? `frist:${datum}|${beschreibung}` : null
    },
  )
  removedDuplicates += fristen.removed

  const schritte = dedupeSchritte(records)
  removedDuplicates += schritte.removed

  const offen = latestByKey(
    records.filter((record) => record.typ === 'offen'),
    (record) => {
      const frage = normalizeText(record.frage)
      return frage ? `offen:${frage}` : null
    },
  )
  removedDuplicates += offen.removed

  const aktionen = latestByKey(
    records.filter((record) => record.typ === 'aktion'),
    (record) => {
      const text = normalizeText(record.text)
      return text ? `aktion:${text}` : null
    },
  )
  removedDuplicates += aktionen.removed

  const assembled: CaseFileRecord[] = []
  if (meta) assembled.push(meta)
  assembled.push(...sortByType(blocks.kept))
  assembled.push(...sortByType(anfragen.kept))
  assembled.push(...sortByType(resultate.kept))
  if (kontext) assembled.push(kontext)
  assembled.push(...sortByType(dokumente.kept))
  assembled.push(...sortByType(personen.kept))
  assembled.push(...sortByType(fristen.kept))
  assembled.push(...sortByType(schritte.kept))
  assembled.push(...sortByType(offen.kept))
  assembled.push(...sortByType(aktionen.kept))

  return {
    records: assembled,
    report: {
      removedDuplicates,
      mergedMetaLines,
      mergedKontextLines,
      warnings: collectWarnings(assembled),
    },
  }
}

export function tidyCaseFileJsonl(content: string): { content: string; report: CaseFileTidyReport } {
  const records = parseCaseFileJsonl(content)
  const { records: tidied, report } = tidyCaseFileRecords(records)
  return {
    content: serializeCaseFileJsonl(tidied),
    report,
  }
}

export function prepareCaseFileContent(rawContent: string): {
  content: string
  report: CaseFileTidyReport
} {
  return tidyCaseFileJsonl(rawContent)
}

export function getLatestAktuellBlockId(records: CaseFileRecord[]): string | null {
  const blocks = records.filter((record) => record.typ === 'block' && record.art === 'aktuell')
  const byId = latestByKey(blocks, (record) => (typeof record.id === 'string' ? record.id : null))
  const open = byId.kept.find((block) => block.status === 'offen')
  if (open && typeof open.id === 'string') return open.id

  const closed = sortByType(byId.kept)
    .filter((block) => block.status === 'abgeschlossen')
    .reverse()
  const latestClosed = closed[0]
  return typeof latestClosed?.id === 'string' ? latestClosed.id : null
}

export function blockArtLabel(art: BlockArt): string {
  return art === 'historisch' ? 'Historie' : 'Aktuell'
}
