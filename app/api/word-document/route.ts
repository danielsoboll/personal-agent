import { NextResponse } from 'next/server'

import type { PreparedDocumentContent } from '@/lib/analyzeSchema'
import type { WordDocumentRequestBody, WordDocumentResponseBody } from '@/lib/analyzeTypes'
import { buildWordDocx, isPreparedDocumentContent, sanitizeWordFileName } from '@/lib/wordDocument'

export const maxDuration = 30

export async function POST(request: Request) {
  let body: WordDocumentRequestBody
  try {
    body = (await request.json()) as WordDocumentRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!body.userName?.trim()) {
    return NextResponse.json({ error: 'Name ist erforderlich.' }, { status: 400 })
  }

  if (!isPreparedDocumentContent(body.content)) {
    return NextResponse.json({ error: 'Schreiben-Inhalt fehlt oder ist unvollständig.' }, { status: 400 })
  }

  const docxBuffer = await buildWordDocx(body.content, body.userName.trim())
  const fileName = `${sanitizeWordFileName(body.content.title)}.docx`

  return NextResponse.json({
    fileName,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    contentBase64: docxBuffer.toString('base64'),
    title: body.content.title.trim(),
    previewText: body.content.previewText.trim(),
  } satisfies WordDocumentResponseBody)
}
