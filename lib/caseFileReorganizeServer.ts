import {
  CASE_FILE_REORGANIZE_SCHEMA,
  type CaseFileReorganizeResponse,
} from '@/lib/caseFileReorganizeSchema'
import type { CaseFileReorganizeInput } from '@/lib/caseFileReorganizeOps'
import {
  buildCaseFileReorganizeUserPrompt,
  CASE_FILE_REORGANIZE_SYSTEM_PROMPT,
} from '@/lib/prompts/caseFileReorganize'
import { prepareCaseFileContent, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import { callOpenAiChatCompletion } from '@/lib/openaiChat'
import { resolveOpenAiModel } from '@/lib/openaiModel'

export type RunCaseFileReorganizeResult =
  | { ok: true; caseFileContent: string }
  | { ok: false; error: string }

export async function runCaseFileReorganize(
  input: CaseFileReorganizeInput & { apiKey: string; model?: string },
): Promise<RunCaseFileReorganizeResult> {
  const model = input.model ?? resolveOpenAiModel()
  const userText = buildCaseFileReorganizeUserPrompt(input)

  const completion = await callOpenAiChatCompletion({
    apiKey: input.apiKey,
    model,
    temperature: 0.2,
    maxTokens: 8192,
    jsonSchema: {
      name: 'behoerdenpost_case_file_reorganize',
      schema: CASE_FILE_REORGANIZE_SCHEMA,
    },
    messages: [
      { role: 'system', content: CASE_FILE_REORGANIZE_SYSTEM_PROMPT },
      { role: 'user', content: userText },
    ],
  })

  if (!completion.ok) {
    return { ok: false, error: completion.error }
  }

  let parsed: CaseFileReorganizeResponse
  try {
    parsed = JSON.parse(completion.content) as CaseFileReorganizeResponse
  } catch {
    return { ok: false, error: 'Reorganize-Antwort konnte nicht gelesen werden.' }
  }

  const prepared = prepareCaseFileContent(parsed.caseFileContent ?? '')
  const validationError = validateCaseFileJsonl(prepared.content)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  return { ok: true, caseFileContent: prepared.content }
}
