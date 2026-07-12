import { NextResponse } from 'next/server'

import {
  ANALYZE_RESULT_SCHEMA,
  normalizeDocumentsFields,
  normalizeStructuredSteps,
  type ParsedAnalyzePayload,
} from '@/lib/analyzeSchema'
import { ASSESS_SYSTEM_PROMPT, buildAssessUserPrompt } from '@/lib/analyzePrompts'
import { prepareCaseFileContent, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
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

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const userText = buildAssessUserPrompt(body)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'behoerdenpost_assessment',
          strict: true,
          schema: ANALYZE_RESULT_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: ASSESS_SYSTEM_PROMPT },
        { role: 'user', content: userText },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI assess failed:', response.status, errorText)
    return NextResponse.json({ error: 'Bewertung fehlgeschlagen. Bitte später erneut versuchen.' }, { status: 502 })
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = completion.choices?.[0]?.message?.content
  if (!content) {
    return NextResponse.json({ error: 'Leere KI-Antwort erhalten.' }, { status: 502 })
  }

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
