const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-'
  return dateTimeFmt.format(new Date(date))
}

export function formatOportunidadeStatus(status: string | null | undefined): string {
  const map: Record<string, string> = {
    orcamento: 'Orcamento', pedido: 'Pedido', fechada: 'Fechada',
    perdida: 'Perdida', sem_contato: 'Sem contato', em_potencial: 'Em potencial',
  }
  return map[status || ''] || status || '-'
}

export function formatEntregaStatus(status: string | null | undefined): string {
  const map: Record<string, string> = {
    pendente: 'Pendente', em_preparacao: 'Em preparacao',
    enviado: 'Enviado', entregue: 'Entregue',
  }
  return map[status || ''] || status || '-'
}

export function getBadgeClass(type: 'success' | 'warning' | 'danger' | 'info' | 'neutral'): string {
  const map: Record<string, string> = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  }
  return map[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
}

export function formatCapitalSocial(value: string | null): string {
  if (!value) return '-'
  const clean = String(value).replace(/\./g, '').replace(',', '.')
  const num = Number(clean)
  if (isNaN(num)) return `R$ ${value}`
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const INITIAL_FORM_DATA = {
  nome: '', email: '', telefone: '', empresa: '', endereco: '', cidade: '', estado: '', cep: '',
  cargo: '', documento: '', website: '', dataNascimento: '', observacoes: '', camposPersonalizados: [] as { label: string; value: string }[],
}

export const INPUT_CLASS = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500'
export const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
