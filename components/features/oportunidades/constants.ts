import { FileText, DollarSign, X } from '@/lib/icons'
import type { StatusConfig } from './types'

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  orcamento: { label: 'Orçamento', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: FileText },
  fechada: { label: 'Fechada', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: DollarSign },
  perdida: { label: 'Perdida', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: X },
}

export const LIST_PAGE_SIZE = 20
export const HISTORICO_PAGE_SIZE = 10

export const FIELD_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

export const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

export const CANAL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'ligacao', label: 'Ligacao' },
  { value: 'reuniao', label: 'Reuniao' },
  { value: 'outro', label: 'Outro' },
]

export const FORMA_PAGAMENTO_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartao' },
  { value: 'parcelado', label: 'Parcelado' },
]
