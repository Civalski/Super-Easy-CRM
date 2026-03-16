const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const rootDir = process.cwd()

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

const routeSeedClear = readFile('app/api/seed/clear/route.ts')
const routeSeed = readFile('app/api/seed/route.ts')
const routePedidosId = readFile('app/api/pedidos/[id]/route.ts')
const routeOportunidadesId = readFile('app/api/oportunidades/[id]/route.ts')
const routeProspectos = readFile('app/api/prospectos/route.ts')
const routeFinanceiroContasReceber = readFile('app/api/financeiro/contas-receber/route.ts')
const routeHelpers = readFile('lib/api/route-helpers.ts')
const prismaSchema = readFile('prisma/schema.prisma')

const criticalRoutes = [
  'app/api/seed/clear/route.ts',
  'app/api/seed/route.ts',
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
  check('Seed clear bloqueado em producao', () =>
    includesAll(routeSeedClear, ["NODE_ENV === 'production'", 'status: 403'])
  ),
  check('Seed clear exige token quando configurado', () =>
    includesAll(routeSeedClear, ['SEED_ADMIN_TOKEN', "x-seed-token"])
  ),
  check('Seed de dados bloqueado em producao', () =>
    includesAll(routeSeed, ["NODE_ENV === 'production'", 'status: 403'])
  ),
  check('Seed de dados exige token quando configurado', () =>
    includesAll(routeSeed, ['SEED_ADMIN_TOKEN', "x-seed-token"])
  ),
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

const allChecks = [...tests, ...unauthorizedChecks]

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
