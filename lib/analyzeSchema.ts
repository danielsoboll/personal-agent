import type { DocumentsStatus, StructuredStep } from '@/lib/analyzeTypes'

export const ANALYZE_RESULT_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    caseFileContent: {
      type: 'string' as const,
      description: 'Interne JSONL-Fallakte, eine JSON-Zeile pro Eintrag',
    },
    summary: { type: 'string' as const },
    assessment: { type: 'string' as const },
    nextSteps: { type: 'string' as const },
    structuredSteps: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        additionalProperties: false,
        properties: {
          id: { type: 'string' as const },
          text: { type: 'string' as const },
          deadline: { type: 'string' as const },
          priority: { type: 'string' as const, enum: ['hoch', 'mittel', 'niedrig'] },
        },
        required: ['id', 'text', 'deadline', 'priority'],
      },
    },
    needsMoreDocuments: { type: 'boolean' as const },
    requestedDocuments: { type: 'string' as const },
    documentsStatus: {
      type: 'string' as const,
      enum: ['not_needed', 'recommended', 'required'],
      description:
        'not_needed = genug Kontext; recommended = zusätzliche Unterlagen wären hilfreich; required = ohne weitere Unterlagen keine belastbare Einordnung',
    },
    documentsComment: {
      type: 'string' as const,
      description: 'Kurzer deutscher Kommentar zur Unterlagen-Einschätzung für den Nutzer',
    },
    isComplete: { type: 'boolean' as const },
    documentChoiceRequired: { type: 'boolean' as const },
    readyForFinalAssessment: { type: 'boolean' as const },
    phase: { type: 'string' as const, enum: ['interim', 'final'] },
  },
  required: [
    'caseFileContent',
    'summary',
    'assessment',
    'nextSteps',
    'structuredSteps',
    'needsMoreDocuments',
    'requestedDocuments',
    'documentsStatus',
    'documentsComment',
    'isComplete',
    'documentChoiceRequired',
    'readyForFinalAssessment',
    'phase',
  ],
}

export type ParsedAnalyzePayload = {
  caseFileContent: string
  summary: string
  assessment: string
  nextSteps: string
  structuredSteps: StructuredStep[]
  needsMoreDocuments: boolean
  requestedDocuments: string
  documentsStatus: DocumentsStatus
  documentsComment: string
  isComplete: boolean
  documentChoiceRequired: boolean
  readyForFinalAssessment: boolean
  phase: 'interim' | 'final'
}

export function normalizeDocumentsFields(payload: {
  documentsStatus?: DocumentsStatus
  documentsComment?: string
  requestedDocuments?: string
  needsMoreDocuments?: boolean
}): {
  documentsStatus: DocumentsStatus
  documentsComment: string
  requestedDocuments: string
  needsMoreDocuments: boolean
} {
  let status = payload.documentsStatus

  if (!status) {
    if (payload.needsMoreDocuments && payload.requestedDocuments?.trim()) {
      status = 'required'
    } else if (payload.needsMoreDocuments) {
      status = 'recommended'
    } else {
      status = 'not_needed'
    }
  }

  const requestedDocuments = payload.requestedDocuments?.trim() ?? ''
  const documentsComment =
    payload.documentsComment?.trim() ||
    (status === 'not_needed'
      ? 'Aus den vorliegenden Unterlagen ist eine belastbare Einordnung möglich.'
      : status === 'recommended'
        ? 'Zusätzliche Unterlagen würden die Einordnung verbessern, sind aber nicht zwingend.'
        : 'Ohne die genannten Unterlagen fehlt wesentlicher Kontext.')

  return {
    documentsStatus: status,
    documentsComment,
    requestedDocuments,
    needsMoreDocuments: status === 'required',
  }
}

export function normalizeStructuredSteps(steps: StructuredStep[]): StructuredStep[] {
  return steps
    .filter((step) => step.text?.trim())
    .map((step, index) => ({
      id: step.id?.trim() || `schritt_${index + 1}`,
      text: step.text.trim(),
      deadline: step.deadline?.trim() || undefined,
      priority: step.priority,
    }))
}

export const PREPARE_STEP_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    title: { type: 'string' as const },
    subject: { type: 'string' as const },
    bodyParagraphs: {
      type: 'array' as const,
      items: { type: 'string' as const },
    },
    previewText: { type: 'string' as const },
  },
  required: ['title', 'subject', 'bodyParagraphs', 'previewText'],
}

export type PreparedDocumentContent = {
  title: string
  subject: string
  bodyParagraphs: string[]
  previewText: string
}
