export interface Clausula {
  titulo: string
  conteudo: string
}

export interface DadosParte {
  nome: string
  rg?: string
  documento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  email?: string
  telefone?: string
  [key: string]: string | undefined
}

export interface DadosPartes {
  contratante?: DadosParte
  contratado?: DadosParte
  [key: string]: DadosParte | undefined
}

export interface Contrato {
  id: string
  numero: number
  userId: string
  titulo: string
  status: 'em_andamento' | 'aprovado_assinado' | 'rejeitado'
  tipo: string
  descricao?: string | null
  preambulo?: string | null
  clausulas: Clausula[]
  dadosPartes: DadosPartes
  dataInicio?: Date | string | null
  dataFim?: Date | string | null
  dataAssinatura?: Date | string | null
  localAssinatura?: string | null
  observacoes?: string | null
  clienteId?: string | null
  oportunidadeId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  cliente?: { id: string; nome: string } | null
  oportunidade?: { id: string; titulo: string } | null
}

export interface ContratoFormValues {
  titulo: string
  tipo: string
  descricao: string
  preambulo: string
  clausulas: Clausula[]
  dadosPartes: DadosPartes
  dataInicio: string
  dataFim: string
  dataAssinatura: string
  localAssinatura: string
  observacoes: string
  clienteId: string
  oportunidadeId: string
}

export interface ContratoFormState extends Omit<ContratoFormValues, 'clienteId' | 'oportunidadeId'> {}

export interface ContratoCustomField {
  key: string
  value: string
}

export interface CreateContratoModalProps {
  open: boolean
  initialMode?: 'manual' | 'ia' | null
  /** `proposta`: fluxo de proposta comercial (sem cláusulas), tipo fixo. */
  documentVariant?: 'contrato' | 'proposta'
  onClose: () => void
  onCreated: () => void
  onSave: (values: ContratoFormValues) => Promise<unknown>
  saving: boolean
}
