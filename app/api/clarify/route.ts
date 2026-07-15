import { NextResponse } from 'next/server'

import { CLARIFY_SCHEMA, normalizeStructuredSteps, type ClarifyPayload } from '@/lib/analyzeSchema'
import { CLARIFY_SYSTEM_PROMPT, buildClarifyUserPrompt } from '@/lib/analyzePrompts'
import { ATTACHMENTS_ONLY_QUESTION } from '@/lib/chatFollowUp'
import type { AnalyzeAttachment, ClarifyRequestBody, ClarifyResponseBody, FollowUpWordDocument } from '@/lib/analyzeTypes'
import { validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { buildOpenAiAttachmentParts } from '@/lib/openaiAttachments'
import { resolveOpenAiModel } from '@/lib/openaiModel'
import { isPreparedDocumentContent } from '@/lib/wordDocument'

export const maxDuration = 120

const MAX_CHAT_ATTACHMENTS = 5

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY ist nicht konfiguriert.' },
      { status: 503 },
    )
  }

  let body: ClarifyRequestBody
  try {
    body = (await request.json()) as ClarifyRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const userText = body.question?.trim() ?? ''
  const attachments = body.attachments ?? []

  if (!body.userName?.trim() || !body.caseTitle?.trim() || !body.caseFileContent?.trim()) {
    return NextResponse.json(
      { error: 'Name, Fallname und Fallakte sind erforderlich.' },
      { status: 400 },
    )
  }

  if (!userText && attachments.length === 0) {
    return NextResponse.json(
      { error: 'Bitte schreib eine Nachfrage oder füge mindestens einen Anhang hinzu.' },
      { status: 400 },
    )
  }

  if (userText.length > 2000) {
    return NextResponse.json({ error: 'Die Nachfrage ist zu lang (max. 2000 Zeichen).' }, { status: 400 })
  }

  if (attachments.length > MAX_CHAT_ATTACHMENTS) {
    return NextResponse.json(
      { error: `Maximal ${MAX_CHAT_ATTACHMENTS} Anhänge pro Nachfrage.` },
      { status: 400 },
    )
  }

  const validationError = validateCaseFileJsonl(body.caseFileContent)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const pdfCount = attachments.filter((attachment) => attachment.kind === 'pdf').length
  const effectiveQuestion = userText || ATTACHMENTS_ONLY_QUESTION

  const model = resolveOpenAiModel()
  const userTextPrompt = buildClarifyUserPrompt({
    userName: body.userName,
    caseTitle: body.caseTitle,
    caseNumber: body.caseNumber,
    caseFileContent: body.caseFileContent,
    question: effectiveQuestion,
    attachmentCount: attachments.length,
    pdfCount,
    currentReview: body.currentReview,
    priorMessages: body.priorMessages?.map((message) => ({
      role: message.role,
      userText: message.userText,
      content: message.content,
      attachments: message.attachments,
    })),
  })

  const attachmentParts = buildOpenAiAttachmentParts(attachments)

  const completion = await callOpenAiChatCompletion({
    apiKey,
    model,
    temperature: 0.35,
    maxTokens: 4096,
    jsonSchema: {
      name: 'behoerdenpost_clarify',
      schema: CLARIFY_SCHEMA,
    },
    messages: [
      { role: 'system', content: CLARIFY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [{ type: 'text', text: userTextPrompt }, ...attachmentParts],
      },
    ],
  })

  if (!completion.ok) {
    console.error('OpenAI clarify failed:', completion.error)
    return NextResponse.json(
      { error: 'Nachfrage konnte nicht beantwortet werden. Bitte später erneut versuchen.' },
      { status: 502 },
    )
  }

  let parsed: ClarifyPayload
  try {
    parsed = JSON.parse(completion.content) as ClarifyPayload
  } catch {
    return NextResponse.json({ error: 'KI-Antwort konnte nicht gelesen werden.' }, { status: 502 })
  }

  const answer = parsed.answer?.trim()
  const updatedAssessment = parsed.updatedAssessment?.trim()
  if (!answer && !updatedAssessment) {
    return NextResponse.json({ error: 'KI-Antwort war leer.' }, { status: 502 })
  }

  let wordDocument: FollowUpWordDocument | undefined
  if (parsed.wordDocumentRequested) {
    const candidate = {
      title: parsed.wordDocumentTitle?.trim() ?? '',
      subject: parsed.wordDocumentSubject?.trim() ?? '',
      bodyParagraphs: (parsed.wordDocumentBodyParagraphs ?? []).map((paragraph) => paragraph.trim()).filter(Boolean),
      previewText: parsed.wordDocumentPreviewText?.trim() ?? '',
    }
    if (isPreparedDocumentContent(candidate)) {
      wordDocument = candidate
    }
  }

  return NextResponse.json({
    answer: answer || 'Die Auswertung wurde anhand deiner Nachfrage aktualisiert.',
    contextSummary: parsed.contextSummary?.trim() || '',
    updatedSummary: parsed.updatedSummary?.trim() ?? '',
    updatedAssessment: updatedAssessment ?? '',
    updatedNextSteps: parsed.updatedNextSteps?.trim() ?? '',
    updatedStructuredSteps: normalizeStructuredSteps(parsed.updatedStructuredSteps ?? []),
    ...(wordDocument ? { wordDocument } : {}),
  } satisfies ClarifyResponseBody)
}
