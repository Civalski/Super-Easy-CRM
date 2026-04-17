const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const rootDir = process.cwd()

const PUBLIC_AUTH_ROUTES = new Set([
  'app/api/auth/[...nextauth]/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/auth/register/resend-confirmation/route.ts',
  'app/api/auth/forgot-password/route.ts',
  'app/api/auth/oauth-complete/route.ts',
  'app/api/auth/sync-password/route.ts',
])

const WEBHOOK_ROUTES = new Set(['app/api/billing/stripe/webhook/route.ts'])

const CRON_ROUTES = new Set([
  'app/api/financeiro/automacoes/processar/route.ts',
  'app/api/prospectos/agendamentos/processar/route.ts',
])

function normalizeRel(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/')
}

function collectApiRouteFiles() {
  const base = path.join(rootDir, 'app', 'api')
  const out = []
  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, name.name)
      if (name.isDirectory()) {
        walk(full)
      } else if (name.name === 'route.ts') {
        out.push(normalizeRel(full))
      }
    }
  }
  walk(base)
  return out.sort()
}

function classifyApiRoute(relativePath) {
  if (PUBLIC_AUTH_ROUTES.has(relativePath)) return 'B'
  if (WEBHOOK_ROUTES.has(relativePath)) return 'C'
  if (CRON_ROUTES.has(relativePath)) return 'D'
  return 'A'
}

function readFile(relativePath) {
  const filePath = path.join(rootDir, relativePath)
  return fs.readFileSync(filePath, 'utf8')
}

function isTracked(relativePath) {
  const result = spawnSync('git', ['ls-files', '--error-unmatch', relativePath], {
    cwd: rootDir,
    encoding: 'utf8',
  })
  return result.status === 0
}

function check(name, predicate) {
  try {
    const ok = predicate()
    return {
      name,
      ok,
      detail: ok ? 'ok' : 'failed',
    }
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : 'unexpected error',
    }
  }
}

function includesAll(content, snippets) {
  return snippets.every((snippet) => content.includes(snippet))
}

function hasScopedIdWhere(content) {
  return (
    content.includes('where: { id: params.id, userId }') ||
    content.includes('where: { id: (await params).id, userId }') ||
    content.includes('where: { id, userId }')
  )
}

const routePedidosId = readFile('app/api/pedidos/[id]/route.ts')
const routeOportunidadesId = readFile('app/api/oportunidades/[id]/route.ts')
const routeProspectos = readFile('app/api/prospectos/route.ts')
const routeFinanceiroContasReceber = readFile('app/api/financeiro/contas-receber/route.ts')
const routeHelpers = readFile('lib/api/route-helpers.ts')
const prismaSchema = readFile('prisma/schema.prisma')

const criticalRoutes = [
  'app/api/oportunidades/[id]/route.ts',
  'app/api/oportunidades/route.ts',
  'app/api/grupos/route.ts',
  'app/api/pedidos/[id]/route.ts',
  'app/api/dashboard/route.ts',
]

const routeHelpersHasAuth =
  includesAll(routeHelpers, ['Unauthorized', 'status: 401'])

const unauthorizedChecks = criticalRoutes.map((routeFile) =>
  check(`Auth guard em ${routeFile}`, () => {
    const content = readFile(routeFile)
    const hasDirectAuth = includesAll(content, ['Unauthorized', 'status: 401'])
    const usesWithAuth =
      routeHelpersHasAuth &&
      (content.includes('withAuth') || content.includes('getUserIdFromRequest'))
    return hasDirectAuth || usesWithAuth
  })
)

const tests = [
  check('PATCH de pedidos usa transacao', () =>
    routePedidosId.includes('prisma.$transaction')
  ),
  check('DELETE de pedidos preserva escopo por userId', () =>
    hasScopedIdWhere(routePedidosId)
  ),
  check('PATCH de oportunidade preserva escopo por userId', () =>
    routeOportunidadesId.includes('updateMany({') && hasScopedIdWhere(routeOportunidadesId)
  ),
  check('GET de prospectos nao possui delete automatico', () =>
    !routeProspectos.includes('deleteMany({')
  ),
  check('Endpoint de exclusao de dados da conta existe', () =>
    fs.existsSync(path.join(rootDir, 'app/api/users/me/data/route.ts'))
  ),
  check('DELETE de oportunidade preserva escopo por userId', () =>
    routeOportunidadesId.includes('deleteMany({') && hasScopedIdWhere(routeOportunidadesId)
  ),
  check('Contas a receber validam posse de relacoes por userId', () =>
    includesAll(routeFinanceiroContasReceber, [
      'validateContaReceberRelations',
      'Pedido informado nao pertence ao usuario',
      'Oportunidade informada nao pertence ao usuario',
      'Fornecedor informado nao pertence ao usuario',
      'Funcionario informado nao pertence ao usuario',
    ])
  ),
  check('ContaReceber usa relacoes compostas com tenant no schema', () =>
    includesAll(prismaSchema, [
      'fields: [pedidoId, userId], references: [id, userId]',
      'fields: [oportunidadeId, userId], references: [id, userId]',
      'fields: [fornecedorId, userId], references: [id, userId]',
      'fields: [funcionarioId, userId], references: [id, userId]',
      '@@unique([id, userId])',
    ])
  ),
  check('Artefatos locais nao estao rastreados (pyc/venv/env/acidental)', () => {
    const trackedArtifacts = [
      '.env.development',
      '.venv/Scripts/python.exe',
      'backend/app/__pycache__/main.cpython-313.pyc',
      'backend/app/__pycache__/__init__.cpython-313.pyc',
      'et --hard aab0469',
    ].filter((artifact) => isTracked(artifact))

    return trackedArtifacts.length === 0
  }),
]

const routeFiles = collectApiRouteFiles()
const stripeWebhook = readFile('app/api/billing/stripe/webhook/route.ts')
const financeAutomacoes = readFile('app/api/financeiro/automacoes/processar/route.ts')
const prospectosProcessar = readFile('app/api/prospectos/agendamentos/processar/route.ts')
const middleware = readFile('middleware.ts')

const inventoryChecks = [
  check('Inventario API: cada route.ts tem classificacao conhecida', () => routeFiles.length > 0),
  ...routeFiles.map((rel) =>
    check(`Inventario API: ${rel} autenticado ou excecao documentada`, () => {
      const kind = classifyApiRoute(rel)
      if (kind !== 'A') return true
      const content = readFile(rel)
      return content.includes('withAuth')
    })
  ),
  check('Webhook Stripe valida assinatura (constructEvent)', () =>
    includesAll(stripeWebhook, ['constructEvent', 'stripe-signature', 'STRIPE_WEBHOOK_SECRET'])
  ),
  check('Cron financeiro exige segredo de agendador', () =>
    includesAll(financeAutomacoes, ['hasSchedulerSecret', 'Unauthorized', 'status: 401'])
  ),
  check('Cron prospectos agendados exige segredo', () =>
    includesAll(prospectosProcessar, ['LEADS_SCHEDULER_SECRET', 'Unauthorized', 'status: 401'])
  ),
  check('Middleware define allowlist OSS para APIs', () =>
    includesAll(middleware, ['OSS_API_ALLOW_PREFIXES', 'OSS_API_DENIED_PREFIXES', 'applyOssGuard'])
  ),
  check('Rotas com $queryRaw em API parametrizam tenant (userId)', () => {
    const rawFiles = [
      'app/api/financeiro/contas-receber/route.ts',
      'app/api/dashboard/route.ts',
      'app/api/produtos-servicos/route.ts',
      'app/api/prospectos/route.ts',
    ]
    return rawFiles.every((rel) => {
      const content = readFile(rel)
      return content.includes('$queryRaw') && content.includes('${userId}')
    })
  }),
  check('Assinatura inativa: API retorna 402 (SUBSCRIPTION_REQUIRED)', () =>
    includesAll(routeHelpers, ['402', 'SUBSCRIPTION_REQUIRED', 'getUserSubscriptionAccess'])
  ),
  check('Sessao: JWT validado contra sessao ativa (sessionId)', () => {
    const auth = readFile('lib/auth.ts')
    return (
      auth.includes('isActiveUserSession') &&
      auth.includes('sessionId') &&
      auth.includes('tokenSessionId')
    )
  }),
  check('Middleware OSS nega APIs fora da allowlist (403 JSON)', () =>
    includesAll(middleware, [
      'status: 403',
      'Recurso não disponível nesta edição do CRM.',
    ])
  ),
]

const allChecks = [...tests, ...unauthorizedChecks, ...inventoryChecks]

let failed = 0
for (const result of allChecks) {
  const symbol = result.ok ? 'PASS' : 'FAIL'
  if (!result.ok) failed += 1
  console.log(`${symbol} - ${result.name}${result.ok ? '' : ` (${result.detail})`}`)
}

if (failed > 0) {
  console.error(`\n${failed} verificacao(oes) falharam.`)
  process.exit(1)
}

console.log(`\nTodas as ${allChecks.length} verificacoes passaram.`)
