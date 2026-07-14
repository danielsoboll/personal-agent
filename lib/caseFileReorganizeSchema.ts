export const CASE_FILE_REORGANIZE_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    caseFileContent: {
      type: 'string' as const,
      description: 'Vollständige überarbeitete JSONL-Fallakte (2 Bereiche: aktuell + Historie)',
    },
  },
  required: ['caseFileContent'],
}

export type CaseFileReorganizeResponse = {
  caseFileContent: string
}
