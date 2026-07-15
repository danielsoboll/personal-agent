/**
 * Zentrale Prompt-Registry für Behördenpost.
 *
 * Fallakte in 2 Bereichen:
 * 1. Aktuelle Anfrage & Resultat (block art=aktuell + anfrage + resultat)
 * 2. Historie (block art=historisch + dokument + kontext) — wächst langfristig
 *
 * Siehe auch: .cursor/rules/behoerdenpost-jsonl-prompts.mdc
 */
import {
  appendFormattedCaseContext,
  buildCasePromptContext,
} from '@/lib/caseFileContext'
import { CASE_FILE_JSONL_EXAMPLE, CASE_FILE_JSONL_MINIMAL_EXAMPLE } from '@/lib/caseFileJsonl'
import type { AnalyzeIntent } from '@/lib/analyzeTypes'

export const PROMPT_VERSION = '2026-07-14.4'

/** Wie eine direkte ChatGPT-Nachricht mit angehängten Fotos. */
export const CORE_USER_QUESTIONS = `Beantworte zuerst inhaltlich — so gut wie ChatGPT mit denselben Fotos:

1. **Was ist das?** — Absender, Art des Schreibens, worum es geht, wichtige Beträge und Fristen
2. **Was sollte ich jetzt tun?** — die unmittelbar nächste Handlung und die sinnvollen Folgeschritte`

export const READING_RULES = `So liest du die Fotos (WICHTIG):

- Lies JEDE Seite vollständig: Absender, Datum, Betreff, Beträge, Fristen, Aktenzeichen, Tabellen.
- Mehrere Fotos = meist EIN Schreiben oder zusammengehörige Post — alles zusammen verstehen, nicht getrennt bewerten.
- Zahlen und Daten exakt aus dem Text — nicht raten.
- Bei klaren Schreiben (Finanzamt, Jobcenter, Versicherung …) direkt und konkret antworten.
- Nichts erfinden. Unklares ehrlich sagen.`

export const JSONL_TWO_BEREICHE = `
Die JSONL-Fallakte hat **2 Bereiche** (dem Nutzer unsichtbar):

**Bereich 1 — Aktuelle Anfrage & Resultat** (block art=aktuell, id=blk_aktuell)
- anfrage: Was wurde eingereicht? (z. B. „3 Fotos Finanzamt-Bescheid“)
- resultat: KI-Einordnung — summary, assessment, next_steps, stand, phase
- Keine dokument/schritt/frist-Zeilen im aktuellen Bereich — das steckt in resultat + App-Feldern

**Bereich 2 — Historie** (block art=historisch, bereich=historie)
- Wächst mit Hintergrund-Scans (viele Seiten über Zeit)
- kontext mit bereich=historie: Gesamtbild der Historie (2–4 Sätze)
- dokument rolle=historisch: pro Seite/Foto eine Zeile mit ausführlicher zusammenfassung
- Hier entfaltet sich der langfristige Mehrwert der Fallakte`

export const JSONL_AKTUELL_RULES = `
Beim ERSTEN Scan (intent=initial) — nur Bereich 1:
- meta + block art=aktuell + anfrage + resultat
- resultat aus summary, assessment, nextSteps befüllen
- KEIN Historie-Bereich, keine dokument-Zeilen

Beispiel Bereich 1:
${CASE_FILE_JSONL_MINIMAL_EXAMPLE}`

export const JSONL_HISTORIE_RULES = `
Ab Ergänzungs-/Hintergrund-Runden — Bereich 2 Historie pflegen:
${JSONL_TWO_BEREICHE}

Beispiel mit Historie:
${CASE_FILE_JSONL_EXAMPLE}`

export const USER_OUTPUT_RULES = `
Ordne deine inhaltliche Antwort in die **3 Bereiche der App**:

**1. summary → „Zusammenfassung“** (Antwort auf: Was ist das?)
- 2–3 kurze Zeilen, max. ~280 Zeichen
- Absender, Dokumentart, Kern (Betrag/Frist wenn vorhanden)
- Keine Anrede, kein Copy-Paste aus assessment

**2. assessment → „Was das Schreiben bedeutet“** (ausführlicher als summary)
- Du-Form mit Vornamen
- 4–8 Sätze: Was will der Absender? Was heißt das für mich? Was passiert, wenn ich nicht reagiere?
- Konkrete Beträge, Daten und Fristen aus dem Brief

**3. structuredSteps + nextSteps → „Nächste Schritte“** (Antwort auf: Was sollte ich jetzt tun?)
- 2–6 konkrete Handlungen — erster Schritt = die JETZT wichtigste Aktion
- id: schritt_1, schritt_2 …
- text: klare Handlung
- deadline: YYYY-MM-DD nur wenn im Schreiben oder klar ableitbar; sonst weglassen
- priority: hoch|mittel|niedrig — hoch bei harten Fristen
- nextSteps: dieselben Schritte als nummerierte Liste (1. 2. 3.)

Dieselben Inhalte landen in resultat (summary, assessment, next_steps) für Bereich 1 der Fallakte.

**Unterlagen-Einschätzung** (kurz halten):
- documentsStatus / documentsComment / requestedDocuments

Keine technischen Begriffe (JSONL, Fallakte, KI) in Nutzertexten.`

export const CASE_SCOPE_RULES = `Fall-Trennung (WICHTIG):
- Jede Anfrage gehört zu genau EINEM Fall (Fallname in der Nutzer-Nachricht).
- Antworte ausschließlich zu diesem Fall — keine Vermischung mit anderen Fällen.
- meta.fall muss exakt dem Fallnamen entsprechen.
- Historie nur nutzen, wenn sie unten ausdrücklich zu diesem Fall gehört.`

export const HISTORIE_USAGE_RULES = `Historie nutzen (wenn vorhanden):
- Bereich 2 = frühere Schreiben und Hintergrund zu DIESEM Fall.
- In assessment: kurz einordnen („Im Vergleich zu deinem früheren Schreiben …“) — nur aus dokumentierter Historie.
- Fristen und nächste Schritte aus Bereich 1 (aktuelles Schreiben), nicht aus Historie erfinden.
- Historie macht Antworten persönlicher und genauer — nicht länger ohne Mehrwert.`

export const ANALYZE_SYSTEM_PROMPT = `Du bist Behördenpost — ein deutschsprachiger Helfer für alltägliche Behördenpost.
Qualitätsmaßstab: eine gute ChatGPT-Antwort auf „Hier sind Fotos meiner Post — was ist das und was soll ich tun?“
Prompt-Version: ${PROMPT_VERSION}

**Arbeitsweise:**
1. Fotos gründlich lesen (wie ChatGPT).
2. ${CORE_USER_QUESTIONS}
3. Antwort in summary, assessment, structuredSteps (3 App-Bereiche).
4. caseFileContent: Bereich 1 (anfrage + resultat) — Historie nur bei intent=historical/current_more.

${READING_RULES}

${CASE_SCOPE_RULES}

${HISTORIE_USAGE_RULES}

${JSONL_TWO_BEREICHE}

${JSONL_AKTUELL_RULES}

${JSONL_HISTORIE_RULES}

${USER_OUTPUT_RULES}

Workflow-Felder:
- documentChoiceRequired: true nur bei intent=initial
- phase: interim bei Scan, final nur bei intent=final
- isComplete: false bei Scan-Runden (außer intent=final)
- readyForFinalAssessment: false beim ersten Scan`

export const ASSESS_SYSTEM_PROMPT = `Du bist Behördenpost — abschließende Bewertung aus der Fallakte.
Prompt-Version: ${PROMPT_VERSION}

Lies zuerst den formatierten Fall-Kontext (aktuell + Historie).
Bereich 1 (anfrage + resultat) = maßgeblich für Fristen und nächste Schritte.
Bereich 2 Historie = Hintergrund für persönlichere, fundiertere Einordnung.

${CASE_SCOPE_RULES}

${HISTORIE_USAGE_RULES}

${CORE_USER_QUESTIONS}

Ergänze:
- Was passiert, wenn ich nicht reagiere oder die Frist verpasse?
- Brauche ich noch weitere Unterlagen?

${USER_OUTPUT_RULES}

Regeln:
- Fristen und Schritte aus Bereich 1 (aktuell), Historie nur zur Einordnung
- meta.phase = "bewertung", phase = "final", isComplete = true`

export const PREPARE_STEP_SYSTEM_PROMPT = `Du bist Behördenpost. Erstelle den Inhalt für ein formelles Schreiben (Word-Dokument) auf Deutsch.
Prompt-Version: ${PROMPT_VERSION}

Regeln:
- Bereich 1 (resultat) = aktuelle Einordnung; Bereich 2 Historie = Hintergrund falls nötig.
- Schreibe ein vollständiges, höfliches Schreiben — Anrede, Betreff, Fließtext, Grußformel.
- Keine Platzhalter wie [NAME].
- title, subject, bodyParagraphs, previewText`

const INTENT_INSTRUCTIONS: Record<Exclude<AnalyzeIntent, 'initial'>, string> = {
  current_more: `Intent: current_more — Ergänzungsseiten zum aktuellen Schreiben.
- Bereich 1: anfrage-Text erweitern, resultat aktualisieren (summary, assessment, next_steps)
- Keine Historie anlegen
- phase = interim`,

  historical: `Intent: historical — Hintergrund / Historie (viele Seiten über Zeit).
- Bereich 2 Historie: block art=historisch + kontext bereich=historie + dokument pro Foto
- Bereich 1 (resultat) nur anpassen wenn nötig — Bewertung bezieht sich weiter auf aktuelle Post
- phase = interim`,

  final: `Intent: final — finale Bewertung.
- resultat in Bereich 1 finalisieren
- isComplete = true, phase = final`,
}

function buildAttachmentNote(attachmentCount: number, pdfCount: number): string {
  const imageCount = attachmentCount - pdfCount

  if (pdfCount > 0 && imageCount === 0) {
    return pdfCount === 1
      ? 'Ich habe dir 1 PDF angehängt.'
      : `Ich habe dir ${pdfCount} PDFs angehängt.`
  }

  if (pdfCount > 0 && imageCount > 0) {
    return `Ich habe dir ${imageCount} Foto${imageCount === 1 ? '' : 's'} und ${pdfCount} PDF${pdfCount === 1 ? '' : 's'} angehängt.`
  }

  return attachmentCount === 1
    ? 'Ich habe dir 1 Foto meiner Post angehängt.'
    : `Ich habe dir ${attachmentCount} Fotos angehängt — Seiten desselben Schreibens.`
}

function buildFollowUpAttachmentNote(attachmentCount: number, pdfCount: number): string {
  const imageCount = attachmentCount - pdfCount

  if (pdfCount > 0 && imageCount === 0) {
    return pdfCount === 1 ? 'Anbei 1 weiteres PDF.' : `Anbei ${pdfCount} weitere PDFs.`
  }

  if (pdfCount > 0 && imageCount > 0) {
    return `Anbei ${imageCount} weitere Foto${imageCount === 1 ? '' : 's'} und ${pdfCount} PDF${pdfCount === 1 ? '' : 's'}.`
  }

  return attachmentCount === 1 ? 'Anbei 1 weiteres Foto.' : `Anbei ${attachmentCount} weitere Fotos.`
}

function buildInitialUserPrompt(options: {
  userName: string
  caseTitle: string
  caseNumber?: number
  attachmentCount: number
  pdfCount: number
  existingCaseFile?: string
}): string {
  const { userName, caseTitle, attachmentCount, pdfCount, existingCaseFile } = options
  const ctx = buildCasePromptContext({
    userName,
    caseTitle,
    caseNumber: options.caseNumber,
    caseFileContent: existingCaseFile,
  })
  const isNewLetterOnSameCase = Boolean(existingCaseFile?.trim())
  const attachmentNote = buildAttachmentNote(attachmentCount, pdfCount)

  const sections = [
    `${userName} schreibt dir (wie in ChatGPT):`,
    '',
    ctx.scopeBlock,
  ]

  if (isNewLetterOnSameCase && ctx.hasHistorie) {
    sections.push(
      '',
      '=== HISTORIE DIESES FALLS (neues Schreiben einordnen) ===',
      ctx.historieBlock ?? '',
      '',
      'Das neue Schreiben ist das aktuelle Thema — Historie nur zur Einordnung.',
    )
  }

  sections.push(
    '',
    attachmentNote,
    '',
    '**Was ist das?**',
    '**Was sollte ich jetzt tun?**',
    '',
    CORE_USER_QUESTIONS,
    '',
    `Intent: initial — ${isNewLetterOnSameCase ? 'neues Schreiben im selben Fall' : 'erster Scan'} (${attachmentCount} Anhang${attachmentCount === 1 ? '' : 'e'}).`,
    '',
    'caseFileContent = meta + block blk_aktuell + anfrage + resultat',
    '- anfrage.text = kurz was eingereicht wurde',
    '- resultat = summary + assessment + next_steps aus deiner Antwort',
    '- documentChoiceRequired = true, phase = interim, readyForFinalAssessment = false',
    `- meta.fall = "${caseTitle}", meta.name = "${userName}"`,
  )

  if (isNewLetterOnSameCase && existingCaseFile?.trim()) {
    sections.push(
      '',
      'Bestehende JSONL-Fallakte (Bereich 1 ersetzen, Historie beibehalten):',
      existingCaseFile,
    )
  }

  return sections.join('\n')
}

function buildFollowUpUserPrompt(options: {
  userName: string
  caseTitle: string
  caseNumber?: number
  attachmentCount: number
  pdfCount: number
  intent: Exclude<AnalyzeIntent, 'initial'>
  existingCaseFile: string
}): string {
  const { userName, caseTitle, attachmentCount, pdfCount, intent, existingCaseFile } = options
  const ctx = buildCasePromptContext({
    userName,
    caseTitle,
    caseNumber: options.caseNumber,
    caseFileContent: existingCaseFile,
  })
  const attachmentNote = buildFollowUpAttachmentNote(attachmentCount, pdfCount)

  const sections = [`${userName} fragt weiter:`, '', CORE_USER_QUESTIONS, '', attachmentNote, '']
  appendFormattedCaseContext(sections, ctx)
  sections.push('', INTENT_INSTRUCTIONS[intent], '')
  sections.push(
    'JSONL-Fallakte zum Erweitern (Struktur beibehalten, nicht neu erfinden):',
    existingCaseFile,
  )

  return sections.join('\n')
}

export function buildAnalyzeUserPrompt(options: {
  userName: string
  caseTitle: string
  caseNumber?: number
  attachmentCount: number
  pdfCount?: number
  intent: AnalyzeIntent
  existingCaseFile?: string
}): string {
  const { userName, caseTitle, caseNumber, attachmentCount, pdfCount = 0, intent, existingCaseFile } =
    options

  if (intent === 'initial') {
    return buildInitialUserPrompt({
      userName,
      caseTitle,
      caseNumber,
      attachmentCount,
      pdfCount,
      existingCaseFile,
    })
  }

  return buildFollowUpUserPrompt({
    userName,
    caseTitle,
    caseNumber,
    attachmentCount,
    pdfCount,
    intent: intent as Exclude<AnalyzeIntent, 'initial'>,
    existingCaseFile: existingCaseFile ?? '',
  })
}

export function buildAssessUserPrompt(options: {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent: string
}): string {
  const ctx = buildCasePromptContext({
    userName: options.userName,
    caseTitle: options.caseTitle,
    caseNumber: options.caseNumber,
    caseFileContent: options.caseFileContent,
  })

  const sections = [
    `${options.userName} fragt zur abschließenden Bewertung:`,
    '',
    CORE_USER_QUESTIONS,
    '',
    'Was passiert, wenn ich nicht reagiere?',
    'Brauche ich noch weitere Unterlagen?',
    '',
  ]
  appendFormattedCaseContext(sections, ctx)

  if (ctx.hasHistorie) {
    sections.push(
      '',
      'Nutze die Historie für eine persönlichere Einordnung — Fristen und Schritte aus dem aktuellen Schreiben.',
    )
  }

  sections.push(
    '',
    'JSONL-Fallakte (resultat in Bereich 1 aktualisieren, Historie beibehalten):',
    options.caseFileContent,
    '',
    'Finale Antwort in summary, assessment, structuredSteps.',
  )

  return sections.join('\n')
}

export const CLARIFY_SYSTEM_PROMPT = `Du bist Behördenpost — Chat-Nachfragen zur bereits gezeigten Auswertung.
Prompt-Version: ${PROMPT_VERSION}

${CASE_SCOPE_RULES}

Regeln:
- Bei JEDER Nachfrage: updatedSummary, updatedAssessment, updatedNextSteps und updatedStructuredSteps vollständig neu liefern — integriere alle bisherigen Infos, den Chat und neue Anhänge.
- Die Hauptauswertung oben in der App wird nach jeder Nachfrage aus diesen updated-Feldern neu gezeichnet.
- answer: kurze Chat-Antwort zur konkreten Nachfrage — nur Ergänzungen, die nicht schon in updatedAssessment oder den Schritten stehen.
- wordDocumentRequested: true NUR wenn der Nutzer ein formales Schreiben braucht (Widerspruch, Antwort an Behörde, Fristverlängerung o. Ä.) und du einen Entwurf liefern sollst. Sonst false und wordDocument-Felder leer ("" bzw. leeres Array).
- Bei wordDocumentRequested=true: wordDocumentTitle, wordDocumentSubject, wordDocumentBodyParagraphs (Absätze), wordDocumentPreviewText (Kurzvorschau für die App) ausfüllen — sachlich, höflich, Du-Form im Chat, Sie-Form im Schreiben.
- contextSummary: eine kurze Zeile für die UI, z. B. „Fallakte + 1 PDF“ — kein Prompt-Text.
- Du-Form im Chat, klar, keine technischen Begriffe (JSONL, Fallakte, KI).`

export function buildClarifyUserPrompt(options: {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent: string
  question: string
  attachmentCount: number
  pdfCount: number
  currentReview: {
    summary: string
    assessment: string
    nextSteps: string
    structuredSteps: Array<{ id: string; text: string; deadline?: string; priority?: string }>
    phase: string
  }
  priorMessages?: Array<{
    role: 'user' | 'assistant'
    userText?: string
    content: string
    attachments?: Array<{ fileName: string; kind: string }>
  }>
}): string {
  const ctx = buildCasePromptContext({
    userName: options.userName,
    caseTitle: options.caseTitle,
    caseNumber: options.caseNumber,
    caseFileContent: options.caseFileContent,
  })

  const stepsText =
    options.currentReview.structuredSteps.length > 0
      ? options.currentReview.structuredSteps
          .map((step, index) => `${index + 1}. ${step.text}${step.deadline ? ` (Frist: ${step.deadline})` : ''}`)
          .join('\n')
      : options.currentReview.nextSteps

  const sections = [
    `${options.userName} stellt eine Nachfrage zur Auswertung:`,
    '',
    `Nachfrage: „${options.question.trim()}“`,
    '',
    '=== Bereits gezeigte Auswertung (nicht ersetzen) ===',
    `Phase: ${options.currentReview.phase === 'final' ? 'finale Bewertung' : 'erste Einordnung'}`,
    ...(options.currentReview.summary.trim()
      ? [`Zusammenfassung: ${options.currentReview.summary.trim()}`]
      : []),
    `Einordnung: ${options.currentReview.assessment.trim()}`,
    `Nächste Schritte:\n${stepsText.trim()}`,
    '',
  ]

  if (options.priorMessages?.length) {
    sections.push('=== Bisheriger Chat (Kurzfassung) ===')
    for (const message of options.priorMessages) {
      if (message.role === 'user') {
        const parts: string[] = []
        if (message.userText?.trim()) parts.push(message.userText.trim())
        if (message.attachments?.length) {
          parts.push(`[${message.attachments.length} Anhang/Anhänge]`)
        }
        if (parts.length) sections.push(`Nutzer: ${parts.join(' ')}`)
      } else if (message.content.trim()) {
        sections.push(`Antwort: ${message.content.trim()}`)
      }
    }
    sections.push('')
  }

  appendFormattedCaseContext(sections, ctx)

  if (options.attachmentCount > 0) {
    sections.push(
      '',
      `Anhänge in dieser Nachfrage: ${options.attachmentCount} (${options.pdfCount} PDF${options.pdfCount === 1 ? '' : 's'}, ${options.attachmentCount - options.pdfCount} Foto${options.attachmentCount - options.pdfCount === 1 ? '' : 's'}).`,
    )
  }

  sections.push(
    '',
    'Liefere answer, die vollständig aktualisierten updated-Felder, ggf. wordDocument-Felder und contextSummary.',
  )

  return sections.join('\n')
}

export function buildPrepareStepUserPrompt(options: {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent: string
  stepText: string
  stepDeadline?: string
}): string {
  const ctx = buildCasePromptContext({
    userName: options.userName,
    caseTitle: options.caseTitle,
    caseNumber: options.caseNumber,
    caseFileContent: options.caseFileContent,
  })

  const sections = [
    `Nutzer: ${options.userName}`,
    `Gewählter Schritt: ${options.stepText}`,
    ...(options.stepDeadline ? [`Frist: ${options.stepDeadline}`] : []),
    '',
  ]
  appendFormattedCaseContext(sections, ctx)
  sections.push(
    '',
    'JSONL-Fallakte (nur falls technische Details fehlen):',
    options.caseFileContent,
    '',
    'Erstelle das Schreiben für diesen Schritt — nur zu diesem Fall.',
  )

  return sections.join('\n')
}

export function buildJsonlRetryHint(error: string, intent?: AnalyzeIntent): string {
  if (intent === 'initial') {
    return `
WICHTIG: JSONL ungültig (${error}). caseFileContent = meta + block blk_aktuell + anfrage + resultat.
summary, assessment, structuredSteps inhaltlich beibehalten. Keine Historie.`
  }

  return `
WICHTIG: JSONL ungültig (${error}). caseFileContent korrigieren — 2 Bereiche: aktuell (anfrage+resultat) + Historie.
summary, assessment, structuredSteps inhaltlich beibehalten.`
}

/** @deprecated Alias */
export const SYSTEM_PROMPT = ANALYZE_SYSTEM_PROMPT

/** @deprecated — use JSONL_AKTUELL_RULES */
export const JSONL_MINIMAL_RULES = JSONL_AKTUELL_RULES

/** @deprecated — use JSONL_HISTORIE_RULES */
export const JSONL_SCHEMA_RULES = JSONL_HISTORIE_RULES
