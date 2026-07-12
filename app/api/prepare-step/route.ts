import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { NextResponse } from 'next/server'

import { buildPrepareStepUserPrompt, PREPARE_STEP_SYSTEM_PROMPT } from '@/lib/analyzePrompts'
import { PREPARE_STEP_SCHEMA, type PreparedDocumentContent } from '@/lib/analyzeSchema'
import type { PrepareStepRequestBody, PrepareStepResponseBody } from '@/lib/analyzeTypes'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { resolveOpenAiModel } from '@/lib/openaiModel'

export const maxDuration = 60

function sanitizeFileName(title: string): string {
  return title
    .replace(/[^\w\säöüÄÖÜß-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'Schreiben'
}

async function buildDocx(content: PreparedDocumentContent, userName: string): Promise<Buffer> {
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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY ist nicht konfiguriert.' },
      { status: 503 },
    )
  }

  let body: PrepareStepRequestBody
  try {
    body = (await request.json()) as PrepareStepRequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!body.userName?.trim() || !body.caseTitle?.trim() || !body.caseFileContent?.trim() || !body.step?.text?.trim()) {
    return NextResponse.json({ error: 'Fallakte und Schritt sind erforderlich.' }, { status: 400 })
  }

  const model = resolveOpenAiModel()
  const userText = buildPrepareStepUserPrompt({
    userName: body.userName,
    caseTitle: body.caseTitle,
    caseFileContent: body.caseFileContent,
    stepText: body.step.text,
    stepDeadline: body.step.deadline,
  })

  const completion = await callOpenAiChatCompletion({
    apiKey,
    model,
    temperature: 0.2,
    jsonSchema: {
      name: 'behoerdenpost_prepare_step',
      schema: PREPARE_STEP_SCHEMA,
    },
    messages: [
      { role: 'system', content: PREPARE_STEP_SYSTEM_PROMPT },
      { role: 'user', content: userText },
    ],
  })

  if (!completion.ok) {
    console.error('OpenAI prepare-step failed:', completion.error)
    return NextResponse.json({ error: 'Schritt konnte nicht vorbereitet werden.' }, { status: 502 })
  }

  const content = completion.content

  let prepared: PreparedDocumentContent
  try {
    prepared = JSON.parse(content) as PreparedDocumentContent
  } catch {
    return NextResponse.json({ error: 'KI-Antwort konnte nicht gelesen werden.' }, { status: 502 })
  }

  const docxBuffer = await buildDocx(prepared, body.userName.trim())
  const fileName = `${sanitizeFileName(prepared.title)}.docx`

  return NextResponse.json({
    fileName,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    contentBase64: docxBuffer.toString('base64'),
    title: prepared.title,
    previewText: prepared.previewText,
  } satisfies PrepareStepResponseBody)
}
