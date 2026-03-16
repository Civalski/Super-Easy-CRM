import { GoalMetricType, GoalPeriodType } from '@prisma/client'

export const DEMO_CLIENTS = [
  {
    nome: 'Ana Martins',
    email: 'ana.martins@aurorastudio.com.br',
    telefone: '(11) 99888-1101',
    empresa: 'Aurora Studio',
    cidade: 'Sao Paulo',
    estado: 'SP',
    observacoes: 'Cliente demo com foco em implantacao e suporte premium.',
  },
  {
    nome: 'Carlos Nogueira',
    email: 'carlos@nogueiratech.com.br',
    telefone: '(21) 99777-2202',
    empresa: 'Nogueira Tech',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    observacoes: 'Conta enterprise em fase de expansao comercial.',
  },
  {
    nome: 'Renata Lima',
    email: 'renata@limaconsultoria.com.br',
    telefone: '(31) 99666-3303',
    empresa: 'Lima Consultoria',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    observacoes: 'Cliente de treinamento e renovacao recorrente.',
  },
  {
    nome: 'Felipe Castro',
    email: 'felipe@castroengenharia.com.br',
    telefone: '(41) 99555-4404',
    empresa: 'Castro Engenharia',
    cidade: 'Curitiba',
    estado: 'PR',
    observacoes: 'Conta com projeto de dashboard executivo.',
  },
] as const

export const DEMO_CONTACTS = [
  { nome: 'Marina Lopes', email: 'marina@aurorastudio.com.br', telefone: '(11) 98800-1200', cargo: 'Diretora operacional', clienteIndex: 0 },
  { nome: 'Bruno Prado', email: 'bruno@nogueiratech.com.br', telefone: '(21) 98800-2200', cargo: 'Head comercial', clienteIndex: 1 },
  { nome: 'Julia Teles', email: 'julia@limaconsultoria.com.br', telefone: '(31) 98800-3200', cargo: 'Coordenadora de projetos', clienteIndex: 2 },
  { nome: 'Paulo Reis', email: 'paulo@castroengenharia.com.br', telefone: '(41) 98800-4200', cargo: 'Gerente de TI', clienteIndex: 3 },
] as const

export const DEMO_PROSPECTS = [
  {
    razaoSocial: 'Vila Norte Comercio',
    nomeFantasia: 'Vila Norte',
    cnpj: '11111111000101',
    municipio: 'Sao Paulo',
    uf: 'SP',
    telefone1: '(11) 97400-1000',
    email: 'contato@vilanorte.com.br',
    status: 'novo',
  },
  {
    razaoSocial: 'Casa Prisma Eventos',
    nomeFantasia: 'Casa Prisma',
    cnpj: '22222222000102',
    municipio: 'Campinas',
    uf: 'SP',
    telefone1: '(19) 97400-2000',
    email: 'oi@casaprisma.com.br',
    status: 'em_contato',
  },
  {
    razaoSocial: 'Nova Rota Logistica',
    nomeFantasia: 'Nova Rota',
    cnpj: '33333333000103',
    municipio: 'Curitiba',
    uf: 'PR',
    telefone1: '(41) 97400-3000',
    email: 'comercial@novarota.com.br',
    status: 'qualificado',
  },
  {
    razaoSocial: 'Ativa Components',
    nomeFantasia: 'Ativa',
    cnpj: '44444444000104',
    municipio: 'Contagem',
    uf: 'MG',
    telefone1: '(31) 97400-4000',
    email: 'vendas@ativacomponents.com.br',
    status: 'lead_frio',
  },
  {
    razaoSocial: 'Matriz Delta Servicos',
    nomeFantasia: 'Delta Servicos',
    cnpj: '55555555000105',
    municipio: 'Rio de Janeiro',
    uf: 'RJ',
    telefone1: '(21) 97400-5000',
    email: 'atendimento@deltaservicos.com.br',
    status: 'aguardando_orcamento',
  },
] as const

export const DEMO_PRODUCTS = [
  { nome: 'Plano de Implantacao', tipo: 'servico', precoPadrao: 4200, categoria: 'Implantacao' },
  { nome: 'Modulo de Automacao', tipo: 'produto', precoPadrao: 2800, categoria: 'Software' },
  { nome: 'Kit de Suporte Premium', tipo: 'servico', precoPadrao: 980, categoria: 'Suporte' },
  { nome: 'Dashboard Executivo', tipo: 'servico', precoPadrao: 3600, categoria: 'BI' },
] as const

export const DEMO_LOSS_REASONS = [
  'Preco acima do esperado',
  'Prazo de entrega do concorrente',
  'Projeto pausado internamente',
] as const

export const DEMO_GOALS = [
  { title: 'Meta clientes cadastrados', metricType: GoalMetricType.CLIENTES_CADASTRADOS, periodType: GoalPeriodType.MONTHLY, target: 12 },
  { title: 'Meta propostas do mes', metricType: GoalMetricType.PROPOSTAS, periodType: GoalPeriodType.MONTHLY, target: 8 },
  { title: 'Meta vendas do mes', metricType: GoalMetricType.VENDAS, periodType: GoalPeriodType.MONTHLY, target: 4 },
] as const
