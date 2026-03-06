import 'server-only'

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export interface GeminiMappingRequest {
  modelName: string
  allowedFields: string[]
  headers: string[]
  firstRow: Record<string, unknown>
}

export async function requestGeminiColumnMapping(input: GeminiMappingRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nao configurada')
  }

  const prompt = [
    `Baseado nestes cabecalhos e nesta amostra de dados, mapeie cada coluna para os campos do modelo ${input.modelName}.`,
    'Retorne APENAS um JSON valido no formato {"coluna_arquivo":"campo_prisma"}.',
    'Nao inclua markdown, comentarios ou texto extra.',
    `Campos permitidos do modelo: ${input.allowedFields.join(', ')}`,
    `Cabecalhos: ${JSON.stringify(input.headers)}`,
    `Amostra (primeira linha): ${JSON.stringify(input.firstRow)}`,
  ].join('\n')

  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
  })

  const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null

  if (!response.ok) {
    const details = payload ? JSON.stringify(payload) : 'sem detalhes'
    throw new Error(`Gemini falhou: ${response.status} ${details}`)
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')?.trim()
  if (!text) {
    throw new Error('Gemini retornou resposta vazia')
  }

  return text
}
