import type { AnalyzeAttachment } from '@/lib/analyzeTypes'
import type { UserContentPart } from '@/lib/openaiChat'

export function buildOpenAiAttachmentParts(attachments: AnalyzeAttachment[]): UserContentPart[] {
  return attachments.map((attachment) => {
    if (attachment.kind === 'pdf') {
      return {
        type: 'file',
        file: {
          filename: attachment.fileName || 'dokument.pdf',
          file_data: attachment.dataUrl,
        },
      }
    }

    return {
      type: 'image_url',
      image_url: { url: attachment.dataUrl, detail: 'high' },
    }
  })
}
