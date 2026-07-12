/** Normalisiert Whitespace für Vergleich von summary und assessment. */
function normalizeForCompare(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** summary nur anzeigen, wenn es sich klar von assessment unterscheidet. */
export function shouldShowSummary(summary: string | undefined, assessment: string | undefined): boolean {
  const summaryText = summary?.trim() ?? ''
  const assessmentText = assessment?.trim() ?? ''
  if (!summaryText || !assessmentText) return Boolean(summaryText)

  const normalizedSummary = normalizeForCompare(summaryText)
  const normalizedAssessment = normalizeForCompare(assessmentText)

  if (normalizedSummary === normalizedAssessment) return false
  if (normalizedAssessment.startsWith(normalizedSummary) && normalizedSummary.length >= 40) return false

  return true
}

export function displaySummary(summary: string | undefined): string {
  return summary?.trim() ?? ''
}
