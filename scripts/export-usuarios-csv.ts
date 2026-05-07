/**
 * Exporta todos os usuários cadastrados para scripts/usuarios.csv.
 * Inclui: username, name, email, role, telefone (empresa), areaAtuacao (ramo),
 * tipoPublico e assinatura vigente.
 *
 * Uso: npx tsx scripts/export-usuarios-csv.ts
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { normalizeSubscriptionStatus } from '@/lib/billing/subscription'

let prisma: PrismaClient

async function ensureEnvLoaded() {
  if (process.env.DATABASE_URL) return

  try {
    const dotenv = await import('dotenv')
    dotenv.config()
  } catch {
    // Permite execução mesmo sem dotenv instalado, desde que DATABASE_URL
    // já esteja definida no ambiente do sistema.
  }
}

function escapeCsv(value: string | null | undefined): string {
  if (value == null || value === '') return ''
  const str = String(value).trim()
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function getAssinaturaVigente(user: {
  subscriptionStatus: string | null
  subscriptionNextBillingAt: Date | null
  subscriptionLastWebhookAt: Date | null
}): 'trial' | 'premium' | 'expirado' {
  const normalizedStatus = normalizeSubscriptionStatus(user.subscriptionStatus)

  if (normalizedStatus !== 'authorized') {
    return 'expirado'
  }

  const { subscriptionNextBillingAt, subscriptionLastWebhookAt } = user
  if (subscriptionNextBillingAt && subscriptionLastWebhookAt) {
    const diffMs =
      subscriptionNextBillingAt.getTime() - subscriptionLastWebhookAt.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    // Quando a próxima cobrança está muito próxima da criação/último sync,
    // tratamos como janela de trial do checkout Stripe.
    if (diffDays > 0 && diffDays <= 10) {
      return 'trial'
    }
  }

  return 'premium'
}

async function main() {
  await ensureEnvLoaded()

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não definida. Defina no ambiente ou em um arquivo .env'
    )
  }

  const adapter = new PrismaPg({ connectionString })
  prisma = new PrismaClient({ adapter })

  const users = await prisma.user.findMany({
    orderBy: { username: 'asc' },
    include: {
      empresaConfig: true,
      pdfConfig: true,
    },
  })

  const header =
    'username,name,email,role,telefone,areaAtuacao,tipoPublico,assinaturaVigente'
  const rows = users.map((u) => {
    const telefone = u.pdfConfig?.telefone ?? ''
    const areaAtuacao = u.empresaConfig?.areaAtuacao ?? ''
    const tipoPublico = u.empresaConfig?.tipoPublico ?? ''
    const assinaturaVigente = getAssinaturaVigente(u)
    return [
      escapeCsv(u.username),
      escapeCsv(u.name),
      escapeCsv(u.email),
      escapeCsv(u.role),
      escapeCsv(telefone),
      escapeCsv(areaAtuacao),
      escapeCsv(tipoPublico),
      escapeCsv(assinaturaVigente),
    ].join(',')
  })

  const csvContent = [header, ...rows].join('\n')
  const scriptsDir = join(process.cwd(), 'scripts')
  mkdirSync(scriptsDir, { recursive: true })
  const csvPath = join(scriptsDir, 'usuarios.csv')
  writeFileSync(csvPath, csvContent, 'utf-8')

  console.log(`✓ Exportados ${users.length} usuário(s) para ${csvPath}`)
}

main()
  .catch((e) => {
    console.error('Erro ao exportar:', e)
    process.exit(1)
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })
