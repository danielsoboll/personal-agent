import { NextResponse } from 'next/server'

import {
  ANALYZE_RESULT_SCHEMA,
  normalizeDocumentsFields,
  normalizeStructuredSteps,
  type ParsedAnalyzePayload,
} from '@/lib/analyzeSchema'
import { buildAnalyzeUserPrompt, ANALYZE_SYSTEM_PROMPT, buildJsonlRetryHint } from '@/lib/analyzePrompts'
import { prepareCaseFileContent, validateCaseFileJsonl, createAktuellSectionCaseFile, mergeAktuellSectionCaseFile, hasHistorieRecords } from '@/lib/caseFileJsonl'
import { shouldRotateBeforeInitialScan } from '@/lib/caseFileReorganizeOps'
import { runCaseFileReorganize } from '@/lib/caseFileReorganizeServer'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { resolveOpenAiModel } from '@/lib/openaiModel'
import type { AnalyzeRequestBody, AnalyzeResponseBody } from '@/lib/analyzeTypes'

export const maxDuration = 60

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
      summary: parsed.summary?.trim() || '',
      ...documents,
    },
  }
}

async function runAnalyzeAttempt(options: {
  apiKey: string
  model: string
  userText: string
  images: string[]
  temperature?: number
}): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  const imageParts = options.images.map((dataUrl) => ({
    type: 'image_url' as const,
    image_url: { url: dataUrl, detail: 'high' as const },
  }))

  const result = await callOpenAiChatCompletion({
    apiKey: options.apiKey,
    model: options.model,
    temperature: options.temperature ?? 0.35,
    maxTokens: 4096,
    jsonSchema: {
      name: 'behoerdenpost_analysis',
      schema: ANALYZE_RESULT_SCHEMA,
    },
    messages: [
      { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          imageParts.length > 0
            ? [{ type: 'text', text: options.userText }, ...imageParts]
            : options.userText,
      },
    ],
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  return { ok: true, content: result.content }
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

  const model = resolveOpenAiModel()
  const userText = buildAnalyzeUserPrompt({
    userName: body.userName,
    caseTitle: body.caseTitle,
    caseNumber: body.caseNumber,
    imageCount: body.images.length,
    intent: body.intent,
    existingCaseFile: body.existingCaseFile,
  })

  const temperature = body.intent === 'initial' ? 0.5 : 0.35

  let attempt = await runAnalyzeAttempt({
    apiKey,
    model,
    userText,
    images: body.images,
    temperature,
  })

  if (!attempt.ok) {
    return NextResponse.json(
      { error: 'KI-Analyse fehlgeschlagen. Bitte später erneut versuchen.' },
      { status: 502 },
    )
  }

  let parsed = parseAndValidate(attempt.content)

  if (!parsed.ok) {
    const retryText = `${userText}${buildJsonlRetryHint(parsed.error, body.intent)}`

    attempt = await runAnalyzeAttempt({
      apiKey,
      model,
      userText: retryText,
      images: body.images,
      temperature,
    })

    if (!attempt.ok) {
      return NextResponse.json(
        { error: 'KI-Analyse fehlgeschlagen. Bitte später erneut versuchen.' },
        { status: 502 },
      )
    }

    parsed = parseAndValidate(attempt.content)
    if (!parsed.ok) {
      return NextResponse.json(
        { error: 'KI-Antwort war intern unvollständig. Bitte erneut prüfen.' },
        { status: 502 },
      )
    }
  }

  const result = parsed.result

  const aktuellInput = {
    name: body.userName,
    fall: body.caseTitle,
    anfrage: `${body.images.length} Foto${body.images.length === 1 ? '' : 's'} — erster Scan`,
    resultat: {
      summary: result.summary,
      assessment: result.assessment,
      nextSteps: result.nextSteps,
      phase: result.phase,
    },
  }

  let caseFileContent = result.caseFileContent

  if (body.intent === 'initial') {
    let historieBase = body.existingCaseFile?.trim() ?? null

    if (shouldRotateBeforeInitialScan({ intent: body.intent, existingCaseFile: historieBase })) {
      const rotated = await runCaseFileReorganize({
        apiKey,
        model,
        operation: 'rotate_aktuell',
        userName: body.userName,
        caseTitle: body.caseTitle,
        caseFileContent: historieBase!,
        review: null,
      })
      if (rotated.ok) historieBase = rotated.caseFileContent
    }

    caseFileContent =
      historieBase && hasHistorieRecords(historieBase)
        ? mergeAktuellSectionCaseFile(historieBase, aktuellInput)
        : createAktuellSectionCaseFile(aktuellInput)
  }

  return NextResponse.json({
    result: {
      caseFileContent,
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
