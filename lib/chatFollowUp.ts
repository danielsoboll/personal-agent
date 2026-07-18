import type { FollowUpAttachmentMeta, FollowUpMessage } from '@/lib/analyzeTypes'

export const MAX_CHAT_ATTACHMENTS = 5

/** Wenn nur Anhänge, ohne Nutzertext — sinnvolle Standardfrage an OpenAI. */
export const ATTACHMENTS_ONLY_QUESTION =
  'Ich habe weitere Unterlagen angehängt. Bitte aktualisiere die Einordnung und nächsten Schritte anhand der neuen Unterlagen.'

export function buildAttachmentMetaSummary(attachments: FollowUpAttachmentMeta[]): string {
  if (attachments.length === 0) return ''

  const pdfs = attachments.filter((item) => item.kind === 'pdf').length
  const images = attachments.length - pdfs

  const parts: string[] = []
  if (images === 1) parts.push('1 Foto')
  else if (images > 1) parts.push(`${images} Fotos`)
  if (pdfs === 1) parts.push('1 Datei')
  else if (pdfs > 1) parts.push(`${pdfs} Dateien`)

  return parts.join(', ')
}

export function buildDefaultContextSummary(attachmentCount: number, pdfCount: number): string {
  const imageCount = attachmentCount - pdfCount
  const attachmentPart = buildAttachmentMetaSummary(
    [
      ...Array.from({ length: imageCount }, () => ({ fileName: 'Foto', kind: 'image' as const })),
      ...Array.from({ length: pdfCount }, () => ({ fileName: 'Datei', kind: 'pdf' as const })),
    ],
  )

  if (attachmentPart) {
    return `Fallakte + ${attachmentPart}`
  }

  return 'Fallakte + bisherige Auswertung'
}

export function getFollowUpUserText(message: FollowUpMessage): string {
  if (message.role !== 'user') return ''
  return message.userText?.trim() || (message.attachments?.length ? '' : message.content.trim())
}

export function normalizeFollowUpMessage(message: FollowUpMessage): FollowUpMessage {
  if (message.role === 'user') {
    return {
      ...message,
      userText: message.userText ?? (message.attachments?.length ? undefined : message.content),
      attachments: message.attachments ?? [],
    }
  }

  return message
}
