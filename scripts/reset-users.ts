/**
 * Script para resetar usuários: exclui todos, cria admin (alisson355) e usuário comum (igor).
 * O admin recebe dados mockados; o igor fica limpo.
 *
 * Uso: npx tsx scripts/reset-users.ts
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL nao definida')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const ADMIN = { username: 'alisson355', password: 'Pilhadeira10@', name: 'Admin', role: 'admin' as const }
const USER_IGOR = { username: 'igor', password: 'igor2026@', name: 'Igor', role: 'user' as const }

// Dados mockados (mesmos do seed.ts)
const clientesData = [
  { nome: 'TechCorp Solutions', email: 'contato@techcorp.com.br', telefone: '(11) 3456-7890', empresa: 'TechCorp Solutions', endereco: 'Av. Paulista, 1000', cidade: 'São Paulo', estado: 'SP', cep: '01310-100' },
  { nome: 'Maria Silva', email: 'maria.silva@inovacao.com', telefone: '(21) 9876-5432', empresa: 'Inovação Digital', endereco: 'Rua das Flores, 250', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20040-020' },
  { nome: 'João Santos', email: 'joao.santos@startup.com.br', telefone: '(11) 91234-5678', empresa: 'StartupTech', endereco: 'Rua Augusta, 500', cidade: 'São Paulo', estado: 'SP', cep: '01305-000' },
  { nome: 'Ana Costa', email: 'ana.costa@empresa.com', telefone: '(31) 3456-7890', empresa: 'Empresa XYZ', endereco: 'Av. Afonso Pena, 3000', cidade: 'Belo Horizonte', estado: 'MG', cep: '30130-009' },
  { nome: 'Carlos Oliveira', email: 'carlos.oliveira@negocios.com.br', telefone: '(41) 9876-5432', empresa: 'Negócios & Cia', endereco: 'Rua XV de Novembro, 100', cidade: 'Curitiba', estado: 'PR', cep: '80020-310' },
  { nome: 'Fernanda Lima', email: 'fernanda.lima@consultoria.com', telefone: '(11) 3456-1234', empresa: 'Consultoria Premium', endereco: 'Av. Faria Lima, 2000', cidade: 'São Paulo', estado: 'SP', cep: '01452-000' },
  { nome: 'Roberto Alves', email: 'roberto.alves@tech.com.br', telefone: '(51) 9123-4567', empresa: 'Tech Solutions RS', endereco: 'Av. Borges de Medeiros, 500', cidade: 'Porto Alegre', estado: 'RS', cep: '90020-020' },
  { nome: 'Juliana Pereira', email: 'juliana.pereira@digital.com', telefone: '(85) 9876-5432', empresa: 'Digital Marketing', endereco: 'Av. Beira Mar, 1000', cidade: 'Fortaleza', estado: 'CE', cep: '60165-121' },
  { nome: 'Pedro Martins', email: 'pedro.martins@servicos.com.br', telefone: '(11) 3456-7890', empresa: 'Serviços Integrados', endereco: 'Rua Oscar Freire, 800', cidade: 'São Paulo', estado: 'SP', cep: '01426-001' },
  { nome: 'Lucia Ferreira', email: 'lucia.ferreira@inovacao.com.br', telefone: '(21) 9123-4567', empresa: 'Inovação & Tecnologia', endereco: 'Rua do Ouvidor, 50', cidade: 'Rio de Janeiro', estado: 'RJ', cep: '20040-030' },
]

const contatosData = [
  { nome: 'Paulo Souza', email: 'paulo.souza@techcorp.com.br', telefone: '(11) 3456-7891', cargo: 'Gerente de TI' },
  { nome: 'Sandra Rodrigues', email: 'sandra.rodrigues@techcorp.com.br', telefone: '(11) 3456-7892', cargo: 'Diretora Comercial' },
  { nome: 'Ricardo Mendes', email: 'ricardo.mendes@inovacao.com', telefone: '(21) 9876-5433', cargo: 'CEO' },
  { nome: 'Patricia Almeida', email: 'patricia.almeida@startup.com.br', telefone: '(11) 91234-5679', cargo: 'CTO' },
  { nome: 'Marcos Rocha', email: 'marcos.rocha@empresa.com', telefone: '(31) 3456-7891', cargo: 'Gerente de Vendas' },
]

const statusOportunidades = ['sem_contato', 'em_potencial', 'orcamento', 'fechada', 'perdida']
const statusTarefas = ['pendente', 'em_andamento', 'concluida']
const prioridadesTarefas = ['baixa', 'media', 'alta']

const oportunidadesTitulos = [
  'Implementação de Sistema ERP', 'Desenvolvimento de App Mobile', 'Consultoria em Transformação Digital',
  'Migração para Cloud', 'Sistema de Gestão de Vendas', 'Plataforma E-commerce', 'Automação de Processos',
  'Sistema de CRM Personalizado', 'Integração de Sistemas', 'Desenvolvimento de Dashboard Analytics',
  'Sistema de Gestão de Estoque', 'Plataforma de E-learning', 'Sistema de Gestão de Projetos',
  'App de Delivery', 'Sistema de Gestão Financeira',
]

const oportunidadesDescricoes = [
  'Implementação completa de sistema ERP para gestão empresarial',
  'Desenvolvimento de aplicativo mobile nativo para iOS e Android',
  'Consultoria estratégica para transformação digital da empresa',
  'Migração completa da infraestrutura para cloud',
  'Sistema completo de gestão de vendas e relacionamento',
  'Plataforma de e-commerce com integração de pagamentos',
  'Automação de processos internos com RPA',
  'Sistema de CRM customizado para necessidades específicas',
  'Integração entre múltiplos sistemas legados',
  'Dashboard analytics com visualizações em tempo real',
  'Sistema completo de gestão de estoque e logística',
  'Plataforma de ensino a distância com recursos avançados',
  'Sistema de gestão de projetos com metodologia ágil',
  'Aplicativo de delivery com gestão de entregadores',
  'Sistema completo de gestão financeira e contábil',
]

const tarefasTitulos = [
  'Reunião inicial com cliente', 'Enviar orcamento comercial', 'Apresentação de produto',
  'Follow-up pós reunião', 'Preparar contrato', 'Negociar condições comerciais',
  'Coletar feedback do cliente', 'Agendar próxima reunião', 'Enviar documentação técnica',
  'Validar requisitos', 'Preparar demonstração', 'Análise de viabilidade',
  'Revisar orcamento', 'Contato telefônico', 'Enviar email de follow-up',
  'Preparar apresentação executiva', 'Reunião de alinhamento', 'Coletar assinaturas',
  'Configurar ambiente de demonstracao', 'Treinamento do time',
]

async function seedMockDataForAdmin(adminId: string) {
  const userId = adminId

  const clientesCriados = []
  for (const d of clientesData) {
    const c = await prisma.cliente.create({ data: { ...d, userId } })
    clientesCriados.push(c)
  }
  console.log(`  ${clientesCriados.length} clientes criados`)

  for (let i = 0; i < Math.min(contatosData.length, clientesCriados.length); i++) {
    await prisma.contato.create({
      data: { ...contatosData[i], clienteId: clientesCriados[i].id, userId },
    })
  }
  console.log(`  ${Math.min(contatosData.length, clientesCriados.length)} contatos criados`)

  const oportunidadesCriadas = []
  for (let i = 0; i < oportunidadesTitulos.length; i++) {
    const status = statusOportunidades[i % statusOportunidades.length]
    let probabilidade = 0
    if (status === 'sem_contato') probabilidade = 10 + Math.floor(Math.random() * 20)
    else if (status === 'em_potencial') probabilidade = 30 + Math.floor(Math.random() * 20)
    else if (status === 'orcamento') probabilidade = 50 + Math.floor(Math.random() * 20)
    else if (status === 'fechada') probabilidade = 100

    const valor = Math.floor(Math.random() * 490000) + 10000
    let dataFechamento: Date | null = null
    if (status === 'fechada') {
      dataFechamento = new Date()
      dataFechamento.setDate(dataFechamento.getDate() + Math.floor(Math.random() * 60) + 1)
    }

    const op = await prisma.oportunidade.create({
      data: {
        userId,
        titulo: oportunidadesTitulos[i],
        descricao: oportunidadesDescricoes[i],
        valor,
        status,
        probabilidade,
        dataFechamento,
        clienteId: clientesCriados[i % clientesCriados.length].id,
      },
    })
    oportunidadesCriadas.push(op)
  }
  console.log(`  ${oportunidadesCriadas.length} oportunidades criadas`)

  for (let i = 0; i < tarefasTitulos.length; i++) {
    const status = statusTarefas[i % statusTarefas.length]
    const prioridade = prioridadesTarefas[i % prioridadesTarefas.length]
    const cliente = i % 2 === 0 ? clientesCriados[i % clientesCriados.length] : null
    const oportunidade = i % 2 === 1 ? oportunidadesCriadas[i % oportunidadesCriadas.length] : null
    const dataVencimento = new Date()
    dataVencimento.setDate(dataVencimento.getDate() + Math.floor(Math.random() * 30) - 10)

    await prisma.tarefa.create({
      data: {
        userId,
        titulo: tarefasTitulos[i],
        descricao: tarefasTitulos[i],
        status,
        prioridade,
        dataVencimento,
        clienteId: cliente?.id,
        oportunidadeId: oportunidade?.id,
      },
    })
  }
  console.log(`  ${tarefasTitulos.length} tarefas criadas`)
}

async function main() {
  console.log('Resetando usuários...')

  const deleted = await prisma.user.deleteMany({})
  console.log(`${deleted.count} usuário(s) excluído(s)`)

  const adminHash = await bcrypt.hash(ADMIN.password, 12)
  const admin = await prisma.user.create({
    data: {
      username: ADMIN.username,
      passwordHash: adminHash,
      name: ADMIN.name,
      email: `${ADMIN.username}@local.test`,
      role: ADMIN.role,
    },
  })
  console.log(`Admin criado: ${ADMIN.username} / ${ADMIN.password}`)

  const igorHash = await bcrypt.hash(USER_IGOR.password, 12)
  await prisma.user.create({
    data: {
      username: USER_IGOR.username,
      passwordHash: igorHash,
      name: USER_IGOR.name,
      email: `${USER_IGOR.username}@local.test`,
      role: USER_IGOR.role,
    },
  })
  console.log(`Usuário criado: ${USER_IGOR.username} / ${USER_IGOR.password} (conta limpa)`)

  console.log('\nInserindo dados mockados para o admin...')
  await seedMockDataForAdmin(admin.id)

  console.log('\nConcluído.')
  console.log('  - alisson355 (admin): dados mockados')
  console.log('  - igor (user): conta limpa')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
