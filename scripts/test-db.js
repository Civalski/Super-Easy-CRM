require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

async function testDatabase() {
  console.log('Verificando configuracao do banco de dados...')

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
  console.log('DATABASE_URL definida:', hasDatabaseUrl ? 'sim' : 'nao')

  if (!hasDatabaseUrl) {
    console.error('Erro: DATABASE_URL nao definida.')
    process.exit(1)
  }

  try {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    const prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    })

    console.log('Prisma Client criado com sucesso!')

    console.log('Testando conexao com o banco...')
    const clientes = await prisma.cliente.findMany({
      take: 5
    })

    console.log(`Conexao bem sucedida! Encontrados ${clientes.length} clientes.`)

    if (clientes.length > 0) {
      console.log('Primeiros clientes:')
      clientes.forEach(c => console.log(`  - ${c.nome} (${c.email || 'sem email'})`))
    }

    console.log('Testando criacao de cliente...')
    const novoCliente = await prisma.cliente.create({
      data: {
        nome: 'Teste Cliente',
        email: `teste${Date.now()}@example.com`,
        telefone: '(11) 99999-9999'
      }
    })

    console.log('Cliente criado com sucesso:', novoCliente.nome)

    await prisma.cliente.delete({
      where: { id: novoCliente.id }
    })

    console.log('Cliente de teste removido')

    await prisma.$disconnect()
    console.log('Todos os testes passaram!')

  } catch (error) {
    console.error('Erro ao conectar com o banco:', error)
    console.error('Detalhes do erro:')
    console.error('  Mensagem:', error.message)
    console.error('  Codigo:', error.code)
    console.error('  Stack:', error.stack)
    process.exit(1)
  }
}

testDatabase()
