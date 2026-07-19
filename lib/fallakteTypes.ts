/** Typen und Labels für die nutzerorientierte Fallakte (IndexedDB). */

export const FALLAKTE_EVENT_TYPES = [
  'document_received',
  'document_sent',
  'application_submitted',
  'documents_requested',
  'documents_submitted',
  'inquiry_received',
  'inquiry_answered',
  'deadline_set',
  'appointment_scheduled',
  'phone_call',
  'lawyer_hired',
  'counseling_contacted',
  'payment_demanded',
  'payment_made',
  'decision_issued',
  'application_approved',
  'application_partially_approved',
  'application_rejected',
  'objection_filed',
  'decision_received',
  'reminder_created',
  'follow_up_expected',
  'user_entry',
  'other',
] as const

export type FallakteEventType = (typeof FALLAKTE_EVENT_TYPES)[number]

export const FALLAKTE_EVENT_TYPE_LABELS: Record<FallakteEventType, string> = {
  document_received: 'Dokument erhalten',
  document_sent: 'Dokument versendet',
  application_submitted: 'Antrag gestellt',
  documents_requested: 'Unterlagen angefordert',
  documents_submitted: 'Unterlagen eingereicht',
  inquiry_received: 'Rückfrage erhalten',
  inquiry_answered: 'Rückfrage beantwortet',
  deadline_set: 'Frist gesetzt',
  appointment_scheduled: 'Termin vereinbart',
  phone_call: 'Telefonat geführt',
  lawyer_hired: 'Anwalt beauftragt',
  counseling_contacted: 'Beratungsstelle kontaktiert',
  payment_demanded: 'Zahlung gefordert',
  payment_made: 'Zahlung geleistet',
  decision_issued: 'Bescheid erlassen',
  application_approved: 'Antrag bewilligt',
  application_partially_approved: 'Antrag teilweise bewilligt',
  application_rejected: 'Antrag abgelehnt',
  objection_filed: 'Widerspruch eingelegt',
  decision_received: 'Entscheidung erhalten',
  reminder_created: 'Erinnerung erstellt',
  follow_up_expected: 'Erwartete Folgeprüfung',
  user_entry: 'Eigener Nutzereintrag',
  other: 'Sonstiges',
}

/** Herkunft der Information — vor Nutzerbestätigung. */
export const FALLAKTE_SOURCE_TYPES = [
  'explicit_document_fact',
  'derived',
  'app_inferred',
  'user_provided',
] as const

export type FallakteSourceType = (typeof FALLAKTE_SOURCE_TYPES)[number]

export const FALLAKTE_SOURCE_TYPE_LABELS: Record<FallakteSourceType, string> = {
  explicit_document_fact: 'Im Dokument ausdrücklich genannt',
  derived: 'Aus Dokumenten abgeleitet',
  app_inferred: 'Von der App vermutet',
  user_provided: 'Vom Nutzer angegeben',
}

export type FallakteConfirmationStatus =
  | 'pending'
  | 'confirmed'
  | 'corrected'
  | 'rejected'
  | 'deferred'

export const FALLAKTE_CONFIRMATION_LABELS: Record<FallakteConfirmationStatus, string> = {
  pending: 'Noch nicht bestätigt',
  confirmed: 'Vom Nutzer bestätigt',
  corrected: 'Vom Nutzer korrigiert',
  rejected: 'Falsch erkannt',
  deferred: 'Später prüfen',
}

export type FallakteDatePrecision = 'day' | 'month' | 'year' | 'unknown'

export type FallakteDocumentRef = {
  fileName: string
  kind: 'image' | 'pdf' | 'unknown'
  uploadedAt: number
  documentDate?: string
}

/** Editierbare Felder eines Events (nach Korrektur). */
export type FallakteEventEditable = {
  eventType: FallakteEventType
  eventDate: string | null
  datePrecision: FallakteDatePrecision
  eventDateLabel: string | null
  title: string
  description: string
  relatedDeadline: string | null
}

export type FallakteEvent = {
  id: string
  caseId: string
  documentRef: FallakteDocumentRef | null
  eventType: FallakteEventType
  /** Nur YYYY-MM-DD wenn datePrecision === 'day'; sonst null. */
  eventDate: string | null
  datePrecision: FallakteDatePrecision
  /** Anzeige bei unsicherem Datum, z. B. „März 2026“. */
  eventDateLabel: string | null
  title: string
  description: string
  sourceType: FallakteSourceType
  sourcePage: number | null
  sourceExcerpt: string | null
  confidence: number | null
  relatedDeadline: string | null
  confirmationStatus: FallakteConfirmationStatus
  confirmedAt: number | null
  originalAiData: Record<string, unknown> | null
  correctedData: FallakteEventEditable | null
  rejectionReason: string | null
  analysisBatchId: string | null
  createdAt: number
  updatedAt: number
}

/** Rohes KI-Finding nach serverseitiger Validierung. */
export type FallakteAiFinding = {
  eventType: FallakteEventType
  eventDate: string | null
  datePrecision: FallakteDatePrecision
  eventDateLabel: string | null
  title: string
  description: string
  sourceType: FallakteSourceType
  sourcePage: number | null
  sourceExcerpt: string | null
  confidence: number
  relatedDeadline: string | null
  requiresUserConfirmation: boolean
}

export type FallakteFindingsPayload = {
  events: FallakteAiFinding[]
}
