/**
 * Exporta todos os usuários cadastrados para data/usuarios.csv.
 * Inclui: username, name, email, role, telefone (empresa), areaAtuacao (ramo), tipoPublico.
 *
 * Uso: npx tsx scripts/export-usuarios-csv.ts
 */
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL não definida')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

function escapeCsv(value: string | null | undefined): string {
  if (value == null || value === '') return ''
  const str = String(value).trim()
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { username: 'asc' },
    include: {
      empresaConfig: true,
      pdfConfig: true,
    },
  })

  const header = 'username,name,email,role,telefone,areaAtuacao,tipoPublico'
  const rows = users.map((u) => {
    const telefone = u.pdfConfig?.telefone ?? ''
    const areaAtuacao = u.empresaConfig?.areaAtuacao ?? ''
    const tipoPublico = u.empresaConfig?.tipoPublico ?? ''
    return [
      escapeCsv(u.username),
      escapeCsv(u.name),
      escapeCsv(u.email),
      escapeCsv(u.role),
      escapeCsv(telefone),
      escapeCsv(areaAtuacao),
      escapeCsv(tipoPublico),
    ].join(',')
  })

  const csvContent = [header, ...rows].join('\n')
  const dataDir = join(process.cwd(), 'data')
  mkdirSync(dataDir, { recursive: true })
  const csvPath = join(dataDir, 'usuarios.csv')
  writeFileSync(csvPath, csvContent, 'utf-8')

  console.log(`✓ Exportados ${users.length} usuário(s) para ${csvPath}`)
}

main()
  .catch((e) => {
    console.error('Erro ao exportar:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
