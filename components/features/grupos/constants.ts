import type { LucideIcon } from '@/lib/icons'
import { FileText, Layers, MessageCircle, Target } from '@/lib/icons'

export interface FunilTabConfig {
  label: string
  value: 'sem_contato' | 'contatado' | 'em_potencial' | 'aguardando_orcamento'
  icon: LucideIcon
}

export const FUNIL_TABS: FunilTabConfig[] = [
  { label: 'Sem contato', value: 'sem_contato', icon: Target },
  { label: 'Contatado', value: 'contatado', icon: MessageCircle },
  { label: 'Em potencial', value: 'em_potencial', icon: Layers },
  { label: 'Aguardando orçamento', value: 'aguardando_orcamento', icon: FileText },
]

export type FunilTabValue = FunilTabConfig['value']

export const FUNIL_GUIDE_LOCK_MESSAGE =
  'Durante a apresentação, avance pelas etapas usando os botões do onboarding.'
