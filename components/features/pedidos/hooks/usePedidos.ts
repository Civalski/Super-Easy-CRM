'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import type { Pedido, PaginationMeta } from '../types'
import { PEDIDOS_PAGE_SIZE } from '../constants'
import { getPedidoSituacao } from '../utils'

interface UsePedidosOptions {
  queryFilter: string
}

export function usePedidos({ queryFilter }: UsePedidosOptions) {
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PEDIDOS_PAGE_SIZE,
    pages: 1,
  })
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [savingById, setSavingById] = useState<Record<string, boolean>>({})
  const lastQueryFilterRef = useRef(queryFilter)

  const fetchPedidos = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      const query = queryFilter ? `&${queryFilter}` : ''
      const res = await fetch(`/api/pedidos?paginated=true&page=${targetPage}&limit=${PEDIDOS_PAGE_SIZE}${query}`)
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Erro ao carregar pedidos')

      const nextData = Array.isArray(payload?.data) ? payload.data : []
      const nextMeta: PaginationMeta = {
        total: Number(payload?.meta?.total || 0),
        page: Number(payload?.meta?.page || targetPage),
        limit: Number(payload?.meta?.limit || PEDIDOS_PAGE_SIZE),
        pages: Number(payload?.meta?.pages || 1),
      }

      if (nextData.length === 0 && targetPage > 1 && nextMeta.total > 0) {
        setPage((prev) => Math.max(1, prev - 1))
        return
      }

      setPedidos(nextData)
      setMeta(nextMeta)
    } catch {
      setPedidos([])
      setMeta((prev) => ({ ...prev, total: 0, pages: 1, page: targetPage }))
    } finally {
      setLoading(false)
    }
  }, [queryFilter])

  useEffect(() => {
    if (lastQueryFilterRef.current !== queryFilter) {
      lastQueryFilterRef.current = queryFilter
      if (page !== 1) {
        setPage(1)
        return
      }
    }
    fetchPedidos(page)
  }, [fetchPedidos, page, queryFilter])

  const stats = useMemo(() => {
    const total = pedidos.length
    const emAndamento = pedidos.filter((p) => getPedidoSituacao(p) === 'pedido').length
    const vendas = pedidos.filter((p) => getPedidoSituacao(p) === 'venda').length
    const cancelados = pedidos.filter((p) => getPedidoSituacao(p) === 'cancelado').length
    return { total, emAndamento, vendas, cancelados }
  }, [pedidos])

  const pedidosByStatus = useMemo(
    () => ({
      andamento: pedidos.filter((p) => getPedidoSituacao(p) === 'pedido'),
      vendas: pedidos.filter((p) => getPedidoSituacao(p) === 'venda'),
      cancelados: pedidos.filter((p) => getPedidoSituacao(p) === 'cancelado'),
    }),
    [pedidos]
  )

  const updatePedidoTotals = (
    pedidoId: string,
    totals: { totalBruto: number; totalDesconto: number; totalLiquido: number }
  ) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, ...totals } : p
      )
    )
  }

  const handleSavePedidoOperacional = async (
    pedidoId: string,
    values: { statusEntrega: string; pagamentoConfirmado: boolean }
  ) => {
    try {
      setSavingById((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar pedido')
      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? data : p)))
      await Swal.fire({ icon: 'success', title: 'Pedido atualizado' })
      return true
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao salvar.' })
      return false
    } finally {
      setSavingById((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleSavePedidoComercial = async (
    pedidoId: string,
    values: {
      titulo: string
      descricao: string | null
      valor: number | null
      clienteId: string
      formaPagamento: string | null
      parcelas: number | null
      desconto: number | null
      probabilidade: number
      dataFechamento: string | null
      proximaAcaoEm: string | null
      canalProximaAcao: string | null
      responsavelProximaAcao: string | null
      lembreteProximaAcao: boolean
    }
  ) => {
    try {
      setSavingById((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar pedido')
      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? data : p)))
      await Swal.fire({ icon: 'success', title: 'Pedido atualizado' })
      return true
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao salvar.' })
      return false
    } finally {
      setSavingById((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleCancelarPedido = async (pedido: Pedido): Promise<boolean> => {
    if (getPedidoSituacao(pedido) !== 'pedido') return false

    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Cancelar pedido #${pedido.numero}?`,
      text: 'Este pedido saira da lista de orcamentos e ficara marcado como pedido cancelado.',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar pedido',
      cancelButtonText: 'Voltar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    })

    if (!confirm.isConfirmed) return false

    try {
      setSavingById((prev) => ({ ...prev, [pedido.id]: true }))
      const res = await fetch(`/api/oportunidades/${pedido.oportunidade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'perdida', motivoPerda: 'Pedido cancelado' }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Erro ao cancelar pedido')
      await Swal.fire({ icon: 'success', title: 'Pedido cancelado' })
      await fetchPedidos(page)
      return true
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Nao foi possivel cancelar o pedido.',
      })
      return false
    } finally {
      setSavingById((prev) => ({ ...prev, [pedido.id]: false }))
    }
  }

  return {
    loading,
    page,
    setPage,
    meta,
    pedidos,
    savingById,
    stats,
    pedidosByStatus,
    fetchPedidos,
    updatePedidoTotals,
    handleSavePedidoOperacional,
    handleSavePedidoComercial,
    handleCancelarPedido,
  }
}
