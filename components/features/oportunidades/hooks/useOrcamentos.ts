'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import type { Oportunidade, PaginationMeta } from '../types'
import { LIST_PAGE_SIZE, HISTORICO_PAGE_SIZE } from '../constants'
import { getDownloadFileNameFromHeader } from '../utils'

interface UseOrcamentosOptions {
  activeTab: 'abertas' | 'canceladas'
  clienteQuery: string
  searchQuery: string
  filtersQuery?: string
}

export function useOrcamentos({ activeTab, clienteQuery, searchQuery, filtersQuery = '' }: UseOrcamentosOptions) {
  const { confirm } = useConfirm()
  const [orcamentosAbertos, setOrcamentosAbertos] = useState<Oportunidade[]>([])
  const [historicoPerdidas, setHistoricoPerdidas] = useState<Oportunidade[]>([])
  const [metaAbertas, setMetaAbertas] = useState<PaginationMeta>({ total: 0, page: 1, limit: LIST_PAGE_SIZE, pages: 1 })
  const [metaPerdidas, setMetaPerdidas] = useState<PaginationMeta>({ total: 0, page: 1, limit: HISTORICO_PAGE_SIZE, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [pageAbertas, setPageAbertas] = useState(1)
  const [pagePerdidas, setPagePerdidas] = useState(1)
  const [creatingPedidoById, setCreatingPedidoById] = useState<Record<string, boolean>>({})
  const [downloadingPdfById, setDownloadingPdfById] = useState<Record<string, boolean>>({})
  const [cancelandoLoading, setCancelandoLoading] = useState(false)

  const fetchOportunidades = useCallback(async (signal?: AbortSignal, overrides?: { pageAbertas?: number; pagePerdidas?: number }) => {
    const pageA = overrides?.pageAbertas ?? pageAbertas
    const pageP = overrides?.pagePerdidas ?? pagePerdidas
    try {
      setLoading(true)
      if (activeTab === 'abertas') {
        const response = await fetch(
          `/api/oportunidades?status=orcamento&possuiPedido=false&paginated=true&page=${pageA}&limit=${LIST_PAGE_SIZE}${clienteQuery}${searchQuery}${filtersQuery}`,
          { signal }
        )
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar orcamentos')

        const data = Array.isArray(payload?.data) ? payload.data : []
        const meta: PaginationMeta = {
          total: Number(payload?.meta?.total || 0),
          page: Number(payload?.meta?.page || pageA),
          limit: Number(payload?.meta?.limit || LIST_PAGE_SIZE),
          pages: Number(payload?.meta?.pages || 1),
        }
        if (data.length === 0 && pageA > 1 && meta.total > 0) {
          setPageAbertas((prev) => Math.max(1, prev - 1))
          return
        }
        setOrcamentosAbertos(data)
        setMetaAbertas(meta)
      } else {
        const response = await fetch(
          `/api/oportunidades?status=perdida&possuiPedido=false&paginated=true&page=${pageP}&limit=${HISTORICO_PAGE_SIZE}${clienteQuery}${searchQuery}${filtersQuery}`,
          { signal }
        )
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar perdidas')

        const data = Array.isArray(payload?.data) ? payload.data : []
        const meta: PaginationMeta = {
          total: Number(payload?.meta?.total || 0),
          page: Number(payload?.meta?.page || pageP),
          limit: Number(payload?.meta?.limit || HISTORICO_PAGE_SIZE),
          pages: Number(payload?.meta?.pages || 1),
        }
        if (data.length === 0 && pageP > 1 && meta.total > 0) {
          setPagePerdidas((prev) => Math.max(1, prev - 1))
          return
        }
        setHistoricoPerdidas(data)
        setMetaPerdidas(meta)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao carregar orçamentos:', error)
      if (activeTab === 'abertas') {
        setOrcamentosAbertos([])
        setMetaAbertas((prev) => ({ ...prev, total: 0, page: pageAbertas, pages: 1 }))
      } else {
        setHistoricoPerdidas([])
        setMetaPerdidas((prev) => ({ ...prev, total: 0, page: pagePerdidas, pages: 1 }))
      }
    } finally {
      setLoading(false)
    }
  }, [activeTab, clienteQuery, searchQuery, filtersQuery, pageAbertas, pagePerdidas])

  useEffect(() => {
    const controller = new AbortController()
    void fetchOportunidades(controller.signal)
    return () => controller.abort()
  }, [fetchOportunidades])

  const stats = useMemo(() => {
    const abertas = metaAbertas.total
    const valorTotal = orcamentosAbertos.reduce((acc, o) => acc + (o.valor || 0), 0)
    return { abertas, valorTotal, emOrcamento: metaAbertas.total }
  }, [metaAbertas.total, orcamentosAbertos])

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === 'fechada') {
      const ok = await confirm({
        title: 'Fechar Venda',
        description: 'Confirmar o fechamento deste orçamento como venda? O lead vinculado será convertido em cliente automaticamente, caso ainda não seja.',
        confirmLabel: 'Sim, fechar venda!',
        cancelLabel: 'Cancelar',
        confirmVariant: 'primary',
      })
      if (!ok) return
    }

    try {
      const response = await fetch(`/api/oportunidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        const data = await response.json()
        void fetchOportunidades()
        if (newStatus === 'fechada') {
          const message = data.prospectoConvertidoAutomaticamente
            ? 'Lead convertido em cliente! O lead vinculado a este orçamento foi automaticamente promovido a cliente.'
            : 'O orçamento foi fechado com sucesso.'
          toast.success('Venda Fechada! 🎉', { description: message })
        }
      } else {
        const data = await response.json()
        toast.error('Erro', { description: data.error || 'Erro ao atualizar status' })
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro', { description: 'Erro ao atualizar status. Tente novamente.' })
    }
  }

  const handleTransformarEmPedido = async (oportunidade: Oportunidade) => {
    const ok = await confirm({
      title: 'Transformar em pedido',
      description: 'Ao confirmar, este orcamento sera aprovado e passara para a aba de pedidos.',
      confirmLabel: 'Sim, transformar',
      cancelLabel: 'Cancelar',
      confirmVariant: 'primary',
    })
    if (!ok) return

    try {
      setCreatingPedidoById((prev) => ({ ...prev, [oportunidade.id]: true }))
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oportunidadeId: oportunidade.id }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao transformar orcamento em pedido')

      void fetchOportunidades()
      toast.success(data?.numero ? `Pedido #${data.numero} criado` : 'Pedido criado', { description: 'O orcamento foi aprovado e transformado em pedido.' })
    } catch (error: unknown) {
      console.error('Erro ao criar pedido:', error)
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Nao foi possivel transformar o orcamento em pedido.' })
    } finally {
      setCreatingPedidoById((prev) => ({ ...prev, [oportunidade.id]: false }))
    }
  }

  const handleDownloadOrcamentoPdf = async (oportunidade: Oportunidade) => {
    try {
      setDownloadingPdfById((prev) => ({ ...prev, [oportunidade.id]: true }))
      const response = await fetch(`/api/oportunidades/${oportunidade.id}/pdf`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Nao foi possivel gerar o PDF do orcamento.')
      }
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = getDownloadFileNameFromHeader(response.headers.get('Content-Disposition')) || 'Orçamento.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error: unknown) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Nao foi possivel baixar o PDF do orcamento.' })
    } finally {
      setDownloadingPdfById((prev) => ({ ...prev, [oportunidade.id]: false }))
    }
  }

  const handleReturnToPipeline = (id: string, previousStatus: string) => {
    if (!previousStatus) return
    handleStatusChange(id, previousStatus)
  }

  const handleCancelarOrcamento = async (id: string, motivo: string) => {
    try {
      setCancelandoLoading(true)
      const response = await fetch(`/api/oportunidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'perdida', motivoPerda: motivo.trim() }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao cancelar orçamento')

      void fetchOportunidades()
      toast.success('Orçamento cancelado', { description: 'O orçamento foi movido para a aba de cancelados.' })
    } catch (error: unknown) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Não foi possível cancelar o orçamento.' })
    } finally {
      setCancelandoLoading(false)
    }
  }

  return {
    loading,
    orcamentosAbertos,
    historicoPerdidas,
    metaAbertas,
    metaPerdidas,
    pageAbertas,
    setPageAbertas,
    pagePerdidas,
    setPagePerdidas,
    creatingPedidoById,
    downloadingPdfById,
    stats,
    fetchOportunidades,
    handleStatusChange,
    handleTransformarEmPedido,
    handleDownloadOrcamentoPdf,
    handleReturnToPipeline,
    handleCancelarOrcamento,
    cancelandoLoading,
  }
}
