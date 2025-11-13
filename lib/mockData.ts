// Dados mockados para desenvolvimento do frontend

export interface MockCliente {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    oportunidades: number
    contatos: number
  }
}

export interface MockOportunidade {
  id: string
  titulo: string
  descricao: string | null
  valor: number | null
  status: string
  probabilidade: number
  dataFechamento: Date | null
  clienteId: string
  cliente: {
    nome: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface MockTarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  dataVencimento: Date | null
  clienteId: string | null
  oportunidadeId: string | null
  createdAt: Date
  updatedAt: Date
}

// Dados mockados
export const mockClientes: MockCliente[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@empresa.com',
    telefone: '(11) 98765-4321',
    empresa: 'Tech Solutions',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    _count: {
      oportunidades: 3,
      contatos: 2,
    },
  },
  {
    id: '2',
    nome: 'Maria Santos',
    email: 'maria.santos@startup.com',
    telefone: '(21) 99876-5432',
    empresa: 'Startup Inovadora',
    endereco: 'Av. Atlântica, 456',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '22000-000',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    _count: {
      oportunidades: 2,
      contatos: 1,
    },
  },
  {
    id: '3',
    nome: 'Pedro Oliveira',
    email: 'pedro@consultoria.com',
    telefone: '(31) 91234-5678',
    empresa: 'Consultoria Premium',
    endereco: 'Rua da Consolação, 789',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30123-456',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
    _count: {
      oportunidades: 1,
      contatos: 3,
    },
  },
  {
    id: '4',
    nome: 'Ana Costa',
    email: 'ana.costa@tech.com',
    telefone: '(41) 98765-4321',
    empresa: 'Tech Corp',
    endereco: 'Av. Paulista, 1000',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80000-000',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
    _count: {
      oportunidades: 4,
      contatos: 2,
    },
  },
]

export const mockOportunidades: MockOportunidade[] = [
  {
    id: '1',
    titulo: 'Implementação de Sistema ERP',
    descricao: 'Sistema completo de gestão empresarial para Tech Solutions',
    valor: 150000,
    status: 'prospeccao',
    probabilidade: 30,
    dataFechamento: new Date('2024-03-01'),
    clienteId: '1',
    cliente: {
      nome: 'João Silva',
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    titulo: 'Desenvolvimento de App Mobile',
    descricao: 'Aplicativo mobile para gestão de vendas',
    valor: 80000,
    status: 'qualificacao',
    probabilidade: 50,
    dataFechamento: new Date('2024-02-15'),
    clienteId: '2',
    cliente: {
      nome: 'Maria Santos',
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    titulo: 'Consultoria em Transformação Digital',
    descricao: 'Projeto de transformação digital completo',
    valor: 120000,
    status: 'proposta',
    probabilidade: 70,
    dataFechamento: new Date('2024-02-20'),
    clienteId: '3',
    cliente: {
      nome: 'Pedro Oliveira',
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    titulo: 'Sistema de CRM Personalizado',
    descricao: 'CRM customizado para Tech Corp',
    valor: 95000,
    status: 'negociacao',
    probabilidade: 85,
    dataFechamento: new Date('2024-02-10'),
    clienteId: '4',
    cliente: {
      nome: 'Ana Costa',
    },
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '5',
    titulo: 'Plataforma E-commerce',
    descricao: 'Plataforma completa de e-commerce',
    valor: 200000,
    status: 'fechada',
    probabilidade: 100,
    dataFechamento: new Date('2024-01-25'),
    clienteId: '1',
    cliente: {
      nome: 'João Silva',
    },
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: '6',
    titulo: 'Sistema de BI e Analytics',
    descricao: 'Sistema de business intelligence',
    valor: 75000,
    status: 'perdida',
    probabilidade: 0,
    dataFechamento: null,
    clienteId: '2',
    cliente: {
      nome: 'Maria Santos',
    },
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-10'),
  },
]

export const mockTarefas: MockTarefa[] = [
  {
    id: '1',
    titulo: 'Reunião com cliente João Silva',
    descricao: 'Apresentar proposta do sistema ERP',
    status: 'pendente',
    prioridade: 'alta',
    dataVencimento: new Date('2024-01-25'),
    clienteId: '1',
    oportunidadeId: '1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    titulo: 'Enviar contrato para Maria Santos',
    descricao: 'Enviar contrato revisado do app mobile',
    status: 'em_andamento',
    prioridade: 'media',
    dataVencimento: new Date('2024-01-24'),
    clienteId: '2',
    oportunidadeId: '2',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '3',
    titulo: 'Follow-up com Pedro Oliveira',
    descricao: 'Verificar status da proposta',
    status: 'concluida',
    prioridade: 'baixa',
    dataVencimento: new Date('2024-01-22'),
    clienteId: '3',
    oportunidadeId: '3',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-21'),
  },
]

// Funções helper para simular queries do Prisma
export const getClientes = async (): Promise<MockCliente[]> => {
  // Simula delay de API
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockClientes
}

export const getOportunidades = async (): Promise<MockOportunidade[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockOportunidades
}

export const getTarefas = async (): Promise<MockTarefa[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockTarefas
}

export const getDashboardStats = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  const clientesCount = mockClientes.length
  const oportunidadesCount = mockOportunidades.length
  const tarefasCount = mockTarefas.length
  
  const oportunidadesPorStatus = mockOportunidades.reduce((acc, opp) => {
    acc[opp.status] = (acc[opp.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const valorTotal = mockOportunidades
    .filter((opp) => opp.status !== 'perdida')
    .reduce((sum, opp) => sum + (opp.valor || 0), 0)
  
  return {
    clientesCount,
    oportunidadesCount,
    tarefasCount,
    valorTotal,
    oportunidadesPorStatus: Object.entries(oportunidadesPorStatus).map(([status, count]) => ({
      status,
      _count: count,
    })),
  }
}

