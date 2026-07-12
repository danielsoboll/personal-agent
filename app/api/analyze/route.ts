import { NextResponse } from 'next/server'

import { CASE_FILE_JSONL_EXAMPLE, normalizeCaseFileJsonl, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import type { AnalyzeRequestBody, AnalyzeResponseBody } from '@/lib/analyzeTypes'

export const maxDuration = 60

const SYSTEM_PROMPT = `Du bist Behördenpost, ein deutschsprachiger Assistent für Briefe, Anträge und E-Mails.

Deine Aufgabe:
1. Dokumentfotos verstehen und in eine fortlaufende interne JSONL-Fallakte überführen.
2. Dem Nutzer eine kurze, persönliche Bewertung geben (ohne die JSONL zu zeigen).
3. Konkret sagen, welche weiteren Unterlagen noch fehlen — falls nötig.

Regeln für caseFileContent (interne JSONL-Fallakte):
- Format: JSON Lines — jede Zeile genau ein gültiges JSON-Objekt, UTF-8, kein Markdown, kein Array, kein umschließendes JSON.
- Pflichtfeld pro Zeile: "typ"
- Erlaubte typ-Werte: meta, kontext, dokument, person, frist, offen, aktion
- Mindestens eine Zeile mit typ "meta" (Felder: name, fall, aktualisiert als ISO-Datum YYYY-MM-DD, optional version)
- typ "dokument": datum (optional), titel (optional), zusammenfassung, quelle (z. B. scan_r2_foto1), runde (initial|followup)
- typ "kontext": text — komprimierter Gesamtkontext
- typ "person": name, rolle (optional) — beteiligte Personen/Stellen
- typ "frist": datum (optional), beschreibung, quelle (optional)
- typ "offen": frage, prioritaet (optional: hoch|mittel|niedrig)
- typ "aktion": text, status (optional: offen|erledigt)
- Bei Ergänzungen: bestehende Zeilen unverändert lassen, nur neue Zeilen anhängen oder meta/kontext gezielt aktualisieren (meta.aktualisiert immer setzen).
- Nichts erfinden. Unklares in offen-Zeilen festhalten.
- Duplikate vermeiden.

Beispiel:
${CASE_FILE_JSONL_EXAMPLE}

Regeln für assessment (Nutzer-Ansicht):
- Direkte Anrede mit Vornamen.
- 2–5 Sätze, verständlich, ohne Behördenjargon wo möglich.
- Sage klar, was das Schreiben offenbar verlangt.
- Keine technischen Begriffe wie JSONL, Fallakte oder Dateiformat.

Regeln für nextSteps:
- Konkrete Handlungsschritte für den Nutzer.
- Wenn needsMoreDocuments true: genau beschreiben, welche Fotos als Nächstes helfen würden.

Regeln für requestedDocuments:
- Nur relevant wenn needsMoreDocuments true, sonst leerer String.
- Beispiel: "E-Mails und Schriftstücke zur Unterhaltszahlung, neueste zuerst."

isComplete nur true, wenn aus der JSONL-Fallakte eine belastbare Gesamtbewertung der aktuellen Post möglich ist.`

function buildUserPrompt(body: AnalyzeRequestBody): string {
  if (body.round === 'followup' && body.existingCaseFile) {
    const legacyNote =
      validateCaseFileJsonl(body.existingCaseFile) !== null
        ? '\nHinweis: Der bestehende Inhalt ist noch kein gültiges JSONL. Wandle ihn zuerst in JSONL um (Informationen behalten), dann ergänze die neuen Fotos.\n'
        : ''

    return `Nutzer: ${body.userName}
Fallname: ${body.caseTitle}
Runde: followup mit ${body.images.length} neuen Fotos.
${legacyNote}
Bestehende JSONL-Fallakte (Zeilen beibehalten und erweitern):
${body.existingCaseFile}

Ergänze die Fallakte, setze meta.fall auf "${body.caseTitle}", aktualisiere meta.aktualisiert, bewerte für den Nutzer und sage ob noch Unterlagen fehlen.`
  }

  return `Nutzer: ${body.userName}
Fallname: ${body.caseTitle}
Runde: initial mit ${body.images.length} Fotos.

Lege eine neue JSONL-Fallakte an (meta.fall = "${body.caseTitle}"), bewerte für den Nutzer und sage welche weiteren Unterlagen helfen würden.`
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

  if (!body.userName?.trim() || !body.caseTitle?.trim() || !Array.isArray(body.images) || body.images.length === 0) {
    return NextResponse.json({ error: 'Name, Fallname und mindestens ein Foto sind erforderlich.' }, { status: 400 })
  }

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'

  const imageParts = body.images.map((dataUrl) => ({
    type: 'image_url' as const,
    image_url: { url: dataUrl, detail: 'high' as const },
  }))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'behoerdenpost_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              caseFileContent: {
                type: 'string',
                description: 'Interne JSONL-Fallakte, eine JSON-Zeile pro Eintrag',
              },
              assessment: { type: 'string' },
              nextSteps: { type: 'string' },
              needsMoreDocuments: { type: 'boolean' },
              requestedDocuments: { type: 'string' },
              isComplete: { type: 'boolean' },
            },
            required: [
              'caseFileContent',
              'assessment',
              'nextSteps',
              'needsMoreDocuments',
              'requestedDocuments',
              'isComplete',
            ],
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [{ type: 'text', text: buildUserPrompt(body) }, ...imageParts],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI analyze failed:', response.status, errorText)
    return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen. Bitte später erneut versuchen.' }, { status: 502 })
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = completion.choices?.[0]?.message?.content
  if (!content) {
    return NextResponse.json({ error: 'Leere KI-Antwort erhalten.' }, { status: 502 })
  }

  let parsed: AnalyzeResponseBody['result']
  try {
    parsed = JSON.parse(content) as AnalyzeResponseBody['result']
  } catch {
    return NextResponse.json({ error: 'KI-Antwort konnte nicht gelesen werden.' }, { status: 502 })
  }

  const normalizedCaseFile = normalizeCaseFileJsonl(parsed.caseFileContent)
  const validationError = validateCaseFileJsonl(normalizedCaseFile)
  if (validationError) {
    console.error('Invalid JSONL from model:', validationError)
    return NextResponse.json(
      { error: 'KI-Antwort war intern unvollständig. Bitte erneut prüfen.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    result: {
      ...parsed,
      caseFileContent: normalizedCaseFile,
    },
  } satisfies AnalyzeResponseBody)
}
