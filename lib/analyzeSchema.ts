import type { DocumentsStatus, StructuredStep } from '@/lib/analyzeTypes'
import {
  DECISION_OUTPUT_PROPERTIES,
  DECISION_OUTPUT_REQUIRED,
  SCHEMA_OPTIONAL_PRIORITY,
  SCHEMA_OPTIONAL_STRING,
  normalizeDecisionFields,
  normalizeDocumentsStatus,
  normalizePrimaryDeadline,
  normalizeReviewPhase,
  normalizeStepPriority,
} from '@/lib/decisionFields'
import { FALLAKTE_FINDINGS_SCHEMA } from '@/lib/fallakteSchema'
import type { FallakteFindingsPayload } from '@/lib/fallakteTypes'

export const ANALYZE_RESULT_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    caseFileContent: {
      type: 'string' as const,
      description:
        'Interne JSONL: Bereich 1 anfrage+resultat; Bereich 2 Historie (dokument historisch)',
    },
    summary: {
      type: 'string' as const,
      description:
        'Zusammenfassung — Antwort auf „Was ist das?“: 2–3 kurze Zeilen, Absender, Dokumentart, Kerndaten',
    },
    assessment: {
      type: 'string' as const,
      description:
        'Was das Schreiben bedeutet — Du-Form, knapp (3–5 Sätze, max. ~450 Zeichen): Absenderwille, Bedeutung, Risiko bei Nicht-Reaktion',
    },
    nextSteps: { type: 'string' as const, description: 'Nummerierte Liste der nächsten Schritte' },
    structuredSteps: {
      type: 'array' as const,
      description: 'Nächste Schritte — Antwort auf „Was sollte ich jetzt tun?“: konkrete Handlungen',
      items: {
        type: 'object' as const,
        additionalProperties: false,
        properties: {
          id: { type: 'string' as const },
          text: { type: 'string' as const },
          deadline: {
            ...SCHEMA_OPTIONAL_STRING,
            description: 'Frist bevorzugt YYYY-MM-DD oder null — unklar lieber null',
          },
          priority: {
            ...SCHEMA_OPTIONAL_PRIORITY,
          },
        },
        required: ['id', 'text', 'deadline', 'priority'],
      },
    },
    ...DECISION_OUTPUT_PROPERTIES,
    needsMoreDocuments: { type: 'boolean' as const },
    documentsStatus: {
      type: 'string' as const,
      description:
        'Freier Text, idealerweise: not_needed | recommended | required. Üblich recommended wenn mehr Belege helfen.',
    },
    documentsComment: {
      type: 'string' as const,
      description:
        '1–2 kurze Sätze zur Unterlagen-Einschätzung, z. B. „Weitere Unterlagen sind sinnvoll.“ plus knapper Grund',
    },
    requestedDocuments: {
      type: 'string' as const,
      description:
        'Bei recommended/required konkrete Beispiele als Komma-Liste; sonst leerer String',
    },
    isComplete: { type: 'boolean' as const },
    documentChoiceRequired: { type: 'boolean' as const },
    readyForFinalAssessment: { type: 'boolean' as const },
    phase: {
      type: 'string' as const,
      description: 'interim oder final',
    },
    fallakteFindings: FALLAKTE_FINDINGS_SCHEMA,
  },
  required: [
    'caseFileContent',
    'summary',
    'assessment',
    'nextSteps',
    'structuredSteps',
    ...DECISION_OUTPUT_REQUIRED,
    'needsMoreDocuments',
    'requestedDocuments',
    'documentsStatus',
    'documentsComment',
    'isComplete',
    'documentChoiceRequired',
    'readyForFinalAssessment',
    'phase',
    'fallakteFindings',
  ],
}

export type ParsedAnalyzePayload = {
  caseFileContent: string
  summary: string
  assessment: string
  nextSteps: string
  structuredSteps: StructuredStep[]
  documentKind?: import('@/lib/analyzeTypes').DocumentKind
  primaryDeadline?: string
  primaryDeadlineLabel?: string
  keyClaims?: { id: string; text: string }[]
  contestablePoints?: { id: string; claim: string; why: string; suggestedAction: string }[]
  replyDraftRecommended?: boolean
  needsMoreDocuments: boolean
  requestedDocuments: string
  documentsStatus: DocumentsStatus
  documentsComment: string
  isComplete: boolean
  documentChoiceRequired: boolean
  readyForFinalAssessment: boolean
  phase: 'interim' | 'final'
  fallakteFindings?: FallakteFindingsPayload
}

export function normalizeDocumentsFields(payload: {
  documentsStatus?: DocumentsStatus | string
  documentsComment?: string
  requestedDocuments?: string
  needsMoreDocuments?: boolean
}): {
  documentsStatus: DocumentsStatus
  documentsComment: string
  requestedDocuments: string
  needsMoreDocuments: boolean
} {
  let status = normalizeDocumentsStatus(payload.documentsStatus)

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
    .slice(0, 4)
    .map((step, index) => {
      const normalized: StructuredStep = {
        id: step.id?.trim() || `schritt_${index + 1}`,
        text: step.text.trim(),
      }
      const deadline = normalizePrimaryDeadline(step.deadline)
      if (deadline) normalized.deadline = deadline
      const priority = normalizeStepPriority(step.priority)
      if (priority) normalized.priority = priority
      return normalized
    })
}

export function normalizeAnalyzePhase(
  value: unknown,
  fallback: 'interim' | 'final' = 'interim',
): 'interim' | 'final' {
  return normalizeReviewPhase(value) ?? fallback
}

export { normalizeDecisionFields }

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

export const CLARIFY_STEP_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    id: { type: 'string' as const },
    text: { type: 'string' as const },
    deadline: {
      ...SCHEMA_OPTIONAL_STRING,
      description: 'Frist als ISO-Datum oder null',
    },
    priority: {
      ...SCHEMA_OPTIONAL_PRIORITY,
      description: 'Priorität oder null',
    },
  },
  required: ['id', 'text', 'deadline', 'priority'],
}

export const CLARIFY_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    answer: { type: 'string' as const },
    contextSummary: { type: 'string' as const },
    updatedSummary: { type: 'string' as const },
    updatedAssessment: { type: 'string' as const },
    updatedNextSteps: { type: 'string' as const },
    updatedStructuredSteps: {
      type: 'array' as const,
      items: CLARIFY_STEP_SCHEMA,
    },
    updatedDocumentKind: DECISION_OUTPUT_PROPERTIES.documentKind,
    updatedPrimaryDeadline: DECISION_OUTPUT_PROPERTIES.primaryDeadline,
    updatedPrimaryDeadlineLabel: DECISION_OUTPUT_PROPERTIES.primaryDeadlineLabel,
    updatedKeyClaims: DECISION_OUTPUT_PROPERTIES.keyClaims,
    updatedContestablePoints: DECISION_OUTPUT_PROPERTIES.contestablePoints,
  },
  required: [
    'answer',
    'contextSummary',
    'updatedSummary',
    'updatedAssessment',
    'updatedNextSteps',
    'updatedStructuredSteps',
    'updatedDocumentKind',
    'updatedPrimaryDeadline',
    'updatedPrimaryDeadlineLabel',
    'updatedKeyClaims',
    'updatedContestablePoints',
  ],
}

export type ClarifyPayload = {
  answer: string
  contextSummary: string
  updatedSummary: string
  updatedAssessment: string
  updatedNextSteps: string
  updatedStructuredSteps: StructuredStep[]
  updatedDocumentKind?: string
  updatedPrimaryDeadline?: string
  updatedPrimaryDeadlineLabel?: string
  updatedKeyClaims?: { id: string; text: string }[]
  updatedContestablePoints?: { id: string; claim: string; why: string; suggestedAction: string }[]
}

export const DOCUMENT_PEEK_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    quickGuess: {
      type: 'string' as const,
      description: '1–2 Sätze: Absender, Dokumentart, Kernthema — nur aus diesem einen Dokument',
    },
    suggestedQuestion: {
      type: 'string' as const,
      description:
        'Eine starke Leitfrage für die spätere Vollauswertung, zugeschnitten auf dieses Dokument (wie eine gute ChatGPT-Nachfrage)',
    },
    focusHints: {
      type: 'array' as const,
      items: { type: 'string' as const },
      description: '2–4 kurze Hinweise, worauf bei Folgeseiten/der Vollprüfung achten',
    },
  },
  required: ['quickGuess', 'suggestedQuestion', 'focusHints'],
}

export type DocumentPeekPayload = {
  quickGuess: string
  suggestedQuestion: string
  focusHints: string[]
}

