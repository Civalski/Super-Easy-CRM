export const CAMPOS_FIXOS_PARTE = [
  'nome',
  'rg',
  'documento',
  'endereco',
  'cidade',
  'estado',
  'cep',
  'email',
  'telefone',
] as const

export const RIGIDEZ_OPCOES = [
  { value: 'flexivel', label: 'Flexível', descricao: 'Linguagem mais acessível e adaptável' },
  { value: 'moderado', label: 'Moderado', descricao: 'Equilíbrio entre formalidade e clareza' },
  { value: 'rigoroso', label: 'Rigoroso', descricao: 'Linguagem jurídica formal e técnica' },
] as const

/** Propostas (`tipo` proposta) usam fluxo dedicado em `/propostas`. */
export const TIPO_PROPOSTA_SERVICOS = { value: 'proposta', label: 'Proposta de Serviços' } as const

/** Tipos exibidos ao criar/editar contrato (sem proposta comercial). */
export const TIPOS_CONTRATO = [
  { value: 'geral', label: 'Contrato Geral' },
  { value: 'prestacao_servicos', label: 'Prestação de Serviços' },
  { value: 'compra_venda', label: 'Compra e Venda' },
  { value: 'locacao', label: 'Locação' },
  { value: 'parceria', label: 'Parceria' },
  { value: 'confidencialidade', label: 'Confidencialidade (NDA)' },
  { value: 'trabalho', label: 'Contrato de Trabalho' },
  { value: 'outro', label: 'Outro' },
] as const

export function getTipoDocumentoLabel(value: string): string {
  if (value === TIPO_PROPOSTA_SERVICOS.value) return TIPO_PROPOSTA_SERVICOS.label
  const found = TIPOS_CONTRATO.find((t) => t.value === value)
  return found?.label ?? value
}
