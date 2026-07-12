import { createId } from '@/lib/createId'
import {
  parseCaseFileJsonl,
  prepareCaseFileContent,
  serializeCaseFileJsonl,
  todayIsoDate,
  type BlockArt,
  type CaseFileRecord,
} from '@/lib/caseFileJsonl'

function finalizeCaseFile(content: string): string {
  return prepareCaseFileContent(content).content
}

export type ParsedBlock = {
  id: string
  art: BlockArt
  status: 'offen' | 'abgeschlossen'
  titel?: string
  eroeffnet?: string
  abgeschlossen?: string
}

export type ParsedSchritt = {
  id: string
  text: string
  frist?: string
  prioritaet?: string
  status?: string
  block_id?: string
}

export function getBlockState(content: string): {
  openAktuell: ParsedBlock | null
  openHistorisch: ParsedBlock | null
  blocks: ParsedBlock[]
  schritte: ParsedSchritt[]
} {
  const records = parseCaseFileJsonl(content)
  const blocksById = new Map<string, ParsedBlock>()
  const schritte: ParsedSchritt[] = []

  for (const record of records) {
    if (record.typ === 'block' && typeof record.id === 'string') {
      blocksById.set(record.id, {
        id: record.id,
        art: record.art as BlockArt,
        status: record.status as 'offen' | 'abgeschlossen',
        titel: typeof record.titel === 'string' ? record.titel : undefined,
        eroeffnet: typeof record.eroeffnet === 'string' ? record.eroeffnet : undefined,
        abgeschlossen: typeof record.abgeschlossen === 'string' ? record.abgeschlossen : undefined,
      })
    }

    if (record.typ === 'schritt' && typeof record.id === 'string' && typeof record.text === 'string') {
      schritte.push({
        id: record.id,
        text: record.text,
        frist: typeof record.frist === 'string' ? record.frist : undefined,
        prioritaet: typeof record.prioritaet === 'string' ? record.prioritaet : undefined,
        status: typeof record.status === 'string' ? record.status : undefined,
        block_id: typeof record.block_id === 'string' ? record.block_id : undefined,
      })
    }
  }

  const blocks = [...blocksById.values()]
  const openAktuell = blocks.find((block) => block.art === 'aktuell' && block.status === 'offen') ?? null
  const openHistorisch =
    blocks.find((block) => block.art === 'historisch' && block.status === 'offen') ?? null

  return { openAktuell, openHistorisch, blocks, schritte }
}

export function closeOpenAktuellBlock(content: string): string {
  const records = parseCaseFileJsonl(content)
  const { openAktuell } = getBlockState(content)

  if (!openAktuell) {
    return finalizeCaseFile(content)
  }

  const closure: CaseFileRecord = {
    typ: 'block',
    id: openAktuell.id,
    art: 'aktuell',
    status: 'abgeschlossen',
    titel: openAktuell.titel,
    eroeffnet: openAktuell.eroeffnet,
    abgeschlossen: todayIsoDate(),
  }

  const updated = records.map((record) => {
    if (record.typ !== 'meta') return record
    return { ...record, aktualisiert: todayIsoDate(), phase: 'sammeln' }
  })

  return finalizeCaseFile(serializeCaseFileJsonl([...updated, closure]))
}

export function openHistorischBlock(content: string, titel?: string): string {
  const closed = closeOpenAktuellBlock(content)
  const records = parseCaseFileJsonl(closed)
  const blockId = `blk_hist_${createId().slice(0, 8)}`

  const block: CaseFileRecord = {
    typ: 'block',
    id: blockId,
    art: 'historisch',
    status: 'offen',
    titel: titel?.trim() || 'Ältere Unterlagen',
    eroeffnet: todayIsoDate(),
  }

  return finalizeCaseFile(serializeCaseFileJsonl([...records, block]))
}

export function openAktuellBlock(content: string, titel?: string): string {
  const records = parseCaseFileJsonl(content)
  const { openAktuell } = getBlockState(content)

  if (openAktuell) {
    return finalizeCaseFile(content)
  }

  const blockId = `blk_aktuell_${createId().slice(0, 8)}`
  const block: CaseFileRecord = {
    typ: 'block',
    id: blockId,
    art: 'aktuell',
    status: 'offen',
    titel: titel?.trim() || 'Aktuelles Schreiben',
    eroeffnet: todayIsoDate(),
  }

  return finalizeCaseFile(serializeCaseFileJsonl([...records, block]))
}

export function markReadyForAssessment(content: string): string {
  const records = parseCaseFileJsonl(content)
  let closed = closeOpenAktuellBlock(content)
  const { openHistorisch } = getBlockState(closed)

  if (openHistorisch) {
    const histClosure: CaseFileRecord = {
      typ: 'block',
      id: openHistorisch.id,
      art: 'historisch',
      status: 'abgeschlossen',
      titel: openHistorisch.titel,
      eroeffnet: openHistorisch.eroeffnet,
      abgeschlossen: todayIsoDate(),
    }
    closed = serializeCaseFileJsonl([...parseCaseFileJsonl(closed), histClosure])
  }

  const updated = parseCaseFileJsonl(closed).map((record) => {
    if (record.typ !== 'meta') return record
    return { ...record, aktualisiert: todayIsoDate(), phase: 'bewertung' }
  })

  return finalizeCaseFile(serializeCaseFileJsonl(updated.length ? updated : records))
}

export function getMetaPhase(content: string): string | null {
  const records = parseCaseFileJsonl(content)
  const meta = records.find((record) => record.typ === 'meta')
  return typeof meta?.phase === 'string' ? meta.phase : null
}
