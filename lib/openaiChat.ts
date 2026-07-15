import { FALLBACK_OPENAI_MODEL } from '@/lib/openaiModel'

type JsonSchemaFormat = {
  name: string
  schema: Record<string, unknown>
}

type UserContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: string } }
  | { type: 'file'; file: { filename: string; file_data: string } }

type ChatMessage =
  | { role: 'system' | 'assistant'; content: string }
  | { role: 'user'; content: string | UserContentPart[] }

export type { UserContentPart }

export type OpenAiChatResult =
  | { ok: true; content: string; model: string }
  | { ok: false; status: number; error: string; model: string }

function usesGpt5Family(model: string): boolean {
  return model.includes('gpt-5')
}

export function buildChatCompletionBody(options: {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  jsonSchema?: JsonSchemaFormat
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    max_tokens: options.maxTokens ?? 4096,
  }

  if (options.temperature !== undefined) {
    body.temperature = options.temperature
  }

  if (options.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: options.jsonSchema.name,
        strict: true,
        schema: options.jsonSchema.schema,
      },
    }

    // GPT-5.x + json_schema on /v1/chat/completions requires reasoning_effort "none"
    if (usesGpt5Family(options.model)) {
      body.reasoning_effort = 'none'
    }
  }

  return body
}

function parseOpenAiError(status: number, errorText: string): string {
  try {
    const payload = JSON.parse(errorText) as { error?: { message?: string } }
    const message = payload.error?.message?.trim()
    if (message) return message
  } catch {
    /* ignore */
  }
  return `OpenAI-Anfrage fehlgeschlagen (${status}).`
}

export async function callOpenAiChatCompletion(options: {
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  jsonSchema?: JsonSchemaFormat
  allowFallback?: boolean
}): Promise<OpenAiChatResult> {
  const models = [options.model]
  if (options.allowFallback !== false && options.model !== FALLBACK_OPENAI_MODEL) {
    models.push(FALLBACK_OPENAI_MODEL)
  }

  let lastError = 'KI-Analyse fehlgeschlagen.'
  let lastStatus = 502

  for (const model of models) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        buildChatCompletionBody({
          model,
          messages: options.messages,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          jsonSchema: options.jsonSchema,
        }),
      ),
    })

    if (!response.ok) {
      const errorText = await response.text()
      lastStatus = response.status
      lastError = parseOpenAiError(response.status, errorText)
      console.error('OpenAI chat completion failed:', model, response.status, errorText)

      const retryableModelError =
        response.status === 404 ||
        response.status === 400 ||
        lastError.toLowerCase().includes('model') ||
        lastError.toLowerCase().includes('reasoning_effort')

      if (model !== models.at(-1) && retryableModelError) {
        console.warn(`OpenAI retry with fallback model after ${model} failed.`)
        continue
      }

      return { ok: false, status: lastStatus, error: lastError, model }
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      lastError = 'Leere KI-Antwort erhalten.'
      lastStatus = 502
      if (model !== models.at(-1)) continue
      return { ok: false, status: lastStatus, error: lastError, model }
    }

    if (model !== options.model) {
      console.info(`OpenAI succeeded with fallback model ${model} (requested ${options.model}).`)
    }

    return { ok: true, content, model }
  }

  return { ok: false, status: lastStatus, error: lastError, model: options.model }
}
