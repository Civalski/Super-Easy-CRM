import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL nao definida para executar o seed')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })


// Dados fake para clientes
const clientesData = [
  {
    nome: 'TechCorp Solutions',
    email: 'contato@techcorp.com.br',
    telefone: '(11) 3456-7890',
    empresa: 'TechCorp Solutions',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
  },
  {
    nome: 'Maria Silva',
    email: 'maria.silva@inovacao.com',
    telefone: '(21) 9876-5432',
    empresa: 'Inovação Digital',
    endereco: 'Rua das Flores, 250',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20040-020',
  },
  {
    nome: 'João Santos',
    email: 'joao.santos@startup.com.br',
    telefone: '(11) 91234-5678',
    empresa: 'StartupTech',
    endereco: 'Rua Augusta, 500',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01305-000',
  },
  {
    nome: 'Ana Costa',
    email: 'ana.costa@empresa.com',
    telefone: '(31) 3456-7890',
    empresa: 'Empresa XYZ',
    endereco: 'Av. Afonso Pena, 3000',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30130-009',
  },
  {
    nome: 'Carlos Oliveira',
    email: 'carlos.oliveira@negocios.com.br',
    telefone: '(41) 9876-5432',
    empresa: 'Negócios & Cia',
    endereco: 'Rua XV de Novembro, 100',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80020-310',
  },
  {
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@consultoria.com',
    telefone: '(11) 3456-1234',
    empresa: 'Consultoria Premium',
    endereco: 'Av. Faria Lima, 2000',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01452-000',
  },
  {
    nome: 'Roberto Alves',
    email: 'roberto.alves@tech.com.br',
    telefone: '(51) 9123-4567',
    empresa: 'Tech Solutions RS',
    endereco: 'Av. Borges de Medeiros, 500',
    cidade: 'Porto Alegre',
    estado: 'RS',
    cep: '90020-020',
  },
  {
    nome: 'Juliana Pereira',
    email: 'juliana.pereira@digital.com',
    telefone: '(85) 9876-5432',
    empresa: 'Digital Marketing',
    endereco: 'Av. Beira Mar, 1000',
    cidade: 'Fortaleza',
    estado: 'CE',
    cep: '60165-121',
  },
  {
    nome: 'Pedro Martins',
    email: 'pedro.martins@servicos.com.br',
    telefone: '(11) 3456-7890',
    empresa: 'Serviços Integrados',
    endereco: 'Rua Oscar Freire, 800',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01426-001',
  },
  {
    nome: 'Lucia Ferreira',
    email: 'lucia.ferreira@inovacao.com.br',
    telefone: '(21) 9123-4567',
    empresa: 'Inovação & Tecnologia',
    endereco: 'Rua do Ouvidor, 50',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20040-030',
  },
]

// Dados fake para contatos
const contatosData = [
  { nome: 'Paulo Souza', email: 'paulo.souza@techcorp.com.br', telefone: '(11) 3456-7891', cargo: 'Gerente de TI' },
  { nome: 'Sandra Rodrigues', email: 'sandra.rodrigues@techcorp.com.br', telefone: '(11) 3456-7892', cargo: 'Diretora Comercial' },
  { nome: 'Ricardo Mendes', email: 'ricardo.mendes@inovacao.com', telefone: '(21) 9876-5433', cargo: 'CEO' },
  { nome: 'Patricia Almeida', email: 'patricia.almeida@startup.com.br', telefone: '(11) 91234-5679', cargo: 'CTO' },
  { nome: 'Marcos Rocha', email: 'marcos.rocha@empresa.com', telefone: '(31) 3456-7891', cargo: 'Gerente de Vendas' },
]

// Status possíveis para oportunidades
const statusOportunidades = ['sem_contato', 'em_potencial', 'orcamento', 'fechada', 'perdida']

// Status possíveis para tarefas
const statusTarefas = ['pendente', 'em_andamento', 'concluida']
const prioridadesTarefas = ['baixa', 'media', 'alta']

async function main() {
  console.log('?? Iniciando seed do banco de dados...')

  const existingUser = await prisma.user.findFirst()
  const seedUser =
    existingUser ??
    (await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@local.test',
        username: 'admin',
        passwordHash: await bcrypt.hash('admin1234', 12),
        role: 'admin',
      },
    }))

  const userId = seedUser.id




  // Criar clientes
  console.log('?? Criando clientes...')
  const clientesCriados = []
  for (const clienteData of clientesData) {
    const clienteExistente = await prisma.cliente.findFirst({
      where: { email: clienteData.email, userId },
    })

    if (!clienteExistente) {
      const cliente = await prisma.cliente.create({
        data: {
          ...clienteData,
          userId,
        },
      })
      clientesCriados.push(cliente)
      console.log(`  ? Cliente criado: ${cliente.nome}`)
    } else {
      clientesCriados.push(clienteExistente)
      console.log(`  ? Cliente já existe: ${clienteData.nome}`)
    }
  }

  // Criar contatos para alguns clientes
  console.log('?? Criando contatos...')
  for (let i = 0; i < Math.min(contatosData.length, clientesCriados.length); i++) {
    const contatoData = contatosData[i]
    const cliente = clientesCriados[i]

    const contatoExistente = await prisma.contato.findFirst({
      where: {
        email: contatoData.email,
        clienteId: cliente.id,
        userId,
      },
    })

    if (!contatoExistente) {
      await prisma.contato.create({
        data: {
          ...contatoData,
          clienteId: cliente.id,
          userId,
        },
      })
      console.log(`  ? Contato criado: ${contatoData.nome} (${cliente.nome})`)
    } else {
      console.log(`  ? Contato já existe: ${contatoData.nome}`)
    }
  }

  // Criar oportunidades
  console.log('?? Criando oportunidades...')
  const oportunidadesTitulos = [
    'Implementação de Sistema ERP',
    'Desenvolvimento de App Mobile',
    'Consultoria em Transformação Digital',
    'Migração para Cloud',
    'Sistema de Gestão de Vendas',
    'Plataforma E-commerce',
    'Automação de Processos',
    'Sistema de CRM Personalizado',
    'Integração de Sistemas',
    'Desenvolvimento de Dashboard Analytics',
    'Sistema de Gestão de Estoque',
    'Plataforma de E-learning',
    'Sistema de Gestão de Projetos',
    'App de Delivery',
    'Sistema de Gestão Financeira',
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

  const oportunidadesCriadas = []
  for (let i = 0; i < oportunidadesTitulos.length; i++) {
    const cliente = clientesCriados[i % clientesCriados.length]
    const status = statusOportunidades[i % statusOportunidades.length]

    // Calcular probabilidade baseada no status
    let probabilidade = 0
    switch (status) {
      case 'sem_contato':
        probabilidade = Math.floor(Math.random() * 20) + 10 // 10-30%
        break
      case 'em_potencial':
        probabilidade = Math.floor(Math.random() * 20) + 30 // 30-50%
        break
      case 'orcamento':
        probabilidade = Math.floor(Math.random() * 20) + 50 // 50-70%
        break
      case 'fechada':
        probabilidade = 100
        break
      case 'perdida':
        probabilidade = 0
        break
    }

    // Calcular valor aleatório entre 10k e 500k
    const valor = Math.floor(Math.random() * 490000) + 10000

    // Data de fechamento para oportunidades fechadas
    let dataFechamento: Date | null = null
    if (status === 'fechada') {
      const diasFuturos = Math.floor(Math.random() * 60) + 1
      dataFechamento = new Date()
      dataFechamento.setDate(dataFechamento.getDate() + diasFuturos)
    }

    const oportunidade = await prisma.oportunidade.create({
      data: {
        userId,
        titulo: oportunidadesTitulos[i],
        descricao: oportunidadesDescricoes[i],
        valor: valor,
        status: status,
        probabilidade: probabilidade,
        dataFechamento: dataFechamento,
        clienteId: cliente.id,

      },
    })
    oportunidadesCriadas.push(oportunidade)
    console.log(`  ? Oportunidade criada: ${oportunidade.titulo} (${status})`)
  }

  // Criar tarefas
  console.log('? Criando tarefas...')
  const tarefasTitulos = [
    'Reunião inicial com cliente',
    'Enviar orcamento comercial',
    'Apresentação de produto',
    'Follow-up pós reunião',
    'Preparar contrato',
    'Negociar condições comerciais',
    'Coletar feedback do cliente',
    'Agendar próxima reunião',
    'Enviar documentação técnica',
    'Validar requisitos',
    'Preparar demonstração',
    'Análise de viabilidade',
    'Revisar orcamento',
    'Contato telefônico',
    'Enviar email de follow-up',
    'Preparar apresentação executiva',
    'Reunião de alinhamento',
    'Coletar assinaturas',
    'Configurar ambiente de demonstracao',
    'Treinamento do time',
  ]

  const tarefasDescricoes = [
    'Agendar e realizar reunião inicial para entender necessidades',
    'Preparar e enviar orcamento comercial detalhado',
    'Apresentar funcionalidades principais do produto',
    'Fazer follow-up após reunião para manter relacionamento',
    'Preparar documento de contrato com termos e condições',
    'Negociar valores, prazos e condições de pagamento',
    'Solicitar e analisar feedback do cliente sobre o orcamento',
    'Agendar próxima reunião para dar continuidade',
    'Enviar documentação técnica e especificações',
    'Validar todos os requisitos com o cliente',
    'Preparar demonstração personalizada do produto',
    'Realizar análise de viabilidade técnica e financeira',
    'Revisar orcamento antes de enviar ao cliente',
    'Realizar contato telefônico para alinhamento',
    'Enviar email de follow-up com próximos passos',
    'Preparar apresentação para diretoria executiva',
    'Realizar reunião de alinhamento com equipe interna',
    'Coletar assinaturas necessárias para fechamento',
    'Configurar ambiente de demonstracao para apresentacao',
    'Realizar treinamento da equipe do cliente',
  ]

  for (let i = 0; i < tarefasTitulos.length; i++) {
    const status = statusTarefas[i % statusTarefas.length]
    const prioridade = prioridadesTarefas[i % prioridadesTarefas.length]

    // Algumas tarefas relacionadas a clientes, outras a oportunidades
    const cliente = i % 2 === 0 ? clientesCriados[i % clientesCriados.length] : null
    const oportunidade = i % 2 === 1 ? oportunidadesCriadas[i % oportunidadesCriadas.length] : null

    // Data de vencimento (algumas no passado, algumas no futuro)
    const diasOffset = Math.floor(Math.random() * 30) - 10 // -10 a +20 dias
    const dataVencimento = new Date()
    dataVencimento.setDate(dataVencimento.getDate() + diasOffset)

    await prisma.tarefa.create({
      data: {
        userId,
        titulo: tarefasTitulos[i],
        descricao: tarefasDescricoes[i],
        status: status,
        prioridade: prioridade,
        dataVencimento: dataVencimento,
        clienteId: cliente?.id,
        oportunidadeId: oportunidade?.id,
      },
    })
    console.log(`  ? Tarefa criada: ${tarefasTitulos[i]} (${status})`)
  }

  console.log('\n? Seed concluído com sucesso!')
  console.log(`?? Resumo:`)
  console.log(`   - ${clientesCriados.length} clientes`)
  console.log(`   - ${oportunidadesCriadas.length} oportunidades`)
  console.log(`   - ${tarefasTitulos.length} tarefas`)
}

main()
  .catch((e) => {
    console.error('? Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



