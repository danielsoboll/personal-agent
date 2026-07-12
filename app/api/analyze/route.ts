import { NextResponse } from 'next/server'

import {
  ANALYZE_RESULT_SCHEMA,
  normalizeDocumentsFields,
  normalizeStructuredSteps,
  type ParsedAnalyzePayload,
} from '@/lib/analyzeSchema'
import { buildAnalyzeUserPrompt, ANALYZE_SYSTEM_PROMPT, buildJsonlRetryHint } from '@/lib/analyzePrompts'
import { prepareCaseFileContent, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import type { AnalyzeRequestBody, AnalyzeResponseBody } from '@/lib/analyzeTypes'

export const maxDuration = 60

async function callOpenAiAnalyze(options: {
  apiKey: string
  model: string
  systemPrompt: string
  userText: string
  images: string[]
}): Promise<string | null> {
  const imageParts = options.images.map((dataUrl) => ({
    type: 'image_url' as const,
    image_url: { url: dataUrl, detail: 'high' as const },
  }))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.15,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'behoerdenpost_analysis',
          strict: true,
          schema: ANALYZE_RESULT_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: options.systemPrompt },
        {
          role: 'user',
          content:
            imageParts.length > 0
              ? [{ type: 'text', text: options.userText }, ...imageParts]
              : options.userText,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI analyze failed:', response.status, errorText)
    return null
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return completion.choices?.[0]?.message?.content ?? null
}

function parseAndValidate(content: string): { ok: true; result: ParsedAnalyzePayload } | { ok: false; error: string } {
  let parsed: ParsedAnalyzePayload
  try {
    parsed = JSON.parse(content) as ParsedAnalyzePayload
  } catch {
    return { ok: false, error: 'KI-Antwort konnte nicht gelesen werden.' }
  }

  const prepared = prepareCaseFileContent(parsed.caseFileContent)
  const validationError = validateCaseFileJsonl(prepared.content)
  if (validationError) {
    console.error('Invalid JSONL from model:', validationError, prepared.report)
    return { ok: false, error: validationError }
  }

  if (prepared.report.removedDuplicates > 0 || prepared.report.warnings.length > 0) {
    console.info('JSONL tidied:', prepared.report)
  }

  const documents = normalizeDocumentsFields(parsed)

  return {
    ok: true,
    result: {
      ...parsed,
      caseFileContent: prepared.content,
      structuredSteps: normalizeStructuredSteps(parsed.structuredSteps ?? []),
      summary: parsed.summary?.trim() || parsed.assessment?.slice(0, 200) || '',
      ...documents,
    },
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY ist nicht konfiguriert.' },
      { status: 503 },
    )
  }

  let body: AnalyzeRequestBody
  try {
    body = (await request.json()) as AnalyzeRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!body.userName?.trim() || !body.caseTitle?.trim()) {
    return NextResponse.json({ error: 'Name und Fallname sind erforderlich.' }, { status: 400 })
  }

  if (!Array.isArray(body.images) || body.images.length === 0) {
    return NextResponse.json({ error: 'Mindestens ein Foto ist erforderlich.' }, { status: 400 })
  }

  if (body.intent !== 'initial' && !body.existingCaseFile?.trim()) {
    return NextResponse.json({ error: 'Bestehende Fallakte fehlt für diese Ergänzung.' }, { status: 400 })
  }

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const userText = buildAnalyzeUserPrompt({
    userName: body.userName,
    caseTitle: body.caseTitle,
    imageCount: body.images.length,
    intent: body.intent,
    existingCaseFile: body.existingCaseFile,
  })

  let content = await callOpenAiAnalyze({
    apiKey,
    model,
    systemPrompt: ANALYZE_SYSTEM_PROMPT,
    userText,
    images: body.images,
  })

  if (!content) {
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen. Bitte später erneut versuchen.' }, { status: 502 })
  }

  let parsed = parseAndValidate(content)

  if (!parsed.ok) {
    const retryText = `${userText}${buildJsonlRetryHint(parsed.error)}`

    content = await callOpenAiAnalyze({
      apiKey,
      model,
      systemPrompt: ANALYZE_SYSTEM_PROMPT,
      userText: retryText,
      images: body.images,
    })

    if (!content) {
      return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen. Bitte später erneut versuchen.' }, { status: 502 })
    }

    parsed = parseAndValidate(content)
    if (!parsed.ok) {
      return NextResponse.json(
        { error: 'KI-Antwort war intern unvollständig. Bitte erneut prüfen.' },
        { status: 502 },
      )
    }
  }

  const result = parsed.result

  return NextResponse.json({
    result: {
      caseFileContent: result.caseFileContent,
      summary: result.summary,
      assessment: result.assessment,
      nextSteps: result.nextSteps,
      structuredSteps: result.structuredSteps,
      needsMoreDocuments: result.needsMoreDocuments,
      requestedDocuments: result.requestedDocuments,
      documentsStatus: result.documentsStatus,
      documentsComment: result.documentsComment,
      isComplete: result.isComplete,
      documentChoiceRequired: body.intent === 'initial' ? true : result.documentChoiceRequired,
      readyForFinalAssessment: result.readyForFinalAssessment,
      phase: result.phase,
    },
  } satisfies AnalyzeResponseBody)
}
