import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readCsvToObjects } from '@/lib/csv'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL nao definida para executar o seed')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const DEFAULT_PASSWORD = 'admin1234'

type UsuarioRow = {
  username: string
  name: string
  email: string
  role: string
  telefone: string
  areaAtuacao: string
  tipoPublico: string
}

function getCol(row: Record<string, string | number | null>, ...names: string[]) {
  const keys = Object.keys(row).map((key) => key.toLowerCase())
  for (const name of names) {
    const key = keys.find((candidate) => candidate === name.toLowerCase())
    if (!key) continue
    const originalKey = Object.keys(row).find((candidate) => candidate.toLowerCase() === key)
    if (!originalKey) continue
    const value = row[originalKey]
    return value != null ? String(value).trim() : ''
  }
  return ''
}

function loadUsuariosFromCsv(): UsuarioRow[] {
  const csvPath = join(process.cwd(), 'data', 'usuarios.csv')
  const content = readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'))
  const csvContent = lines.join('\n')
  const rows = readCsvToObjects(csvContent) as Record<string, string | number | null>[]
  const first = rows[0]

  if (!first || !Object.keys(first).some((key) => key.toLowerCase() === 'username')) {
    throw new Error('Coluna "username" nao encontrada em data/usuarios.csv')
  }

  return rows.map((row) => ({
    username: getCol(row, 'username'),
    name: getCol(row, 'name'),
    email: getCol(row, 'email'),
    role: getCol(row, 'role') || 'user',
    telefone: getCol(row, 'telefone'),
    areaAtuacao: getCol(row, 'areaAtuacao', 'areaatuacao'),
    tipoPublico: getCol(row, 'tipoPublico', 'tipopublico'),
  }))
}

async function syncUser(row: UsuarioRow) {
  const username = row.username.trim()
  if (!username) return

  const existing = await prisma.user.findUnique({ where: { username } })

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: row.name || null,
        email: row.email || null,
        role: row.role || 'user',
      },
    })

    await prisma.empresaConfig.upsert({
      where: { userId: existing.id },
      create: {
        userId: existing.id,
        areaAtuacao: row.areaAtuacao || null,
        tipoPublico: row.tipoPublico || null,
      },
      update: {
        areaAtuacao: row.areaAtuacao || null,
        tipoPublico: row.tipoPublico || null,
      },
    })

    await prisma.pdfConfig.upsert({
      where: { userId: existing.id },
      create: {
        userId: existing.id,
        telefone: row.telefone || null,
      },
      update: {
        telefone: row.telefone || null,
      },
    })

    console.log(`Usuario atualizado: ${username}`)
    return
  }

  const created = await prisma.user.create({
    data: {
      username,
      name: row.name || null,
      email: row.email || null,
      role: row.role || 'user',
      passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 12),
      onboardingCompletedAt: new Date(),
    },
  })

  if (row.areaAtuacao || row.tipoPublico) {
    await prisma.empresaConfig.create({
      data: {
        userId: created.id,
        areaAtuacao: row.areaAtuacao || null,
        tipoPublico: row.tipoPublico || null,
      },
    })
  }

  if (row.telefone) {
    await prisma.pdfConfig.create({
      data: {
        userId: created.id,
        telefone: row.telefone || null,
      },
    })
  }

  console.log(`Usuario criado: ${username} (senha: ${DEFAULT_PASSWORD})`)
}

async function main() {
  console.log('Sincronizando usuarios de data/usuarios.csv...')
  const usuariosRows = loadUsuariosFromCsv()

  if (usuariosRows.length === 0) {
    throw new Error('Nenhum usuario encontrado em data/usuarios.csv')
  }

  for (const row of usuariosRows) {
    await syncUser(row)
  }

  console.log('Seed concluido sem criar dados artificiais de CRM.')
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
