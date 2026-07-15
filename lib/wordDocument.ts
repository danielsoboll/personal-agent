import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

import type { PreparedDocumentContent } from '@/lib/analyzeSchema'

export function sanitizeWordFileName(title: string): string {
  return (
    title
      .replace(/[^\w\säöüÄÖÜß-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 60) || 'Schreiben'
  )
}

export async function buildWordDocx(content: PreparedDocumentContent, userName: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: content.subject,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [new TextRun({ text: '' })],
          }),
          ...content.bodyParagraphs.flatMap((paragraph) => [
            new Paragraph({
              children: [new TextRun({ text: paragraph })],
            }),
            new Paragraph({
              children: [new TextRun({ text: '' })],
            }),
          ]),
          new Paragraph({
            children: [new TextRun({ text: userName })],
          }),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

export function isPreparedDocumentContent(
  input: Partial<PreparedDocumentContent> | null | undefined,
): input is PreparedDocumentContent {
  if (!input) return false
  return (
    Boolean(input.title?.trim()) &&
    Boolean(input.subject?.trim()) &&
    Array.isArray(input.bodyParagraphs) &&
    input.bodyParagraphs.some((paragraph) => paragraph.trim().length > 0)
  )
}
