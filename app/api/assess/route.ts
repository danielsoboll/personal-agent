import { NextResponse } from 'next/server'

import {
  ANALYZE_RESULT_SCHEMA,
  normalizeDocumentsFields,
  normalizeStructuredSteps,
  type ParsedAnalyzePayload,
} from '@/lib/analyzeSchema'
import { ASSESS_SYSTEM_PROMPT, buildAssessUserPrompt } from '@/lib/analyzePrompts'
import { prepareCaseFileContent, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { resolveOpenAiModel } from '@/lib/openaiModel'
import type { AssessRequestBody, AssessResponseBody } from '@/lib/analyzeTypes'

export const maxDuration = 60

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY ist nicht konfiguriert.' },
      { status: 503 },
    )
  }

  let body: AssessRequestBody
  try {
    body = (await request.json()) as AssessRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!body.userName?.trim() || !body.caseTitle?.trim() || !body.caseFileContent?.trim()) {
    return NextResponse.json({ error: 'Name, Fallname und Fallakte sind erforderlich.' }, { status: 400 })
  }

  const validationError = validateCaseFileJsonl(body.caseFileContent)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const model = resolveOpenAiModel()
  const userText = buildAssessUserPrompt(body)

  const completion = await callOpenAiChatCompletion({
    apiKey,
    model,
    temperature: 0.35,
    maxTokens: 4096,
    jsonSchema: {
      name: 'behoerdenpost_assessment',
      schema: ANALYZE_RESULT_SCHEMA,
    },
    messages: [
      { role: 'system', content: ASSESS_SYSTEM_PROMPT },
      { role: 'user', content: userText },
    ],
  })

  if (!completion.ok) {
    console.error('OpenAI assess failed:', completion.error)
    return NextResponse.json({ error: 'Bewertung fehlgeschlagen. Bitte später erneut versuchen.' }, { status: 502 })
  }

  const content = completion.content

  let parsed: ParsedAnalyzePayload
  try {
    parsed = JSON.parse(content) as ParsedAnalyzePayload
  } catch {
    return NextResponse.json({ error: 'KI-Antwort konnte nicht gelesen werden.' }, { status: 502 })
  }

  const prepared = prepareCaseFileContent(parsed.caseFileContent)
  const caseFileError = validateCaseFileJsonl(prepared.content)
  if (caseFileError) {
    console.error('Invalid JSONL from assess:', caseFileError, prepared.report)
    return NextResponse.json(
      { error: 'KI-Antwort war intern unvollständig. Bitte erneut versuchen.' },
      { status: 502 },
    )
  }

  const documents = normalizeDocumentsFields({
    ...parsed,
    documentsStatus: parsed.documentsStatus ?? 'not_needed',
  })

  return NextResponse.json({
    result: {
      caseFileContent: prepared.content,
      summary: parsed.summary?.trim() || '',
      assessment: parsed.assessment,
      nextSteps: parsed.nextSteps,
      structuredSteps: normalizeStructuredSteps(parsed.structuredSteps ?? []),
      ...documents,
      isComplete: true,
      phase: 'final' as const,
    },
  } satisfies AssessResponseBody)
}
