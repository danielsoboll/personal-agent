/**
 * Re-Export der zentralen Prompt-Registry.
 * Neue Anweisungen bitte in lib/prompts/registry.ts pflegen.
 */
export {
  ANALYZE_SYSTEM_PROMPT,
  ASSESS_SYSTEM_PROMPT,
  PREPARE_STEP_SYSTEM_PROMPT,
  PROMPT_VERSION,
  SYSTEM_PROMPT,
  JSONL_SCHEMA_RULES,
  JSONL_MINIMAL_RULES,
  USER_OUTPUT_RULES,
  CORE_USER_QUESTIONS,
  READING_RULES,
  buildAnalyzeUserPrompt,
  buildAssessUserPrompt,
  buildPrepareStepUserPrompt,
  buildJsonlRetryHint,
} from '@/lib/prompts/registry'
