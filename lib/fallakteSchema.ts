import { SCHEMA_OPTIONAL_STRING } from '@/lib/decisionFields'

const SCHEMA_OPTIONAL_NUMBER = {
  anyOf: [{ type: 'number' as const }, { type: 'null' as const }],
} as const

/** OpenAI structured output: Timeline-Findings für die Fallakte. */
export const FALLAKTE_FINDINGS_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    events: {
      type: 'array' as const,
      description:
        '0–8 chronologische Ereignisse aus DIESEM Upload. Nur dokumentierte/organisatorische Fakten — keine Rechtsbewertung.',
      items: {
        type: 'object' as const,
        additionalProperties: false,
        properties: {
          eventType: {
            type: 'string' as const,
            description:
              'z. B. documents_requested, application_submitted, deadline_set, decision_issued, document_received, other',
          },
          eventDate: {
            ...SCHEMA_OPTIONAL_STRING,
            description: 'Nur bei datePrecision=day: YYYY-MM-DD, sonst null',
          },
          datePrecision: {
            type: 'string' as const,
            description: 'day | month | year | unknown',
          },
          eventDateLabel: {
            ...SCHEMA_OPTIONAL_STRING,
            description: 'Bei month/year: z. B. „März 2026“; sonst null',
          },
          title: { type: 'string' as const, description: 'Kurze Überschrift' },
          description: { type: 'string' as const, description: '1–3 Sätze, sachlich' },
          sourceType: {
            type: 'string' as const,
            description: 'explicit_document_fact | derived | app_inferred',
          },
          sourcePage: {
            ...SCHEMA_OPTIONAL_NUMBER,
            description: 'Seitenzahl ab 1 oder null',
          },
          sourceExcerpt: {
            ...SCHEMA_OPTIONAL_STRING,
            description: 'Kurzer Textausschnitt oder null',
          },
          confidence: {
            type: 'number' as const,
            description: '0–1',
          },
          relatedDeadline: {
            ...SCHEMA_OPTIONAL_STRING,
            description: 'Zugehörige Frist YYYY-MM-DD oder null',
          },
          requiresUserConfirmation: { type: 'boolean' as const },
        },
        required: [
          'eventType',
          'eventDate',
          'datePrecision',
          'eventDateLabel',
          'title',
          'description',
          'sourceType',
          'sourcePage',
          'sourceExcerpt',
          'confidence',
          'relatedDeadline',
          'requiresUserConfirmation',
        ],
      },
    },
  },
  required: ['events'],
} as const
