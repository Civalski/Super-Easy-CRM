export type ContractDocKind = 'contrato' | 'proposta'

export interface PdfParty {
  nome?: string
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

export interface PdfClause {
  titulo: string
  conteudo: string
}

export interface PdfTextBlock {
  kind: 'heading' | 'paragraph' | 'bullet'
  text: string
}

export interface PdfTopicSection {
  title: string
  blocks: PdfTextBlock[]
}

export interface ContractPdfInput {
  id: string
  numero: number
  titulo: string
  tipo: string
  preambulo?: string | null
  clausulas: PdfClause[]
  dadosPartes: Record<string, PdfParty>
  dataAssinatura?: Date | string | null
  localAssinatura?: string | null
  observacoes?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  cliente?: {
    nome?: string | null
    documento?: string | null
    email?: string | null
    telefone?: string | null
    endereco?: string | null
    cidade?: string | null
    estado?: string | null
    cep?: string | null
    empresa?: string | null
  } | null
}

export interface ContractPdfConfigInput {
  nomeEmpresa?: string | null
  nomeVendedor?: string | null
  telefone?: string | null
  email?: string | null
  site?: string | null
  rodape?: string | null
  corPrimaria?: string | null
  logoBase64?: string | null
}

export interface ContractPdfUserInput {
  name?: string | null
  username?: string | null
}

export interface ContractPdfViewModel {
  kind: ContractDocKind
  documentLabel: 'Contrato' | 'Proposta'
  numberLabel: string
  title: string
  createdAtLabel: string
  clientLabel: string
  companyName: string
  contactEmail?: string
  contactPhone?: string
  issuerMeta: string[]
  footerText?: string
  signatureLine: string
  localAndDateLabel: string
  logoSrc?: string
  primaryHex: string
  contractSections: {
    preambulo: PdfTextBlock[]
    parties: Array<{ label: string; lines: string[] }>
    clauses: PdfClause[]
    observacoes: PdfTextBlock[]
  }
  proposalSections: PdfTopicSection[]
}
