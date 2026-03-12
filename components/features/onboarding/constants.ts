import { Building2, User, Users } from '@/lib/icons'
import type { LucideIcon } from '@/lib/icons'

export const TIPO_PUBLICO_OPTIONS: Array<{
  value: 'B2B' | 'B2C' | 'ambos'
  label: string
  description: string
  icon: LucideIcon
}> = [
  { value: 'B2B', label: 'Outras empresas (B2B)', description: 'Atendo principalmente empresas e negócios', icon: Building2 },
  { value: 'B2C', label: 'Cliente final (B2C)', description: 'Atendo principalmente consumidores finais', icon: User },
  { value: 'ambos', label: 'Ambos', description: 'Atendo empresas e consumidores finais', icon: Users },
]

export const AREA_ATUACAO_SUGGESTIONS = [
  'Tecnologia e Software',
  'Construção e Obras',
  'Serviços Gerais',
  'Comércio e Varejo',
  'Indústria',
  'Consultoria',
  'Saúde',
  'Educação',
  'Alimentação',
  'Marketing e Publicidade',
  'Logística e Transporte',
  'Outro',
]

export const ONBOARDING_STEPS = [
  { id: 1, title: 'Sua empresa', subtitle: 'Conte um pouco sobre seu negócio' },
  { id: 2, title: 'Seu público', subtitle: 'Quem são seus clientes?' },
  { id: 3, title: 'Dados para PDFs', subtitle: 'Informações para orçamentos e pedidos' },
  { id: 4, title: 'Preferências', subtitle: 'Tema e posição do menu' },
] as const
