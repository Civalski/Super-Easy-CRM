'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { formatCurrency, formatDate } from '@/lib/format'
import { getProbabilityLabel, getProbabilityBadgeClass } from '@/lib/domain/probabilidade'
import { toast } from '@/lib/toast'
import { CANAL_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from './constants'

interface VerOrcamentoDrawerProps {
  oportunidadeId: string | null
  onClose: () => void
}

interface OportunidadeData {
  id: string
  numero: number
  titulo: string
  descricao: string | null
  valor: number | null
  formaPagamento: string | null
  parcelas: number | null
  desconto: number | null
  probabilidade: number
  dataFechamento: string | null
  proximaAcaoEm: string | null
  canalProximaAcao: string | null
  responsavelProximaAcao: string | null
  lembreteProximaAcao: boolean
  status: string
  statusAnterior: string | null
  motivoPerda: string | null
  createdAt: string
  updatedAt: string
  cliente: { nome: string }
}

function getLabelByValue(options: { value: string; label: string }[], value: string | null): string {
  if (!value) return '-'
  const opt = options.find((o) => o.value === value)
  return opt?.label ?? value
}

export default function VerOrcamentoDrawer({ oportunidadeId, onClose }: VerOrcamentoDrawerProps) {
  const [data, setData] = useState<OportunidadeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!oportunidadeId) {
      setData(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    fetch(`/api/oportunidades/${oportunidadeId}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((d) => {
        if (active) setData(d)
      })
      .catch(() => {
        if (active) {
          toast.error('Erro', { description: 'Não foi possível carregar o orçamento.' })
          onClose()
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [oportunidadeId, onClose])

  if (!oportunidadeId) return null

  if (loading) {
    return (
      <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </SideCreateDrawer>
    )
  }

  if (!data) return null

  const orcLabel = data.numero != null ? `Orçamento #${data.numero}` : 'Orçamento'
  const isPerdida = data.status === 'perdida'

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{orcLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Identificação</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Título</span><br />{data.titulo || '-'}</p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Cliente</span><br />{data.cliente?.nome || '-'}</p>
              {data.descricao && (
                <p><span className="font-medium text-gray-500 dark:text-gray-400">Descrição</span><br />{data.descricao}</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Comercial</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Valor</span><br /><span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(data.valor)}</span></p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Forma de pagamento</span><br />{getLabelByValue(FORMA_PAGAMENTO_OPTIONS, data.formaPagamento)}</p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Desconto</span><br />{formatCurrency(data.desconto)}</p>
              {data.formaPagamento === 'parcelado' && data.parcelas && (
                <p><span className="font-medium text-gray-500 dark:text-gray-400">Parcelas</span><br />{data.parcelas}x</p>
              )}
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Probabilidade</span><br />
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getProbabilityBadgeClass(data.probabilidade)}`}>
                  {getProbabilityLabel(data.probabilidade)}
                </span>
              </p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Data prevista</span><br />{formatDate(data.dataFechamento)}</p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Próxima ação em</span><br />{formatDate(data.proximaAcaoEm)}</p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Canal</span><br />{getLabelByValue(CANAL_OPTIONS, data.canalProximaAcao)}</p>
              <p><span className="font-medium text-gray-500 dark:text-gray-400">Responsável</span><br />{data.responsavelProximaAcao || '-'}</p>
              <p className="col-span-2"><span className="font-medium text-gray-500 dark:text-gray-400">Lembrete próxima ação</span><br />{data.lembreteProximaAcao ? 'Sim' : 'Não'}</p>
            </div>
          </section>

          <section className="text-sm text-gray-500 dark:text-gray-400">
            <p><span className="font-medium">Criado em</span> {formatDate(data.createdAt)}</p>
            <p><span className="font-medium">Atualizado em</span> {formatDate(data.updatedAt)}</p>
          </section>

          {isPerdida && (data.motivoPerda || data.statusAnterior) && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cancelamento</h3>
              <div className="space-y-2 text-sm">
                {data.motivoPerda && <p><span className="font-medium text-gray-500 dark:text-gray-400">Motivo</span><br />{data.motivoPerda}</p>}
                {data.statusAnterior && <p><span className="font-medium text-gray-500 dark:text-gray-400">Status anterior</span><br />{data.statusAnterior}</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </SideCreateDrawer>
  )
}
