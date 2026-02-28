const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function normalizeCode(code) {
  return code.replace(/\s+/g, '').toUpperCase()
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

async function main() {
  const raw = process.env.REGISTRATION_CODES || ''
  const codes = raw
    .split(/[,\\n;]/)
    .map((c) => c.trim())
    .filter(Boolean)

  if (codes.length === 0) {
    console.error('REGISTRATION_CODES nao definido ou vazio')
    process.exit(1)
  }

  const uniqueCodes = Array.from(new Set(codes.map(normalizeCode)))

  for (const code of uniqueCodes) {
    const codeHash = hashCode(code)
    await prisma.registrationCode.upsert({
      where: { codeHash },
      update: {},
      create: { codeHash },
    })
  }

  console.log(`OK: ${uniqueCodes.length} codigo(s) carregado(s)`)
}

main()
  .catch((err) => {
    console.error('Erro ao carregar codigos:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
