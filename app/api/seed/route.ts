import { randomUUID } from 'crypto'
import { GoalMetricType, GoalPeriodType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthIdentityFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function canRunSeed(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return {
      allowed: false,
      reason: 'Operacao indisponivel em producao',
    }
  }

  const requiredToken = process.env.SEED_ADMIN_TOKEN?.trim()
  if (!requiredToken) {
    return { allowed: true as const }
  }

  const providedToken = request.headers.get('x-seed-token')?.trim()
  if (providedToken !== requiredToken) {
    return {
      allowed: false,
      reason: 'Token de seed invalido',
    }
  }

  return { allowed: true as const }
}

function toYmd(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const MOCK_CLIENTES_TOTAL = 24
const MOCK_OPORTUNIDADES_TOTAL = 36
const MOCK_TAREFAS_TOTAL = 54
const MOCK_PROSPECTOS_TOTAL = 36
const MOCK_PRODUTOS_TOTAL = 20
const MOCK_FOLLOW_UP_ATTEMPTS_TOTAL = 40

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function createWeightedPool<T>(items: Array<{ value: T; weight: number }>) {
  return items.flatMap((item) => Array.from({ length: item.weight }, () => item.value))
}

function deterministicPick<T>(pool: T[], index: number, step = 5) {
  return pool[(index * step) % pool.length]
}


// Dados de demonstracao para clientes
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

// Dados de demonstracao para contatos
const contatosData = [
  { nome: 'Paulo Souza', email: 'paulo.souza@techcorp.com.br', telefone: '(11) 3456-7891', cargo: 'Gerente de TI' },
  { nome: 'Sandra Rodrigues', email: 'sandra.rodrigues@techcorp.com.br', telefone: '(11) 3456-7892', cargo: 'Diretora Comercial' },
  { nome: 'Ricardo Mendes', email: 'ricardo.mendes@inovacao.com', telefone: '(21) 9876-5433', cargo: 'CEO' },
  { nome: 'Patricia Almeida', email: 'patricia.almeida@startup.com.br', telefone: '(11) 91234-5679', cargo: 'CTO' },
  { nome: 'Marcos Rocha', email: 'marcos.rocha@empresa.com', telefone: '(31) 3456-7891', cargo: 'Gerente de Vendas' },
  { nome: 'Camila Santos', email: 'camila.santos@negocios.com.br', telefone: '(41) 9876-5433', cargo: 'Diretora Financeira' },
  { nome: 'Lucas Ferreira', email: 'lucas.ferreira@consultoria.com', telefone: '(11) 3456-1235', cargo: 'Gerente de Projetos' },
]

// Status possíveis para oportunidades
const statusOportunidades = ['sem_contato', 'em_potencial', 'orcamento', 'fechada', 'perdida']


export async function POST(request: NextRequest) {
  try {
    console.log('?? Iniciando seed do banco de dados...')

    const seedPermission = canRunSeed(request)
    if (!seedPermission.allowed) {
      return NextResponse.json(
        { error: seedPermission.reason },
        { status: 403 }
      )
    }

    const { userId } = await getAuthIdentityFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Criar clientes
    console.log('?? Criando clientes...')
    const clientesCriados = []
    for (let i = 0; i < MOCK_CLIENTES_TOTAL; i++) {
      const base = clientesData[i % clientesData.length]
      const lote = Math.floor(i / clientesData.length) + 1
      const [localPart, domainPart] = (base.email ?? `cliente.mock.${i + 1}@arkercrm.com.br`).split('@')
      const email = `${localPart}.mock${String(lote).padStart(2, '0')}@${domainPart}`

      const payload = {
        nome: lote === 1 ? base.nome : `${base.nome} ${lote}`,
        email,
        telefone: base.telefone,
        empresa: base.empresa ? `${base.empresa} ${lote}` : `Empresa Mock ${i + 1}`,
        endereco: base.endereco ? `${base.endereco} - ${100 + i}` : `Endereco ${100 + i}`,
        cidade: base.cidade,
        estado: base.estado,
        cep: base.cep,
        observacoes: 'Registro mockado para demonstracao.',
      }

      const clienteExistente = await prisma.cliente.findFirst({
        where: { email, userId },
        select: { id: true },
      })

      const cliente = clienteExistente
        ? await prisma.cliente.update({
            where: { id: clienteExistente.id },
            data: payload,
          })
        : await prisma.cliente.create({
            data: {
              ...payload,
              userId,
            },
          })

      clientesCriados.push(cliente)
      console.log(`  ? Cliente processado: ${cliente.nome}`)
    }

    // Criar contatos em maior volume
    console.log('?? Criando contatos...')
    let contatosCriados = 0
    const totalContatos = Math.max(clientesCriados.length + 6, 24)
    for (let i = 0; i < totalContatos; i++) {
      const contatoBase = contatosData[i % contatosData.length]
      const cliente = clientesCriados[i % clientesCriados.length]
      const rodada = Math.floor(i / clientesCriados.length) + 1
      const email = `contato.${String(i + 1).padStart(3, '0')}@mock.arkercrm.com.br`

      const contatoExistente = await prisma.contato.findFirst({
        where: {
          email,
          clienteId: cliente.id,
          userId,
        },
        select: { id: true },
      })

      const payload = {
        nome: rodada === 1 ? contatoBase.nome : `${contatoBase.nome} ${rodada}`,
        email,
        telefone: contatoBase.telefone,
        cargo: contatoBase.cargo,
        clienteId: cliente.id,
        userId,
      }

      if (contatoExistente) {
        await prisma.contato.update({
          where: { id: contatoExistente.id },
          data: payload,
        })
      } else {
        await prisma.contato.create({ data: payload })
      }

      contatosCriados++
      console.log(`  ? Contato processado: ${payload.nome} (${cliente.nome})`)
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
      'Sistema de RH e Folha de Pagamento',
      'Plataforma de Marketplace',
      'Sistema de Gestão de Qualidade',
      'App de Relacionamento com Cliente',
      'Sistema de Business Intelligence',
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
      'Sistema completo de recursos humanos e folha de pagamento',
      'Plataforma de marketplace multi-vendedor',
      'Sistema de gestão da qualidade e certificações',
      'Aplicativo mobile para relacionamento com cliente',
      'Sistema de BI com relatórios e análises avançadas',
    ]
    const oportunidadeStatusPool = createWeightedPool([
      { value: 'sem_contato', weight: 9 },
      { value: 'em_potencial', weight: 10 },
      { value: 'orcamento', weight: 8 },
      { value: 'fechada', weight: 6 },
      { value: 'perdida', weight: 3 },
    ])

    const oportunidadesCriadas: Array<{ id: string; status: string; valor: number | null }> = []
    for (let i = 0; i < MOCK_OPORTUNIDADES_TOTAL; i++) {
      const cliente = clientesCriados[i % clientesCriados.length]
      const status = deterministicPick(oportunidadeStatusPool, i)
      const idx = i % oportunidadesTitulos.length
      const sufixo = String(i + 1).padStart(3, '0')
      const titulo = `[Mock] ${oportunidadesTitulos[idx]} #${sufixo}`

      let probabilidade = 0
      switch (status) {
        case 'sem_contato':
          probabilidade = randomInt(8, 22)
          break
        case 'em_potencial':
          probabilidade = randomInt(23, 47)
          break
        case 'orcamento':
          probabilidade = randomInt(48, 78)
          break
        case 'fechada':
          probabilidade = randomInt(85, 97)
          break
        case 'perdida':
          probabilidade = randomInt(0, 15)
          break
      }

      let valor = 0
      if (status === 'sem_contato') valor = randomInt(12000, 85000)
      if (status === 'em_potencial') valor = randomInt(30000, 180000)
      if (status === 'orcamento') valor = randomInt(60000, 320000)
      if (status === 'fechada') valor = randomInt(90000, 450000)
      if (status === 'perdida') valor = randomInt(20000, 160000)

      let dataFechamento: Date | null = null
      if (status === 'fechada' || status === 'perdida') {
        dataFechamento = new Date()
        dataFechamento.setDate(dataFechamento.getDate() - randomInt(3, 90))
      }

      const payload = {
        userId,
        titulo,
        descricao: `${oportunidadesDescricoes[idx]}. Registro de demonstracao ${sufixo}.`,
        valor,
        status,
        probabilidade,
        dataFechamento,
        clienteId: cliente.id,
      }

      const oportunidadeExistente = await prisma.oportunidade.findFirst({
        where: {
          userId,
          titulo,
          clienteId: cliente.id,
        },
        select: { id: true },
      })

      const oportunidade = oportunidadeExistente
        ? await prisma.oportunidade.update({
            where: { id: oportunidadeExistente.id },
            data: payload,
          })
        : await prisma.oportunidade.create({ data: payload })

      oportunidadesCriadas.push({
        id: oportunidade.id,
        status: oportunidade.status,
        valor: oportunidade.valor,
      })
      console.log(`  ? Oportunidade processada: ${oportunidade.titulo} (${status})`)
    }
    // Criar tarefas
    console.log('? Criando tarefas...')
    const tarefasTitulos = [
      'Reunião inicial com cliente',
      'Enviar proposta comercial',
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
      'Revisar proposta',
      'Contato telefônico',
      'Enviar email de follow-up',
      'Preparar apresentação executiva',
      'Reunião de alinhamento',
      'Coletar assinaturas',
      'Configurar ambiente de demonstracao',
      'Treinamento do time',
      'Reunião de kickoff',
      'Coletar documentos necessários',
      'Validar escopo do projeto',
      'Preparar cronograma',
      'Revisar SLA',
    ]

    const tarefasDescricoes = [
      'Agendar e realizar reunião inicial para entender necessidades',
      'Preparar e enviar proposta comercial detalhada',
      'Apresentar funcionalidades principais do produto',
      'Fazer follow-up após reunião para manter relacionamento',
      'Preparar documento de contrato com termos e condições',
      'Negociar valores, prazos e condições de pagamento',
      'Solicitar e analisar feedback do cliente sobre a proposta',
      'Agendar próxima reunião para dar continuidade',
      'Enviar documentação técnica e especificações',
      'Validar todos os requisitos com o cliente',
      'Preparar demonstração personalizada do produto',
      'Realizar análise de viabilidade técnica e financeira',
      'Revisar proposta antes de enviar ao cliente',
      'Realizar contato telefônico para alinhamento',
      'Enviar email de follow-up com próximos passos',
      'Preparar apresentação para diretoria executiva',
      'Realizar reunião de alinhamento com equipe interna',
      'Coletar assinaturas necessárias para fechamento',
      'Configurar ambiente de demonstracao para demonstracao',
      'Realizar treinamento da equipe do cliente',
      'Realizar reunião de kickoff do projeto',
      'Coletar todos os documentos necessários do cliente',
      'Validar escopo completo do projeto',
      'Preparar cronograma detalhado de execução',
      'Revisar e acordar SLA com o cliente',
    ]

    const tarefaStatusPool = createWeightedPool([
      { value: 'pendente', weight: 24 },
      { value: 'em_andamento', weight: 18 },
      { value: 'concluida', weight: 12 },
    ])
    const tarefaPrioridadePool = createWeightedPool([
      { value: 'media', weight: 24 },
      { value: 'alta', weight: 18 },
      { value: 'baixa', weight: 12 },
    ])

    let tarefasCriadas = 0
    for (let i = 0; i < MOCK_TAREFAS_TOTAL; i++) {
      const status = deterministicPick(tarefaStatusPool, i, 7)
      const prioridade = deterministicPick(tarefaPrioridadePool, i, 3)
      const usaOportunidade = i % 3 !== 0
      const cliente = usaOportunidade ? null : clientesCriados[i % clientesCriados.length]
      const oportunidade = usaOportunidade ? oportunidadesCriadas[i % oportunidadesCriadas.length] : null

      let diasOffset = randomInt(-20, 30)
      if (status === 'concluida') {
        diasOffset = -randomInt(1, 20)
      }

      const dataVencimento = new Date()
      dataVencimento.setDate(dataVencimento.getDate() + diasOffset)

      const idx = i % tarefasTitulos.length
      const sufixo = String(i + 1).padStart(3, '0')
      const titulo = `[Mock] ${tarefasTitulos[idx]} #${sufixo}`
      const payload = {
        userId,
        titulo,
        descricao: `${tarefasDescricoes[idx]}. Atividade simulada ${sufixo}.`,
        status,
        prioridade,
        dataVencimento,
        clienteId: cliente?.id,
        oportunidadeId: oportunidade?.id,
      }

      const tarefaExistente = await prisma.tarefa.findFirst({
        where: {
          userId,
          titulo,
        },
        select: { id: true },
      })

      if (tarefaExistente) {
        await prisma.tarefa.update({
          where: { id: tarefaExistente.id },
          data: payload,
        })
      } else {
        await prisma.tarefa.create({ data: payload })
      }

      tarefasCriadas++
      console.log(`  ? Tarefa processada: ${titulo} (${status})`)
    }

    // Criar motivos de perda customizados
    console.log('?? Criando motivos de perda...')
    const motivosPerdaData = [
      'Sem fit de escopo',
      'Orcamento acima do esperado',
      'Cliente adiou decisao',
      'Concorrente com prazo menor',
      'Projeto pausado internamente',
      'Mudanca de prioridade',
    ]

    let motivosPerdaCriados = 0
    for (const nome of motivosPerdaData) {
      await prisma.motivoPerda.upsert({
        where: {
          userId_nome: {
            userId,
            nome,
          },
        },
        update: {},
        create: {
          userId,
          nome,
        },
      })
      motivosPerdaCriados++
    }

    // Criar prospectos para funil e leads
    console.log('?? Criando prospectos...')
    const prospectStatus = createWeightedPool([
      { value: 'lead_frio', weight: 9 },
      { value: 'novo', weight: 10 },
      { value: 'em_contato', weight: 7 },
      { value: 'qualificado', weight: 5 },
      { value: 'descartado', weight: 3 },
      { value: 'convertido', weight: 2 },
    ])
    const loteOptions = ['LOTE A', 'LOTE B', 'LOTE C', null]
    let prospectosCriados = 0
    for (let i = 0; i < MOCK_PROSPECTOS_TOTAL; i++) {
      const base = String(40000000 + i).padStart(8, '0')
      const ordem = '0001'
      const dv = String((i * 7) % 100).padStart(2, '0')
      const cnpj = `${base}${ordem}${dv}`
      const status = deterministicPick(prospectStatus, i)
      const cidade = ['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Fortaleza'][i % 5]
      const uf = ['SP', 'RJ', 'MG', 'PR', 'CE'][i % 5]
      const clienteConvertido = status === 'convertido' ? clientesCriados[i % clientesCriados.length] : null

      await prisma.prospecto.upsert({
        where: {
          userId_cnpj: {
            userId,
            cnpj,
          },
        },
        update: {
          razaoSocial: `Prospecto ${String(i + 1).padStart(3, '0')} LTDA`,
          nomeFantasia: `Negocio ${String(i + 1).padStart(3, '0')}`,
          municipio: cidade,
          uf,
          status,
          prioridade: i % 6,
          lote: loteOptions[i % loteOptions.length],
          ultimoContato:
            status === 'lead_frio' || (status === 'novo' && i % 2 === 0)
              ? null
              : new Date(Date.now() - (i % 10) * 86400000),
          clienteId: clienteConvertido?.id ?? null,
        },
        create: {
          userId,
          cnpj,
          cnpjBasico: cnpj.slice(0, 8),
          cnpjOrdem: cnpj.slice(8, 12),
          cnpjDv: cnpj.slice(12, 14),
          razaoSocial: `Prospecto ${String(i + 1).padStart(3, '0')} LTDA`,
          nomeFantasia: `Negocio ${String(i + 1).padStart(3, '0')}`,
          capitalSocial: `${80000 + i * 15000}`,
          porte: i % 2 === 0 ? 'ME' : 'EPP',
          naturezaJuridica: 'Sociedade Empresaria Limitada',
          situacaoCadastral: 'ATIVA',
          dataAbertura: `20${10 + (i % 12)}-0${(i % 9) + 1}-15`,
          matrizFilial: 'MATRIZ',
          cnaePrincipal: `620${i % 9}-1/00`,
          cnaePrincipalDesc: 'Desenvolvimento de software',
          cnaesSecundarios: '6204-0/00; 6311-9/00',
          tipoLogradouro: 'Rua',
          logradouro: `Via ${i + 100}`,
          numero: `${100 + i}`,
          complemento: i % 4 === 0 ? 'Sala 12' : null,
          bairro: `Bairro ${i % 7}`,
          cep: `0${String(1500000 + i * 83).slice(0, 7)}`,
          municipio: cidade,
          uf,
          telefone1: `(11) 4${String(20000000 + i * 37).slice(0, 8)}`,
          telefone2: i % 3 === 0 ? `(11) 9${String(11000000 + i * 19).slice(0, 8)}` : null,
          fax: null,
          email: `prospecto.${String(i + 1).padStart(3, '0')}@arkercrm.com.br`,
          status,
          observacoes: 'Prospecto criado para acompanhamento do funil.',
          prioridade: i % 6,
          lote: loteOptions[i % loteOptions.length],
          dataImportacao: new Date(Date.now() - (i % 30) * 86400000),
          ultimoContato:
            status === 'lead_frio' || (status === 'novo' && i % 2 === 0)
              ? null
              : new Date(Date.now() - (i % 10) * 86400000),
          clienteId: clienteConvertido?.id ?? null,
        },
      })
      prospectosCriados++
    }

    // Criar agendamentos de envio de prospectos
    console.log('?? Criando agendamentos de prospectos...')
    const agendamentosData = [
      { lote: 'LOTE A', dataEnvio: toYmd(new Date(Date.now() + 86400000)), status: 'pendente' },
      { lote: 'LOTE B', dataEnvio: toYmd(new Date(Date.now() - 86400000)), status: 'processado' },
      { lote: 'LOTE C', dataEnvio: toYmd(new Date(Date.now() + 2 * 86400000)), status: 'cancelado' },
      { lote: null, dataEnvio: toYmd(new Date(Date.now() + 3 * 86400000)), status: 'erro' },
    ]

    let agendamentosCriados = 0
    for (const item of agendamentosData) {
      const existente = await prisma.prospectoEnvioAgendado.findFirst({
        where: {
          userId,
          lote: item.lote,
          dataEnvio: item.dataEnvio,
          status: item.status,
        },
        select: { id: true },
      })

      if (existente) {
        await prisma.prospectoEnvioAgendado.update({
          where: { id: existente.id },
          data: {
            enviados: item.status === 'processado' ? 15 : 0,
            executadoEm: item.status === 'processado' ? new Date() : null,
            erro: item.status === 'erro' ? 'Falha simulada' : null,
          },
        })
      } else {
        await prisma.prospectoEnvioAgendado.create({
          data: {
            userId,
            lote: item.lote,
            dataEnvio: item.dataEnvio,
            status: item.status,
            enviados: item.status === 'processado' ? 15 : 0,
            executadoEm: item.status === 'processado' ? new Date() : null,
            erro: item.status === 'erro' ? 'Falha simulada' : null,
          },
        })
      }
      agendamentosCriados++
    }

    // Criar catalogo de produtos/servicos
    console.log('?? Criando produtos e servicos...')
    const produtosCriados = [] as Array<{ id: string; nome: string; precoPadrao: number }>
    for (let i = 0; i < MOCK_PRODUTOS_TOTAL; i++) {
      const tipo = i % 2 === 0 ? 'produto' : 'servico'
      const codigo = `PS-${String(i + 1).padStart(3, '0')}`
      const precoPadrao = Number((120 + i * 35.8).toFixed(2))
      const custoPadrao = Number((precoPadrao * 0.62).toFixed(2))

      const produto = await prisma.produtoServico.upsert({
        where: {
          userId_codigo: {
            userId,
            codigo,
          },
        },
        update: {
          nome: `${tipo === 'produto' ? 'Produto' : 'Servico'} ${String(i + 1).padStart(2, '0')}`,
          categoria: ['Software', 'Consultoria', 'Suporte', 'Equipamento'][i % 4],
          tipo,
          unidade: tipo === 'produto' ? 'UN' : 'HORA',
          precoPadrao,
          custoPadrao,
          controlaEstoque: tipo === 'produto',
          estoqueAtual: tipo === 'produto' ? 30 + i * 3 : 0,
          estoqueMinimo: tipo === 'produto' ? 5 : 0,
          tempoPadraoMinutos: tipo === 'servico' ? 60 + i * 5 : null,
          ativo: true,
        },
        create: {
          userId,
          codigo,
          nome: `${tipo === 'produto' ? 'Produto' : 'Servico'} ${String(i + 1).padStart(2, '0')}`,
          categoria: ['Software', 'Consultoria', 'Suporte', 'Equipamento'][i % 4],
          marca: ['Arker', 'Nexus', 'Prime', 'Nova'][i % 4],
          codigoBarras: tipo === 'produto' ? `789${String(100000000 + i).slice(0, 9)}` : null,
          tipo,
          unidade: tipo === 'produto' ? 'UN' : 'HORA',
          descricao: 'Item do catalogo para pedidos.',
          observacoesInternas: 'Gerado automaticamente.',
          precoPadrao,
          custoPadrao,
          comissaoPercentual: 5 + (i % 8),
          controlaEstoque: tipo === 'produto',
          estoqueAtual: tipo === 'produto' ? 30 + i * 3 : 0,
          estoqueMinimo: tipo === 'produto' ? 5 : 0,
          tempoPadraoMinutos: tipo === 'servico' ? 60 + i * 5 : null,
          garantiaDias: tipo === 'produto' ? 90 : null,
          prazoEntregaDias: 2 + (i % 10),
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          precoPadrao: true,
        },
      })
      produtosCriados.push(produto)
    }

    // Criar pedidos e itens vinculados a oportunidades
    console.log('?? Criando pedidos e itens...')
    const oportunidadesParaPedido = oportunidadesCriadas
      .filter((o) => o.status === 'orcamento' || o.status === 'fechada')
      .slice(0, 16)

    let pedidosCriados = 0
    let pedidoItensCriados = 0
    let contasReceberCriadas = 0
    let movimentosFinanceirosCriados = 0

    for (let i = 0; i < oportunidadesParaPedido.length; i++) {
      const oportunidade = oportunidadesParaPedido[i]
      const statusEntrega = ['pendente', 'em_preparacao', 'enviado', 'entregue'][i % 4]
      const pagamentoConfirmado = statusEntrega === 'entregue' || i % 4 === 0

      const pedidoExistente = await prisma.pedido.findUnique({
        where: { oportunidadeId: oportunidade.id },
        select: { id: true, numero: true },
      })

      const pedido = pedidoExistente
        ? await prisma.pedido.update({
            where: { id: pedidoExistente.id },
            data: {
              userId,
              statusEntrega,
              pagamentoConfirmado,
              formaPagamento: ['pix', 'boleto', 'cartao', 'transferencia'][i % 4],
              dataEntrega: new Date(Date.now() + (i + 2) * 86400000),
              observacoes: 'Pedido atualizado pela seed.',
            },
            select: { id: true, numero: true, totalLiquido: true },
          })
        : await prisma.pedido.create({
            data: {
              userId,
              oportunidadeId: oportunidade.id,
              statusEntrega,
              pagamentoConfirmado,
              formaPagamento: ['pix', 'boleto', 'cartao', 'transferencia'][i % 4],
              dataEntrega: new Date(Date.now() + (i + 2) * 86400000),
              observacoes: 'Pedido gerado pela seed.',
            },
            select: { id: true, numero: true, totalLiquido: true },
          })
      pedidosCriados++

      let totalBruto = 0
      let totalDesconto = 0
      let totalLiquido = 0

      for (let j = 0; j < 2; j++) {
        const produto = produtosCriados[(i + j) % produtosCriados.length]
        const descricao = `Item ${j + 1} - ${produto.nome}`
        const quantidade = 1 + ((i + j) % 3)
        const precoUnitario = produto.precoPadrao
        const desconto = Number((precoUnitario * (j === 0 ? 0.05 : 0.02)).toFixed(2))
        const subtotal = Number((quantidade * precoUnitario - desconto).toFixed(2))

        const itemExistente = await prisma.pedidoItem.findFirst({
          where: {
            userId,
            pedidoId: pedido.id,
            descricao,
          },
          select: { id: true },
        })

        if (itemExistente) {
          await prisma.pedidoItem.update({
            where: { id: itemExistente.id },
            data: {
              produtoServicoId: produto.id,
              quantidade,
              precoUnitario,
              desconto,
              subtotal,
            },
          })
        } else {
          await prisma.pedidoItem.create({
            data: {
              userId,
              pedidoId: pedido.id,
              produtoServicoId: produto.id,
              descricao,
              quantidade,
              precoUnitario,
              desconto,
              subtotal,
            },
          })
        }
        pedidoItensCriados++
        totalBruto += quantidade * precoUnitario
        totalDesconto += desconto
        totalLiquido += subtotal
      }

      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          totalBruto: Number(totalBruto.toFixed(2)),
          totalDesconto: Number(totalDesconto.toFixed(2)),
          totalLiquido: Number(totalLiquido.toFixed(2)),
        },
      })

      const valorRecebido = pagamentoConfirmado ? Number((totalLiquido * 0.5).toFixed(2)) : 0
      const conta = await prisma.contaReceber.upsert({
        where: { pedidoId: pedido.id },
        update: {
          userId,
          tipo: 'receber',
          descricao: `Recebimento pedido #${pedido.numero}`,
          valorTotal: Number(totalLiquido.toFixed(2)),
          valorRecebido,
          status: pagamentoConfirmado ? 'parcial' : i % 3 === 0 ? 'atrasado' : 'pendente',
          dataVencimento: new Date(Date.now() + (i - 2) * 86400000),
        },
        create: {
          userId,
          pedidoId: pedido.id,
          tipo: 'receber',
          descricao: `Recebimento pedido #${pedido.numero}`,
          valorTotal: Number(totalLiquido.toFixed(2)),
          valorRecebido,
          status: pagamentoConfirmado ? 'parcial' : i % 3 === 0 ? 'atrasado' : 'pendente',
          dataVencimento: new Date(Date.now() + (i - 2) * 86400000),
        },
        select: { id: true },
      })
      contasReceberCriadas++

      if (valorRecebido > 0) {
        const observacoes = `Recebimento inicial pedido #${pedido.numero}`
        const movimentoExistente = await prisma.movimentoFinanceiro.findFirst({
          where: {
            contaReceberId: conta.id,
            observacoes,
          },
          select: { id: true },
        })
        if (!movimentoExistente) {
          await prisma.movimentoFinanceiro.create({
            data: {
              userId,
              contaReceberId: conta.id,
              tipo: 'entrada',
              valor: valorRecebido,
              observacoes,
            },
          })
        }
        movimentosFinanceirosCriados++
      }
    }

    // Conta adicional para testes de saida/pagar
    const contaPagarDesc = 'Despesa operacional mensal'
    const contaPagarExistente = await prisma.contaReceber.findFirst({
      where: {
        userId,
        descricao: contaPagarDesc,
        pedidoId: null,
        tipo: 'pagar',
      },
      select: { id: true },
    })

    const contaPagar = contaPagarExistente
      ? await prisma.contaReceber.update({
          where: { id: contaPagarExistente.id },
          data: {
            userId,
            tipo: 'pagar',
            descricao: contaPagarDesc,
            valorTotal: 980,
            valorRecebido: 0,
            autoDebito: true,
            status: 'atrasado',
            dataVencimento: new Date(Date.now() - 4 * 86400000),
          },
          select: { id: true },
        })
      : await prisma.contaReceber.create({
          data: {
            userId,
            tipo: 'pagar',
            descricao: contaPagarDesc,
            valorTotal: 980,
            valorRecebido: 0,
            autoDebito: true,
            status: 'atrasado',
            dataVencimento: new Date(Date.now() - 4 * 86400000),
            recorrenteMensal: true,
            recorrenciaAtiva: true,
            recorrenciaDiaVencimento: new Date().getDate(),
            grupoParcelaId: `REC-${randomUUID()}`,
          },
          select: { id: true },
        })
    contasReceberCriadas++

    const movimentoSaidaExistente = await prisma.movimentoFinanceiro.findFirst({
      where: {
        contaReceberId: contaPagar.id,
        observacoes: 'Debito automatico simulado',
      },
      select: { id: true },
    })
    if (!movimentoSaidaExistente) {
      await prisma.movimentoFinanceiro.create({
        data: {
          userId,
          contaReceberId: contaPagar.id,
          tipo: 'saida',
          valor: 980,
          observacoes: 'Debito automatico simulado',
        },
      })
      movimentosFinanceirosCriados++
    }

    // Criar metas e snapshots
    console.log('?? Criando metas e snapshots...')
    const metasSeed = [
      {
        title: 'Meta clientes cadastrados',
        metricType: GoalMetricType.CLIENTES_CADASTRADOS,
        periodType: GoalPeriodType.MONTHLY,
        baseTarget: 36,
        weekDays: [] as number[],
        progressRange: [45, 78] as [number, number],
      },
      {
        title: 'Meta clientes contatados',
        metricType: GoalMetricType.CLIENTES_CONTATADOS,
        periodType: GoalPeriodType.WEEKLY,
        baseTarget: 34,
        weekDays: [1, 2, 3, 4, 5],
        progressRange: [42, 75] as [number, number],
      },
      {
        title: 'Meta propostas',
        metricType: GoalMetricType.PROPOSTAS,
        periodType: GoalPeriodType.MONTHLY,
        baseTarget: 20,
        weekDays: [] as number[],
        progressRange: [50, 82] as [number, number],
      },
      {
        title: 'Meta vendas',
        metricType: GoalMetricType.VENDAS,
        periodType: GoalPeriodType.MONTHLY,
        baseTarget: 10,
        weekDays: [] as number[],
        progressRange: [40, 72] as [number, number],
      },
      {
        title: 'Meta qualificacao',
        metricType: GoalMetricType.QUALIFICACAO,
        periodType: GoalPeriodType.WEEKLY,
        baseTarget: 14,
        weekDays: [1, 2, 3, 4, 5],
        progressRange: [44, 79] as [number, number],
      },
      {
        title: 'Meta prospeccao',
        metricType: GoalMetricType.PROSPECCAO,
        periodType: GoalPeriodType.DAILY,
        baseTarget: 12,
        weekDays: [],
        progressRange: [38, 70] as [number, number],
      },
      {
        title: 'Meta faturamento',
        metricType: GoalMetricType.FATURAMENTO,
        periodType: GoalPeriodType.CUSTOM,
        baseTarget: 550000,
        weekDays: [] as number[],
        progressRange: [40, 74] as [number, number],
      },
    ]

    const getMetricCurrent = (metricType: GoalMetricType) => {
      if (metricType === GoalMetricType.CLIENTES_CADASTRADOS) return clientesCriados.length
      if (metricType === GoalMetricType.CLIENTES_CONTATADOS) return contatosCriados
      if (metricType === GoalMetricType.PROPOSTAS) return oportunidadesCriadas.filter((o) => o.status === 'orcamento').length
      if (metricType === GoalMetricType.VENDAS) return oportunidadesCriadas.filter((o) => o.status === 'fechada').length
      if (metricType === GoalMetricType.QUALIFICACAO) return oportunidadesCriadas.filter((o) => o.status === 'em_potencial').length
      if (metricType === GoalMetricType.PROSPECCAO) return oportunidadesCriadas.filter((o) => o.status === 'sem_contato').length
      if (metricType === GoalMetricType.FATURAMENTO) {
        return Math.round(
          oportunidadesCriadas
            .filter((o) => o.status === 'fechada')
            .reduce((acc, o) => acc + (o.valor ?? 0), 0)
        )
      }
      return 0
    }

    let metasCriadas = 0
    let metasSnapshotsCriados = 0

    for (const metaData of metasSeed) {
      const existente = await prisma.goal.findFirst({
        where: {
          userId,
          title: metaData.title,
        },
        select: { id: true },
      })

      const rawCurrent = getMetricCurrent(metaData.metricType)
      const [minProgress, maxProgress] = metaData.progressRange
      const desiredProgress = rawCurrent > 0 ? randomInt(minProgress, maxProgress) : 0
      const target =
        rawCurrent > 0
          ? Math.max(metaData.baseTarget, Math.ceil((rawCurrent * 100) / Math.max(1, desiredProgress)))
          : metaData.baseTarget

      const startCustom = metaData.periodType === GoalPeriodType.CUSTOM ? new Date(Date.now() - 30 * 86400000) : null
      const endCustom = metaData.periodType === GoalPeriodType.CUSTOM ? new Date(Date.now() + 30 * 86400000) : null

      const goal = existente
        ? await prisma.goal.update({
            where: { id: existente.id },
            data: {
              metricType: metaData.metricType,
              periodType: metaData.periodType,
              target,
              startDate: startCustom,
              endDate: endCustom,
              weekDays: metaData.weekDays,
            },
          })
        : await prisma.goal.create({
            data: {
              userId,
              title: metaData.title,
              metricType: metaData.metricType,
              periodType: metaData.periodType,
              target,
              startDate: startCustom,
              endDate: endCustom,
              weekDays: metaData.weekDays,
            },
          })

      metasCriadas++

      const current = rawCurrent

      let periodStart = new Date()
      periodStart.setHours(0, 0, 0, 0)
      let periodEnd = new Date()
      periodEnd.setHours(23, 59, 59, 999)

      if (metaData.periodType === GoalPeriodType.WEEKLY) {
        const weekStart = new Date()
        const day = weekStart.getDay()
        const diffToMonday = day === 0 ? 6 : day - 1
        weekStart.setDate(weekStart.getDate() - diffToMonday)
        weekStart.setHours(0, 0, 0, 0)
        periodStart = weekStart
        periodEnd = new Date(weekStart)
        periodEnd.setDate(periodEnd.getDate() + 6)
        periodEnd.setHours(23, 59, 59, 999)
      } else if (metaData.periodType === GoalPeriodType.MONTHLY) {
        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)
        periodStart = monthStart
        periodEnd = new Date(monthStart)
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        periodEnd.setDate(0)
        periodEnd.setHours(23, 59, 59, 999)
      } else if (metaData.periodType === GoalPeriodType.CUSTOM) {
        periodStart = startCustom ?? periodStart
        periodEnd = endCustom ?? periodEnd
      }

      const progress = current === 0 ? 0 : Math.min(99, Math.round((current / Math.max(1, goal.target)) * 100))
      await prisma.goalSnapshot.upsert({
        where: {
          goalId_periodStart_periodEnd: {
            goalId: goal.id,
            periodStart,
            periodEnd,
          },
        },
        update: {
          current,
          target: goal.target,
          progress,
        },
        create: {
          goalId: goal.id,
          periodStart,
          periodEnd,
          current,
          target: goal.target,
          progress,
        },
      })
      metasSnapshotsCriados++
    }

    // Configurar meta de contatos diarios
    const metaContatoConfig = await prisma.metaContatoConfig.upsert({
      where: { userId },
      update: { metaDiaria: 35, ativo: true },
      create: { userId, metaDiaria: 35, ativo: true },
      select: { id: true },
    })

    const diasEsquecidos = [
      toYmd(new Date(Date.now() - 2 * 86400000)),
      toYmd(new Date(Date.now() - 5 * 86400000)),
      toYmd(new Date(Date.now() - 8 * 86400000)),
    ]

    let metaContatoDiasCriados = 0
    for (const data of diasEsquecidos) {
      await prisma.metaContatoDiaEsquecido.upsert({
        where: {
          configId_data: {
            configId: metaContatoConfig.id,
            data,
          },
        },
        update: {},
        create: {
          configId: metaContatoConfig.id,
          data,
        },
      })
      metaContatoDiasCriados++
    }

    // Criar templates e tentativas de follow-up
    console.log('?? Criando follow-ups...')
    const canais = ['whatsapp', 'email', 'ligacao', 'reuniao']
    const templates = [] as Array<{ id: string; canal: string; mensagem: string }>
    let followUpTemplatesCriados = 0

    for (const etapa of statusOportunidades) {
      for (const canal of canais) {
        const titulo = `Template ${etapa} ${canal}`
        const mensagem = `Mensagem ${canal} para etapa ${etapa}`
        const existente = await prisma.followUpTemplate.findFirst({
          where: { userId, titulo },
          select: { id: true },
        })

        const template = existente
          ? await prisma.followUpTemplate.update({
              where: { id: existente.id },
              data: { etapa, canal, titulo, mensagem, ativo: true },
              select: { id: true, canal: true, mensagem: true },
            })
          : await prisma.followUpTemplate.create({
              data: { userId, etapa, canal, titulo, mensagem, ativo: true },
              select: { id: true, canal: true, mensagem: true },
            })
        templates.push(template)
        followUpTemplatesCriados++
      }
    }

    let followUpAttemptsCriados = 0
    for (let i = 0; i < MOCK_FOLLOW_UP_ATTEMPTS_TOTAL; i++) {
      const oportunidade = oportunidadesCriadas[i % oportunidadesCriadas.length]
      const template = templates[i % templates.length]
      const mensagem = `${template.mensagem} [${String(i + 1).padStart(2, '0')}]`
      const existente = await prisma.followUpAttempt.findFirst({
        where: {
          userId,
          oportunidadeId: oportunidade.id,
          mensagem,
        },
        select: { id: true },
      })

      if (existente) {
        await prisma.followUpAttempt.update({
          where: { id: existente.id },
          data: {
            templateId: template.id,
            canal: template.canal,
            mensagem,
            resultado: i % 3 === 0 ? 'Retorno positivo' : i % 3 === 1 ? 'Sem resposta' : 'Reagendado',
          },
        })
      } else {
        await prisma.followUpAttempt.create({
          data: {
            userId,
            oportunidadeId: oportunidade.id,
            templateId: template.id,
            canal: template.canal,
            mensagem,
            resultado: i % 3 === 0 ? 'Retorno positivo' : i % 3 === 1 ? 'Sem resposta' : 'Reagendado',
          },
        })
      }
      followUpAttemptsCriados++
    }

    const resumo = {
      clientes: clientesCriados.length,
      contatos: contatosCriados,
      oportunidades: oportunidadesCriadas.length,
      tarefas: tarefasCriadas,
      motivosPerda: motivosPerdaCriados,
      prospectos: prospectosCriados,
      prospectoAgendamentos: agendamentosCriados,
      produtosServicos: produtosCriados.length,
      pedidos: pedidosCriados,
      pedidoItens: pedidoItensCriados,
      contasReceber: contasReceberCriadas,
      movimentosFinanceiros: movimentosFinanceirosCriados,
      metas: metasCriadas,
      metasSnapshots: metasSnapshotsCriados,
      metaContatoConfig: 1,
      metaContatoDias: metaContatoDiasCriados,
      followUpTemplates: followUpTemplatesCriados,
      followUpAttempts: followUpAttemptsCriados,
    }

    console.log('\n? Seed concluído com sucesso!')
    console.log(`?? Resumo:`, resumo)

    return NextResponse.json({
      success: true,
      message: 'Dados de demonstracao completos criados com sucesso!',
      resumo,
    })
  } catch (error) {
    console.error('? Erro ao executar seed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar dados de demonstracao',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

