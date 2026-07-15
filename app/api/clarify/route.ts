import { NextResponse } from 'next/server'

import { CLARIFY_SCHEMA, type ClarifyPayload } from '@/lib/analyzeSchema'
import { CLARIFY_SYSTEM_PROMPT, buildClarifyUserPrompt } from '@/lib/analyzePrompts'
import type { ClarifyRequestBody, ClarifyResponseBody } from '@/lib/analyzeTypes'
import { validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { resolveOpenAiModel } from '@/lib/openaiModel'

export const maxDuration = 60

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

  const question = body.question?.trim()
  if (!body.userName?.trim() || !body.caseTitle?.trim() || !body.caseFileContent?.trim() || !question) {
    return NextResponse.json(
      { error: 'Name, Fallname, Fallakte und Nachfrage sind erforderlich.' },
      { status: 400 },
    )
  }

  if (question.length > 2000) {
    return NextResponse.json({ error: 'Die Nachfrage ist zu lang (max. 2000 Zeichen).' }, { status: 400 })
  }

  const validationError = validateCaseFileJsonl(body.caseFileContent)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const model = resolveOpenAiModel()
  const userText = buildClarifyUserPrompt({
    userName: body.userName,
    caseTitle: body.caseTitle,
    caseNumber: body.caseNumber,
    caseFileContent: body.caseFileContent,
    question,
    currentReview: body.currentReview,
    priorMessages: body.priorMessages?.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  })

  const completion = await callOpenAiChatCompletion({
    apiKey,
    model,
    temperature: 0.35,
    maxTokens: 2048,
    jsonSchema: {
      name: 'behoerdenpost_clarify',
      schema: CLARIFY_SCHEMA,
    },
    messages: [
      { role: 'system', content: CLARIFY_SYSTEM_PROMPT },
      { role: 'user', content: userText },
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
  if (!answer) {
    return NextResponse.json({ error: 'KI-Antwort war leer.' }, { status: 502 })
  }

  return NextResponse.json({
    answer,
    correctionNote: parsed.correctionNote?.trim() ?? '',
  } satisfies ClarifyResponseBody)
}
