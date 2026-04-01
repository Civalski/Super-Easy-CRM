import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Pencil,
  Trash2,
  AlertCircle,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Target,
} from '@/lib/icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Button from '@/components/common/Button'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import type { DashboardActivity, DashboardActivityDetails } from '@/types/dashboard'
import { getProbabilityBadgeClass, getProbabilityLabel } from '@/lib/domain/probabilidade'
import { useDashboardInvalidation } from '@/lib/hooks/useDashboardInvalidation'

interface ActivityModalProps {
  isOpen: boolean
  activity: DashboardActivity | null
  type: 'tarefa' | 'oportunidade' | 'cliente' | 'meta'
  onClose: () => void
  onUpdate: () => void
}

export default function ActivityModal({
  isOpen,
  activity,
  type,
  onClose,
  onUpdate,
}: ActivityModalProps) {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { invalidateForActivityType } = useDashboardInvalidation()
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen || !activity) return null

  const data: DashboardActivityDetails = activity.details || {
    id: activity.id,
    titulo: activity.title,
    descricao: activity.description,
  }

  const headerTitle =
    data.titulo?.trim() || data.nome?.trim() || activity.title?.trim() || 'Atividade'

  const clientLabel = data.cliente?.nome?.trim() || 'Sem cliente vinculado'

  const handleComplete = async () => {
    try {
      setIsProcessing(true)
      const response = await fetch(`/api/tarefas/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluida' }),
      })

      if (response.ok) {
        await invalidateForActivityType('tarefa')
        toast.success('Tarefa concluida com sucesso!')
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Erro ao finalizar tarefa:', error)
      toast.error('Erro!', { description: 'Nao foi possivel finalizar a tarefa.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    const itemTypeLabel =
      type === 'tarefa' ? 'tarefa' : type === 'oportunidade' ? 'orcamento' : type === 'meta' ? 'meta' : 'cliente'

    const ok = await confirm({
      title: `Excluir ${itemTypeLabel}?`,
      description: 'Esta acao nao podera ser desfeita.',
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })

    if (!ok) return

    try {
      setIsProcessing(true)
      let endpoint = ''
      if (type === 'tarefa') endpoint = `/api/tarefas/${data.id}`
      else if (type === 'oportunidade') endpoint = `/api/oportunidades/${data.id}`
      else if (type === 'cliente') endpoint = `/api/clientes/${data.id}`
      else if (type === 'meta') endpoint = `/api/metas/${data.id}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (response.ok) {
        await invalidateForActivityType(type)
        toast.success('Excluido!', { description: 'O item foi excluido com sucesso.' })
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      toast.error('Erro!', { description: 'Ocorreu um erro ao excluir o item.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEdit = () => {
    onClose()
    if (type === 'tarefa') router.push(`/tarefas?edit=${data.id}`)
    else if (type === 'oportunidade') router.push(`/oportunidades/${data.id}/editar`)
    else if (type === 'cliente') router.push(`/clientes/${data.id}`)
    else if (type === 'meta') router.push(`/metas`)
  }

  const renderTaskContent = () => {
    const isOverdue = data.dataVencimento && new Date(data.dataVencimento) < new Date()
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'alta':
          return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400'
        case 'media':
          return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400'
        case 'baixa':
          return 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400'
        default:
          return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
              data.status === 'concluida'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {data.status === 'concluida' ? 'Concluida' : 'Pendente'}
          </span>
          {data.prioridade && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getPriorityColor(
                data.prioridade
              )}`}
            >
              {data.prioridade}
            </span>
          )}
          {isOverdue && data.status !== 'concluida' && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
              <AlertCircle size={12} />
              Atrasada
            </span>
          )}
        </div>

        {data.descricao && (
          <div className="flex gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
            <FileText size={18} className="mt-1 text-gray-400 shrink-0" />
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.descricao}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Vencimento
            </span>
            <p
              className={`text-sm font-medium ${
                isOverdue && data.status !== 'concluida'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {data.dataVencimento
                ? format(new Date(data.dataVencimento), "dd 'de' MMMM, yyyy", {
                    locale: ptBR,
                  })
                : 'Sem data'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderOpportunityContent = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
          Orcamento
        </span>
        {data.probabilidade !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProbabilityBadgeClass(
              data.probabilidade
            )}`}
          >
            {getProbabilityLabel(data.probabilidade)}
          </span>
        )}
      </div>

      {data.descricao && (
        <div className="flex gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
          <FileText size={18} className="mt-1 text-gray-400 shrink-0" />
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.descricao}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign size={12} /> Valor
          </span>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {data.valor
              ? `R$ ${data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Nao informado'}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={12} /> Fechamento Previsto
          </span>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.dataFechamento
              ? format(new Date(data.dataFechamento), 'dd/MM/yyyy', { locale: ptBR })
              : '-'}
          </p>
        </div>
      </div>
    </div>
  )

  const metricLabels: Record<string, string> = {
    CLIENTES_CONTATADOS: 'Clientes contatados',
    PROPOSTAS: 'Orçamentos',
    CLIENTES_CADASTRADOS: 'Clientes cadastrados',
    VENDAS: 'Vendas',
    QUALIFICACAO: 'Em potencial',
    NEGOCIACAO: 'Negociação',
    PROSPECCAO: 'Prospecção',
    FATURAMENTO: 'Faturamento',
  }
  const periodLabels: Record<string, string> = {
    DAILY: 'Diária',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensal',
    CUSTOM: 'Personalizada',
  }

  const renderMetaContent = () => {
    const metricType = (activity?.details as { metricType?: string })?.metricType
    const periodType = (activity?.details as { periodType?: string })?.periodType
    const target = (activity?.details as { target?: number })?.target
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            Meta
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Target size={12} /> Tipo
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {metricType ? metricLabels[metricType] || metricType : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Período
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {periodType ? periodLabels[periodType] || periodType : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign size={12} /> Meta
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{target ?? '-'}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderClientContent = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
          Cliente
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.empresa && (
          <div className="space-y-1 col-span-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 size={12} /> Empresa
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{data.empresa}</p>
          </div>
        )}
        {data.email && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Mail size={12} /> Email
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {data.email}
            </p>
          </div>
        )}
        {data.telefone && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Phone size={12} /> Telefone
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{data.telefone}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="crm-card w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
              {headerTitle}
            </h2>
            {(data.cliente || data.empresa) && type !== 'cliente' && type !== 'meta' && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <User size={14} className="mr-1.5" />
                {clientLabel}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {type === 'tarefa' && renderTaskContent()}
          {type === 'oportunidade' && renderOpportunityContent()}
          {type === 'cliente' && renderClientContent()}
          {type === 'meta' && renderMetaContent()}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-100 dark:border-gray-700">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={isProcessing}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            <Trash2 size={16} className="mr-2" />
            Excluir
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            disabled={isProcessing}
            className="w-full sm:w-auto order-2"
          >
            <Pencil size={16} className="mr-2" />
            Editar
          </Button>

          {type === 'tarefa' && data.status !== 'concluida' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 order-1 sm:order-3"
            >
              <CheckCircle2 size={16} className="mr-2" />
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
