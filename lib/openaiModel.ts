/**
 * Standard-Modell für alle OpenAI-Aufrufe in Behördenpost.
 *
 * gpt-5.6 → laut OpenAI-Alias für gpt-5.6-sol (Flagship, Vision + Structured Outputs).
 * Override: OPENAI_MODEL in .env.local
 */
export const DEFAULT_OPENAI_MODEL = 'gpt-5.6'

/** Fallback falls das neueste Modell (noch) nicht freigeschaltet ist. */
export const FALLBACK_OPENAI_MODEL = 'gpt-4o'

export function resolveOpenAiModel(): string {
  const fromEnv = process.env.OPENAI_MODEL?.trim()
  if (fromEnv) return fromEnv
  return DEFAULT_OPENAI_MODEL
}
