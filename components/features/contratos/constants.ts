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

export const TIPOS_CONTRATO = [
  { value: 'geral', label: 'Contrato Geral' },
  { value: 'proposta', label: 'Proposta de Serviços' },
  { value: 'prestacao_servicos', label: 'Prestação de Serviços' },
  { value: 'compra_venda', label: 'Compra e Venda' },
  { value: 'locacao', label: 'Locação' },
  { value: 'parceria', label: 'Parceria' },
  { value: 'confidencialidade', label: 'Confidencialidade (NDA)' },
  { value: 'trabalho', label: 'Contrato de Trabalho' },
  { value: 'outro', label: 'Outro' },
] as const
