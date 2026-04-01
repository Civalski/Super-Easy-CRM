import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { MODELOS_IA_CONTRATO } from '@/lib/contratos-ia'

export const dynamic = 'force-dynamic'

const EXECUTION_MODEL_IDS = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5.4', 'gemini-2.0-flash'] as const
type ExecutionModelId = (typeof EXECUTION_MODEL_IDS)[number]
const MODEL_IDS = ['multi-models', ...EXECUTION_MODEL_IDS] as const
type ModelId = (typeof MODEL_IDS)[number]
type OpenAiModelId = Extract<ExecutionModelId, 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5.4'>
const DEFAULT_OPENAI_MODEL: OpenAiModelId = 'gpt-5-nano'
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'

function isPrivilegedRole(role: string | null | undefined) {
  const normalized = (role ?? '').trim().toLowerCase()
  return normalized === 'admin' || normalized === 'owner' || normalized === 'superadmin'
}

function getLimiteDiario(model: string): number {
  const config = MODELOS_IA_CONTRATO.find((m) => m.id === model)
  return config?.limiteDiario ?? 1
}

function getDataHojeBR(): string {
  const now = new Date()
  const br = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return br.toISOString().slice(0, 10)
}

interface GerarIaBody {
  prompt: string
  titulo?: string
  tipo?: string
  modoDocumento?: string
  preambuloBase?: string
  clausulasBase?: ClausulaGerada[]
  model?: string
  useMultiModels?: boolean
  primaryModel?: string
  secondaryModel?: string
  rigidez?: string
}

interface ClausulaGerada {
  titulo: string
  conteudo: string
}

interface DadosParteGerada {
  nome?: string
  documento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  email?: string
  telefone?: string
  [key: string]: string | undefined
}

interface RespostaGerada {
  preambulo?: string
  condicoesComerciais?: string
  clausulas: ClausulaGerada[]
  dadosPartes?: {
    contratante?: DadosParteGerada
    contratado?: DadosParteGerada
  }
}

function parseJsonFromResponse(text: string): RespostaGerada | null {
  try {
    const trimmed = text.trim()
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as RespostaGerada
  } catch {
    return null
  }
}

function sanitizeRespostaGerada(parsed: RespostaGerada): RespostaGerada {
  return {
    preambulo: typeof parsed.preambulo === 'string' ? parsed.preambulo.trim() : '',
    condicoesComerciais:
      typeof parsed.condicoesComerciais === 'string' ? parsed.condicoesComerciais.trim() : '',
    clausulas: Array.isArray(parsed.clausulas)
      ? parsed.clausulas.filter(
          (c) => c && typeof c.titulo === 'string' && typeof c.conteudo === 'string'
        )
      : [],
    dadosPartes: parsed.dadosPartes || {
      contratante: {},
      contratado: {},
    },
  }
}

type ModoDocumento = 'contrato' | 'proposta'
const COMMERCIAL_TITLES = [
  'Valor do projeto',
  'Taxa extra',
  'Opcionais',
  'Forma de pagamento',
  'Validade da proposta',
] as const

function sanitizeGeneratedMultilineText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeSearchKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeProposalTitle(title: string, fallbackTitle: string): string {
  const cleanTitle = title.trim().replace(/^#+\s*/, '')
  if (!cleanTitle) return fallbackTitle
  const normalized = normalizeSearchKey(cleanTitle)
  if (/^(bloco|secao|sessao|topico|titulo)\s*\d*$/.test(normalized)) {
    return fallbackTitle
  }
  return cleanTitle
}

function normalizeProposalBlocksText(text: string | null | undefined, fallbackTitle: string): string {
  const normalized = sanitizeGeneratedMultilineText(text)
  if (!normalized) return ''

  const lines = normalized.split('\n')
  const sections: Array<{ title: string; content: string }> = []
  let currentTitle = fallbackTitle
  let currentLines: string[] = []

  const flushCurrent = () => {
    const content = sanitizeGeneratedMultilineText(currentLines.join('\n'))
    if (!content) {
      currentLines = []
      return
    }
    sections.push({
      title: normalizeProposalTitle(currentTitle, fallbackTitle),
      content,
    })
    currentLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/)
    if (headingMatch) {
      flushCurrent()
      currentTitle = headingMatch[1].trim()
      continue
    }
    currentLines.push(rawLine)
  }

  flushCurrent()

  if (sections.length === 0) {
    return `## ${fallbackTitle}\n${normalized}`
  }

  return sections
    .map((section) => `## ${section.title}\n${section.content}`)
    .join('\n\n')
    .trim()
}

function mapCommercialTitle(key: string): (typeof COMMERCIAL_TITLES)[number] | null {
  if (key.includes('valor') || key.includes('investimento')) return 'Valor do projeto'
  if (key.includes('taxa')) return 'Taxa extra'
  if (key.includes('opcion')) return 'Opcionais'
  if (key.includes('pag') && (key.includes('forma') || key.includes('condic'))) return 'Forma de pagamento'
  if (key.includes('validade')) return 'Validade da proposta'
  return null
}

function normalizeProposalCommercialText(text: string | null | undefined): string {
  const normalized = sanitizeGeneratedMultilineText(text)
  if (!normalized) return ''

  const mappedValues: Partial<Record<(typeof COMMERCIAL_TITLES)[number], string>> = {}
  const extraLines: string[] = []

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (/^#{1,3}\s+/.test(line)) {
      extraLines.push(line)
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0) {
      const key = normalizeSearchKey(line.slice(0, separatorIndex))
      const value = line.slice(separatorIndex + 1).trim()
      const mappedTitle = mapCommercialTitle(key)
      if (mappedTitle && value) {
        mappedValues[mappedTitle] = value
        continue
      }
    }

    extraLines.push(line)
  }

  const requiredLines = COMMERCIAL_TITLES
    .map((title) => (mappedValues[title] ? `${title}: ${mappedValues[title]}` : ''))
    .filter(Boolean)
  const customBlocks = normalizeProposalBlocksText(extraLines.join('\n'), 'Detalhes comerciais')
  return [requiredLines.join('\n'), customBlocks].filter(Boolean).join('\n\n').trim()
}

function sanitizeClausulasBase(clausulasBase: unknown): ClausulaGerada[] {
  if (!Array.isArray(clausulasBase)) return []

  return clausulasBase
    .filter(
      (clausula): clausula is ClausulaGerada =>
        Boolean(
          clausula &&
            typeof clausula === 'object' &&
            typeof (clausula as ClausulaGerada).titulo === 'string' &&
            typeof (clausula as ClausulaGerada).conteudo === 'string'
        )
    )
    .map((clausula) => ({
      titulo: clausula.titulo.trim(),
      conteudo: clausula.conteudo.trim(),
    }))
    .filter((clausula) => clausula.titulo || clausula.conteudo)
}

function buildPrompts(input: {
  titulo: string
  tipo: string
  modoDocumento: ModoDocumento
  prompt: string
  rigidez: 'flexivel' | 'moderado' | 'rigoroso'
  preambuloBase?: string
  clausulasBase: ClausulaGerada[]
}) {
  const rigidezInstrucao =
    input.rigidez === 'flexivel'
      ? 'Use linguagem acessivel, clara e adaptavel, evitando jargoes juridicos excessivos.'
      : input.rigidez === 'rigoroso'
        ? 'Use linguagem juridica formal, tecnica e rigorosa, com termos precisos e clausulas detalhadas.'
        : 'Use equilibrio entre formalidade juridica e clareza, adequado para a maioria dos contratos.'

  const isProposta = input.modoDocumento === 'proposta'
  const systemPrompt = `Voce e um assistente juridico que gera ${isProposta ? 'propostas comerciais' : 'contratos'} em portugues do Brasil.
${rigidezInstrucao}

Retorne APENAS um objeto JSON valido, sem markdown ou texto extra, no formato:
{
  "preambulo": "${isProposta ? 'texto da proposta em blocos com titulos personalizados no formato ## Titulo' : 'texto introdutorio do contrato'}",
  "condicoesComerciais": "${isProposta ? 'texto com linhas obrigatorias de condicoes e blocos adicionais com titulos personalizados' : ''}",
  "clausulas": [
    { "titulo": "Titulo da clausula", "conteudo": "Texto completo da clausula" }
  ],
  "dadosPartes": {
    "contratante": { "nome": "", "rg": "", "documento": "", "endereco": "", "cidade": "", "estado": "", "cep": "", "email": "", "telefone": "" },
    "contratado": { "nome": "", "rg": "", "documento": "", "endereco": "", "cidade": "", "estado": "", "cep": "", "email": "", "telefone": "" }
  }
}
${isProposta ? 'Em proposta comercial, NAO invente dados de partes. Retorne "dadosPartes" com objetos vazios.' : 'Preencha os campos com dados ficticios plausiveis quando o usuario nao especificar.'} ${
    isProposta
      ? 'Em proposta comercial, NAO gere clausulas juridicas. Retorne "clausulas": []. No "preambulo", gere de 3 a 5 blocos com TITULOS PERSONALIZADOS, agrupando informacoes relacionadas em cada bloco. Cada bloco deve comecar com "## <Titulo do bloco>" seguido do conteudo em paragrafos e/ou listas. O TITULO precisa fazer sentido com a descricao do bloco. NUNCA retorne bloco vazio ou com titulo sem conteudo. Se nao houver conteudo util para um bloco, NAO crie esse bloco. Em "condicoesComerciais", inclua primeiro as linhas com os titulos EXATOS: "Valor do projeto", "Taxa extra", "Opcionais", "Forma de pagamento", "Validade da proposta". Depois dessas linhas, acrescente no maximo 1 ou 2 blocos adicionais com titulos personalizados e conteudo coerente.'
      : 'As clausulas devem ser formais e adequadas ao tipo de contrato.'
  }`

  const partesBase: string[] = []
  if (input.preambuloBase?.trim()) {
    partesBase.push(`PREAMBULO_BASE:\n${input.preambuloBase.trim()}`)
  }
  if (input.clausulasBase.length > 0) {
    const clausulasBaseTexto = input.clausulasBase
      .map(
        (clausula, index) =>
          `${index + 1}. Titulo: ${clausula.titulo || '(sem titulo)'}\nConteudo base: ${clausula.conteudo || '(a preencher)'}`
      )
      .join('\n\n')
    partesBase.push(`CLAUSULAS_BASE:\n${clausulasBaseTexto}`)
  }

  const instrucoesBase =
    partesBase.length > 0
      ? '\n\nUse o PREAMBULO_BASE e as CLAUSULAS_BASE como estrutura inicial. Preserve a intencao, complete lacunas e melhore a redacao juridica sem remover pontos relevantes.'
      : ''

  const contextoBase = partesBase.length > 0 ? `\n\n${partesBase.join('\n\n')}` : ''

  const docLabel = isProposta ? 'proposta' : 'contrato'
  const userPrompt = input.titulo
    ? `Titulo da ${docLabel}: ${input.titulo}. Tipo: ${input.tipo}.\n\nDescricao/requisitos: ${input.prompt}${instrucoesBase}${contextoBase}`
    : `Tipo de ${docLabel}: ${input.tipo}.\n\nDescricao/requisitos: ${input.prompt}${instrucoesBase}${contextoBase}`

  return { systemPrompt, userPrompt }
}

async function callOpenAiJson(model: OpenAiModelId, systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY nao configurada. Configure no .env/.env.local')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  const data = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    | null

  if (!response.ok) {
    const errMsg = data?.error?.message || response.statusText
    throw new Error(`OpenAI falhou (${response.status}): ${errMsg}`)
  }

  const content = data?.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('OpenAI retornou resposta vazia')
  return content
}

async function callGeminiJson(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY nao configurada. Configure no .env/.env.local')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  })

  const payload = (await response.json().catch(() => null)) as
    | {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        error?: { message?: string }
      }
    | null

  if (!response.ok) {
    const errMsg = payload?.error?.message || response.statusText
    throw new Error(`Gemini falhou (${response.status}): ${errMsg}`)
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  if (!text) throw new Error('Gemini retornou resposta vazia')
  return text
}

function parseOrThrow(provider: 'OpenAI' | 'Gemini', text: string): RespostaGerada {
  const parsed = parseJsonFromResponse(text)
  if (!parsed || !Array.isArray(parsed.clausulas)) {
    throw new Error(`${provider} retornou JSON invalido para contrato`)
  }
  return sanitizeRespostaGerada(parsed)
}

async function runSingleModelFlow(
  model: ExecutionModelId,
  prompts: { systemPrompt: string; userPrompt: string }
): Promise<RespostaGerada> {
  if (model === 'gemini-2.0-flash') {
    try {
      const geminiRaw = await callGeminiJson(prompts.systemPrompt, prompts.userPrompt)
      return parseOrThrow('Gemini', geminiRaw)
    } catch (geminiError) {
      const openAiKey = process.env.OPENAI_API_KEY?.trim()
      if (!openAiKey) throw geminiError

      try {
        const openAiRaw = await callOpenAiJson('gpt-5-mini', prompts.systemPrompt, prompts.userPrompt)
        return parseOrThrow('OpenAI', openAiRaw)
      } catch (fallbackError) {
        const geminiMsg = geminiError instanceof Error ? geminiError.message : 'falha desconhecida'
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'falha desconhecida'
        throw new Error(`Gemini indisponivel (${geminiMsg}). Fallback OpenAI falhou (${fallbackMsg}).`)
      }
    }
  }

  const openAiRaw = await callOpenAiJson(model, prompts.systemPrompt, prompts.userPrompt)
  return parseOrThrow('OpenAI', openAiRaw)
}

function getProviderLabel(model: ExecutionModelId): 'OpenAI' | 'Gemini' {
  return model === 'gemini-2.0-flash' ? 'Gemini' : 'OpenAI'
}

async function runMultiModelsFlow(
  primaryModel: ExecutionModelId,
  secondaryModel: ExecutionModelId,
  prompts: {
  systemPrompt: string
  userPrompt: string
}
): Promise<RespostaGerada> {
  if (primaryModel === secondaryModel) {
    return runSingleModelFlow(primaryModel, prompts)
  }

  let primaryDraft: RespostaGerada | null = null
  let primaryErr: string | null = null
  let secondaryErr: string | null = null

  try {
    primaryDraft = await runSingleModelFlow(primaryModel, prompts)
  } catch (error) {
    primaryErr = error instanceof Error ? error.message : 'Falha desconhecida no primeiro modelo'
  }

  const reviewPrompt = primaryDraft
    ? `${prompts.userPrompt}

RASCUNHO_PRIMEIRO_MODELO_JSON:
${JSON.stringify(primaryDraft)}

Revise o rascunho acima, corrija inconsistencias juridicas, complete lacunas e retorne apenas JSON valido no mesmo formato.`
    : prompts.userPrompt

  try {
    if (secondaryModel === 'gemini-2.0-flash') {
      const secondRaw = await callGeminiJson(prompts.systemPrompt, reviewPrompt)
      return parseOrThrow('Gemini', secondRaw)
    }
    const reviewedRaw = await callOpenAiJson(secondaryModel, prompts.systemPrompt, reviewPrompt)
    return parseOrThrow('OpenAI', reviewedRaw)
  } catch (error) {
    secondaryErr = error instanceof Error ? error.message : 'Falha desconhecida no segundo modelo'
  }

  if (primaryDraft) {
    return primaryDraft
  }

  try {
    return await runSingleModelFlow(secondaryModel, prompts)
  } catch (error) {
    const fallbackErr = error instanceof Error ? error.message : 'Falha desconhecida no fallback do segundo modelo'
    throw new Error(
      `Falha no modo multi-models. 1o modelo (${getProviderLabel(primaryModel)}): ${primaryErr ?? 'sem detalhes'} | 2o modelo (${getProviderLabel(secondaryModel)}): ${secondaryErr ?? 'sem detalhes'} | fallback: ${fallbackErr}`
    )
  }
}

async function registrarUso(userId: string, model: ModelId) {
  await ensureDatabaseInitialized()
  const dataHoje = getDataHojeBR()
  await prisma.iaGeracaoContrato.create({
    data: { userId, model, data: dataHoje },
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: GerarIaBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Corpo da requisicao invalido' }, { status: 400 })
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      return NextResponse.json({ error: 'Descreva o contrato que deseja criar' }, { status: 400 })
    }

    const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : ''
    const tipo = typeof body.tipo === 'string' ? body.tipo.trim() : 'geral'
    const modoDocumento: ModoDocumento = body.modoDocumento === 'proposta' || tipo === 'proposta' ? 'proposta' : 'contrato'
    const preambuloBase = typeof body.preambuloBase === 'string' ? body.preambuloBase.trim() : ''
    const clausulasBase = sanitizeClausulasBase(body.clausulasBase)
    const useMultiModels = Boolean(body.useMultiModels)
    const requestedPrimaryModel = EXECUTION_MODEL_IDS.includes(body.primaryModel as ExecutionModelId)
      ? (body.primaryModel as ExecutionModelId)
      : DEFAULT_OPENAI_MODEL
    const requestedSecondaryModel = EXECUTION_MODEL_IDS.includes(body.secondaryModel as ExecutionModelId)
      ? (body.secondaryModel as ExecutionModelId)
      : DEFAULT_GEMINI_MODEL
    const primaryModel = useMultiModels ? 'gemini-2.0-flash' : requestedPrimaryModel
    const secondaryModel = useMultiModels ? 'gpt-5-mini' : requestedSecondaryModel
    const requestedModel = MODEL_IDS.includes(body.model as ModelId) ? (body.model as ModelId) : null
    const model = useMultiModels
      ? 'multi-models'
      : requestedModel && requestedModel !== 'multi-models'
        ? requestedModel
        : primaryModel
    const rigidez =
      body.rigidez === 'flexivel' || body.rigidez === 'moderado' || body.rigidez === 'rigoroso'
        ? body.rigidez
        : 'moderado'

    try {
      await ensureDatabaseInitialized()
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!isPrivilegedRole(user?.role)) {
        const dataHoje = getDataHojeBR()
        const usoHoje = await prisma.iaGeracaoContrato.count({
          where: { userId, model, data: dataHoje },
        })
        const limite = getLimiteDiario(model)
        if (usoHoje >= limite) {
          return NextResponse.json(
            {
              error: `Limite diario atingido para ${model}. Voce pode usar ate ${limite} vez(es) por dia.`,
              code: 'RATE_LIMIT',
            },
            { status: 429 }
          )
        }
      }
    } catch (err) {
      console.error('[contratos/gerar-ia] Erro ao verificar limite:', err)
    }

    const prompts = buildPrompts({
      titulo,
      tipo,
      modoDocumento,
      prompt,
      rigidez,
      preambuloBase,
      clausulasBase,
    })

    try {
      const result =
        model === 'multi-models'
          ? await runMultiModelsFlow(primaryModel, secondaryModel, prompts)
          : await runSingleModelFlow(model as ExecutionModelId, prompts)
      const propostaPreambulo =
        modoDocumento === 'proposta'
          ? normalizeProposalBlocksText(result.preambulo, 'Resumo da proposta')
          : result.preambulo || ''
      const propostaCondicoes =
        modoDocumento === 'proposta'
          ? normalizeProposalCommercialText(result.condicoesComerciais)
          : ''

      await registrarUso(userId, model)

      return NextResponse.json({
        preambulo: propostaPreambulo,
        condicoesComerciais: propostaCondicoes,
        clausulas: modoDocumento === 'proposta' ? [] : result.clausulas,
        dadosPartes:
          modoDocumento === 'proposta'
            ? { contratante: {}, contratado: {} }
            : result.dadosPartes || { contratante: {}, contratado: {} },
      })
    } catch (error) {
      console.error('[contratos/gerar-ia] Error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao gerar contrato com IA' },
        { status: 500 }
      )
    }
  })
}
