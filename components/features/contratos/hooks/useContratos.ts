'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import type { Contrato, ContratoFormValues } from '../types'

const CONTRATOS_PAGE_SIZE = 20

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface UseContratosFilters {
  status?: 'em_andamento' | 'aprovado_assinado' | 'rejeitado'
  tipo?: string
  dataInicio?: string
  dataFim?: string
}

export function useContratos(filters: UseContratosFilters = {}) {
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: CONTRATOS_PAGE_SIZE,
    pages: 1,
  })
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [saving, setSaving] = useState(false)

  const fetchContratos = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(CONTRATOS_PAGE_SIZE),
      })
      if (filters.tipo) params.set('tipo', filters.tipo)
      if (filters.status) params.set('status', filters.status)
      if (filters.dataInicio) params.set('dataInicio', filters.dataInicio)
      if (filters.dataFim) params.set('dataFim', filters.dataFim)

      const res = await fetch(`/api/contratos?${params.toString()}`)
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Erro ao carregar contratos')

      const nextData = Array.isArray(payload?.data) ? payload.data : []
      const nextMeta: PaginationMeta = {
        total: Number(payload?.meta?.total || 0),
        page: Number(payload?.meta?.page || targetPage),
        limit: Number(payload?.meta?.limit || CONTRATOS_PAGE_SIZE),
        pages: Number(payload?.meta?.pages || 1),
      }

      setContratos(nextData)
      setMeta(nextMeta)
    } catch (error) {
      setContratos([])
      setMeta((prev) => ({ ...prev, total: 0, pages: 1 }))
    } finally {
      setLoading(false)
    }
  }, [filters.dataFim, filters.dataInicio, filters.status, filters.tipo])

  useEffect(() => {
    fetchContratos(page)
  }, [fetchContratos, page, filters.dataFim, filters.dataInicio, filters.status, filters.tipo])

  useEffect(() => {
    setPage(1)
  }, [filters.dataFim, filters.dataInicio, filters.status, filters.tipo])

  const createContrato = useCallback(async (values: ContratoFormValues) => {
    try {
      setSaving(true)
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar contrato')
      toast.success('Contrato criado')
      return data as Contrato
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao criar contrato.',
      })
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteContrato = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/contratos/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir contrato')
      setContratos((prev) => prev.filter((c) => c.id !== id))
      setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      toast.success('Contrato excluído')
      return true
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao excluir.',
      })
      return false
    }
  }, [])

  const updateContratoStatus = useCallback(
    async (id: string, status: 'em_andamento' | 'aprovado_assinado' | 'rejeitado') => {
      try {
        const res = await fetch(`/api/contratos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar status')
        setContratos((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
        toast.success('Status atualizado')
        return true
      } catch (error) {
        toast.error('Erro', {
          description: error instanceof Error ? error.message : 'Erro ao atualizar status.',
        })
        return false
      }
    },
    []
  )

  const updateContratoTitulo = useCallback(async (id: string, titulo: string) => {
    try {
      const res = await fetch(`/api/contratos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar contrato')
      setContratos((prev) => prev.map((c) => (c.id === id ? { ...c, titulo } : c)))
      toast.success('Contrato atualizado')
      return true
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao atualizar contrato.',
      })
      return false
    }
  }, [])

  const updateContrato = useCallback(async (id: string, values: ContratoFormValues) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/contratos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar contrato')
      setContratos((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...data,
                clausulas: data.clausulas ?? c.clausulas,
                dadosPartes: data.dadosPartes ?? c.dadosPartes,
              }
            : c
        )
      )
      toast.success('Contrato atualizado')
      return data as Contrato
    } catch (error) {
      toast.error('Erro', {
        description: error instanceof Error ? error.message : 'Erro ao atualizar contrato.',
      })
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    loading,
    page,
    setPage,
    meta,
    contratos,
    saving,
    fetchContratos,
    createContrato,
    deleteContrato,
    updateContrato,
    updateContratoStatus,
    updateContratoTitulo,
  }
}
