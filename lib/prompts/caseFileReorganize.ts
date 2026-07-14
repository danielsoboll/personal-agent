import { JSONL_HISTORIE_RULES, JSONL_TWO_BEREICHE } from '@/lib/prompts/registry'
import type { CaseFileReorganizeInput, CaseFileReorganizeOperation } from '@/lib/caseFileReorganizeOps'

export const CASE_FILE_REORGANIZE_PROMPT_VERSION = '2026-07-14.1'

export const CASE_FILE_REORGANIZE_SYSTEM_PROMPT = `Du strukturierst intern die JSONL-Fallakte von Behördenpost — der Nutzer sieht das nicht.
Prompt-Version: ${CASE_FILE_REORGANIZE_PROMPT_VERSION}

${JSONL_TWO_BEREICHE}

${JSONL_HISTORIE_RULES}

Regeln für alle Operationen:
- Nur gültiges JSONL zurückgeben (caseFileContent) — eine JSON-Zeile pro Eintrag
- meta-Zeile immer behalten (name, fall, aktualisiert, phase)
- Bereich 1: block art=aktuell + anfrage + resultat
- Bereich 2: block art=historisch + kontext bereich=historie + dokument rolle=historisch
- Keine erfundenen Fakten — nur aus vorhandener Fallakte und ggf. Review-Snapshot
- Duplikate entfernen, Reihenfolge: meta → block aktuell → anfrage → resultat → block historie → kontext → dokument`

const OPERATION_INSTRUCTIONS: Record<CaseFileReorganizeOperation, string> = {
  extend_historie: `**Operation: Historie erweitern**

Neue Hintergrund-Fotos wurden gescannt. Die Fallakte enthält bereits neue dokument-Zeilen (rolle=historisch).

Aufgabe:
- Bereich 2 Historie ordentlich erweitern — neue dokument-Zeilen behalten
- kontext bereich=historie aktualisieren: 2–5 Sätze Gesamtbild der Historie
- Offenen historisch-Block schließen wenn sinnvoll, sonst offen lassen
- Bereich 1 (anfrage + resultat) NICHT überschreiben — nur lesen falls Kontext nötig`,

  refresh_aktuell: `**Operation: Aktuelles Resultat aktualisieren**

Ergänzungsfotos zum aktuellen Schreiben wurden verarbeitet. Review-Snapshot enthält die frische Einordnung.

Aufgabe:
- Bereich 1: anfrage.text erweitern (Ergänzungsfotos erwähnen)
- resultat aus Review-Snapshot (summary, assessment, next_steps) aktualisieren, stand = heute
- Historie-Bereich unverändert lassen`,

  rotate_aktuell: `**Operation: Altes Schreiben in Historie, neues Schreiben wird aktuell**

Es liegt neues aktuelles Post ein — das bisherige Schreiben ist erledigt/veraltet (z. B. „Brief von letzter Woche“).

Aufgabe:
1. Bisheriges anfrage + resultat aus Bereich 1 in Bereich 2 Historie überführen:
   - Als dokument rolle=historisch (1–2 Zeilen pro Eintrag, titel + zusammenfassung aus altem resultat)
   - Datum aus altem resultat.stand oder anfrage.datum übernehmen
2. Neuen leeren Bereich 1 anlegen (block blk_aktuell offen):
   - anfrage: „Neues Schreiben — noch nicht geprüft“ oder aus Kontext
   - resultat: leer lassen ODER nur Platzhalter summary="" assessment="" wenn Pflicht
3. kontext bereich=historie: Kurz zusammenfassen was jetzt in der Historie liegt
4. Alte aktuell-Blöcke als abgeschlossen markieren`,

  consolidate_historie: `**Operation: Historie zusammenfassen**

Der Nutzer hat alle relevanten Unterlagen erfasst — vor der finalen Bewertung Historie straffen.

Aufgabe:
- Bereich 2: kontext bereich=historie prägnant (3–6 Sätze) — Muster, Fristen, wiederkehrende Behörden
- dokument-Zeilen behalten, ggf. redundante kürzen
- Offene historisch-Blöcke schließen
- Bereich 1 unverändert lassen`,
}

export function buildCaseFileReorganizeUserPrompt(input: CaseFileReorganizeInput): string {
  const reviewBlock = input.review
    ? `
Review-Snapshot (falls relevant):
- summary: ${input.review.summary ?? ''}
- assessment: ${input.review.assessment ?? ''}
- next_steps: ${input.review.nextSteps ?? ''}
- phase: ${input.review.phase ?? ''}`
    : ''

  return `Fall: ${input.caseTitle}
Nutzer: ${input.userName}

${OPERATION_INSTRUCTIONS[input.operation]}

Aktuelle JSONL-Fallakte:
${input.caseFileContent}
${reviewBlock}

Gib die vollständig überarbeitete caseFileContent zurück.`
}
