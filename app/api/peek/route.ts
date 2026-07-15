import { NextResponse } from 'next/server'

import { DOCUMENT_PEEK_SCHEMA, type DocumentPeekPayload } from '@/lib/analyzeSchema'
import { DOCUMENT_PEEK_SYSTEM_PROMPT, buildDocumentPeekUserPrompt } from '@/lib/analyzePrompts'
import type { DocumentPeekRequestBody, DocumentPeekResponseBody } from '@/lib/analyzeTypes'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { buildOpenAiAttachmentParts } from '@/lib/openaiAttachments'
import { resolveOpenAiModel } from '@/lib/openaiModel'

export const maxDuration = 45

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY ist nicht konfiguriert.' },
      { status: 503 },
    )
  }

  let body: DocumentPeekRequestBody
  try {
    body = (await request.json()) as DocumentPeekRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!body.userName?.trim() || !body.caseTitle?.trim() || !body.attachment?.dataUrl) {
    return NextResponse.json({ error: 'Name, Fallname und Dokument sind erforderlich.' }, { status: 400 })
  }

  const model = resolveOpenAiModel()
  const userText = buildDocumentPeekUserPrompt({
    userName: body.userName,
    caseTitle: body.caseTitle,
    intent: body.intent,
  })
  const attachmentParts = buildOpenAiAttachmentParts([body.attachment])

  const completion = await callOpenAiChatCompletion({
    apiKey,
    model,
    temperature: 0.4,
    maxTokens: 800,
    jsonSchema: {
      name: 'behoerdenpost_document_peek',
      schema: DOCUMENT_PEEK_SCHEMA,
    },
    messages: [
      { role: 'system', content: DOCUMENT_PEEK_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [{ type: 'text', text: userText }, ...attachmentParts],
      },
    ],
  })

  if (!completion.ok) {
    console.error('OpenAI document peek failed:', completion.error)
    return NextResponse.json({ error: 'Kurzblick fehlgeschlagen.' }, { status: 502 })
  }

  let parsed: DocumentPeekPayload
  try {
    parsed = JSON.parse(completion.content) as DocumentPeekPayload
  } catch {
    return NextResponse.json({ error: 'KI-Antwort konnte nicht gelesen werden.' }, { status: 502 })
  }

  const quickGuess = parsed.quickGuess?.trim() ?? ''
  const suggestedQuestion = parsed.suggestedQuestion?.trim() ?? ''
  if (!quickGuess && !suggestedQuestion) {
    return NextResponse.json({ error: 'Kurzblick war leer.' }, { status: 502 })
  }

  return NextResponse.json({
    quickGuess,
    suggestedQuestion,
    focusHints: (parsed.focusHints ?? []).map((hint) => hint.trim()).filter(Boolean).slice(0, 4),
  } satisfies DocumentPeekResponseBody)
}
