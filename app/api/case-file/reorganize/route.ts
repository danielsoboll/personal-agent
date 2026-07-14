import { NextResponse } from 'next/server'

import type { CaseFileReorganizeOperation } from '@/lib/caseFileReorganizeOps'
import { runCaseFileReorganize } from '@/lib/caseFileReorganizeServer'
import { validateCaseFileJsonl } from '@/lib/caseFileJsonl'

export const maxDuration = 60

type ReorganizeRequestBody = {
  operation?: CaseFileReorganizeOperation
  userName?: string
  caseTitle?: string
  caseFileContent?: string
  review?: {
    summary?: string
    assessment?: string
    nextSteps?: string
    phase?: string
  } | null
}

const VALID_OPERATIONS = new Set<CaseFileReorganizeOperation>([
  'extend_historie',
  'refresh_aktuell',
  'rotate_aktuell',
  'consolidate_historie',
])

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY ist nicht konfiguriert.' }, { status: 503 })
  }

  let body: ReorganizeRequestBody
  try {
    body = (await request.json()) as ReorganizeRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const operation = body.operation
  if (!operation || !VALID_OPERATIONS.has(operation)) {
    return NextResponse.json({ error: 'Ungültige Operation.' }, { status: 400 })
  }

  if (!body.userName?.trim() || !body.caseTitle?.trim() || !body.caseFileContent?.trim()) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 })
  }

  const validationError = validateCaseFileJsonl(body.caseFileContent)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const result = await runCaseFileReorganize({
    apiKey,
    operation,
    userName: body.userName.trim(),
    caseTitle: body.caseTitle.trim(),
    caseFileContent: body.caseFileContent,
    review: body.review ?? null,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ caseFileContent: result.caseFileContent })
}
