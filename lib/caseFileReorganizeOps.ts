import { parseCaseFileJsonl, type CaseFileRecord } from '@/lib/caseFileJsonl'

/** Interne Fallakte-Operationen — unsichtbar für den Nutzer. */
export type CaseFileReorganizeOperation =
  | 'extend_historie'
  | 'refresh_aktuell'
  | 'rotate_aktuell'
  | 'consolidate_historie'

export type CaseFileReviewSnapshot = {
  summary?: string
  assessment?: string
  nextSteps?: string
  phase?: string
}

export type CaseFileReorganizeInput = {
  operation: CaseFileReorganizeOperation
  userName: string
  caseTitle: string
  caseFileContent: string
  review?: CaseFileReviewSnapshot | null
}

export function hasPriorAktuellCycle(caseFileContent: string): boolean {
  try {
    const records = parseCaseFileJsonl(caseFileContent)
    return records.some((record) => record.typ === 'resultat')
  } catch {
    return false
  }
}

export function shouldRotateBeforeInitialScan(input: {
  intent: string
  existingCaseFile?: string | null
}): boolean {
  return input.intent === 'initial' && hasPriorAktuellCycle(input.existingCaseFile ?? '')
}

export function pickReorganizeAfterAnalyze(intent: string): CaseFileReorganizeOperation | null {
  if (intent === 'historical') return 'extend_historie'
  if (intent === 'current_more') return 'refresh_aktuell'
  return null
}

export function operationLabel(operation: CaseFileReorganizeOperation): string {
  switch (operation) {
    case 'extend_historie':
      return 'Historie erweitern'
    case 'refresh_aktuell':
      return 'Aktuelles Resultat aktualisieren'
    case 'rotate_aktuell':
      return 'Altes Schreiben in Historie, neues aktuell'
    case 'consolidate_historie':
      return 'Historie zusammenfassen'
  }
}
