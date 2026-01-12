const { PrismaClient } = require('@prisma/client')
const path = require('path')

async function testDatabase() {
    console.log('🔍 Verificando configuração do banco de dados...')

    // Mostrar a DATABASE_URL
    console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Não definida')

    // Calcular o caminho correto
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    console.log('Caminho do banco:', dbPath)
    console.log('Caminho normalizado:', `file:${dbPath.replace(/\\/g, '/')}`)

    try {
        const prisma = new PrismaClient({
            log: ['query', 'error', 'warn'],
        })

        console.log('\n✅ Prisma Client criado com sucesso!')

        // Testar conexão
        console.log('\n🔄 Testando conexão com o banco...')
        const clientes = await prisma.cliente.findMany({
            take: 5
        })

        console.log(`\n✅ Conexão bem sucedida! Encontrados ${clientes.length} clientes.`)

        if (clientes.length > 0) {
            console.log('\n📋 Primeiros clientes:')
            clientes.forEach(c => console.log(`  - ${c.nome} (${c.email || 'sem email'})`))
        }

        // Testar criação
        console.log('\n🔄 Testando criação de cliente...')
        const novoCliente = await prisma.cliente.create({
            data: {
                nome: 'Teste Cliente',
                email: `teste${Date.now()}@example.com`,
                telefone: '(11) 99999-9999'
            }
        })

        console.log('✅ Cliente criado com sucesso:', novoCliente.nome)

        // Deletar o cliente de teste
        await prisma.cliente.delete({
            where: { id: novoCliente.id }
        })

        console.log('✅ Cliente de teste removido')

        await prisma.$disconnect()
        console.log('\n🎉 Todos os testes passaram!')

    } catch (error) {
        console.error('\n❌ Erro ao conectar com o banco:', error)
        console.error('\nDetalhes do erro:')
        console.error('  Mensagem:', error.message)
        console.error('  Código:', error.code)
        console.error('  Stack:', error.stack)
    }
}

testDatabase()
