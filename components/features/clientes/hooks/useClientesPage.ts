'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CLIENTES_PAGE_SIZE, initialPaginationMeta } from '../constants'
import type { Cliente, ClientePerfil, PaginationMeta } from '../types'
import { useClientesCrud } from './useClientesCrud'

const FETCH_THROTTLE_MS = 2000

type UseClientesPageOptions = {
  queryFilter?: string
}

export function useClientesPage({ queryFilter = '' }: UseClientesPageOptions = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [profile, setProfile] = useState<ClientePerfil | ''>('')
  const [meta, setMeta] = useState<PaginationMeta>(initialPaginationMeta)
  const lastQueryFilterRef = useRef(queryFilter)
  const lastFetchAtRef = useRef(0)
  const fetchingRef = useRef(false)

  const fetchClientes = useCallback(
    async (targetPage: number, targetProfile: ClientePerfil | '', signal?: AbortSignal) => {
      const now = Date.now()
      if (fetchingRef.current) return
      if (lastFetchAtRef.current > 0 && now - lastFetchAtRef.current < FETCH_THROTTLE_MS) return

      fetchingRef.current = true
      lastFetchAtRef.current = now
      try {
        setLoading(true)
        const query = queryFilter ? `&${queryFilter}` : ''
        const profileQuery = targetProfile ? `&profile=${targetProfile}` : ''
        const response = await fetch(
          `/api/clientes?paginated=true&page=${targetPage}&limit=${CLIENTES_PAGE_SIZE}${profileQuery}${query}`,
          { signal, cache: 'no-store' }
        )

        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(payload?.error || 'Erro ao carregar clientes')
        }

        const nextData = Array.isArray(payload?.data) ? payload.data : []
        const nextMeta: PaginationMeta = {
          total: Number(payload?.meta?.total || 0),
          page: Number(payload?.meta?.page || targetPage),
          limit: Number(payload?.meta?.limit || CLIENTES_PAGE_SIZE),
          pages: Number(payload?.meta?.pages || 1),
        }

        if (nextData.length === 0 && targetPage > 1 && nextMeta.total > 0) {
          setPage((prev) => Math.max(1, prev - 1))
          return
        }

        setClientes(nextData)
        setMeta(nextMeta)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        console.error('Erro ao carregar clientes:', error)
        setClientes([])
        setMeta((prev) => ({ ...prev, total: 0, pages: 1, page: targetPage }))
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    },
    [queryFilter]
  )

  useEffect(() => {
    if (lastQueryFilterRef.current !== queryFilter) {
      lastQueryFilterRef.current = queryFilter
      if (page !== 1) {
        setPage(1)
        return
      }
    }

    const controller = new AbortController()
    fetchClientes(page, profile, controller.signal)

    const handleFocus = () => {
      void fetchClientes(page, profile)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      controller.abort()
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchClientes, page, profile, queryFilter])

  const crud = useClientesCrud({ fetchClientes, page, profile, setPage })

  return {
    clientes,
    loading,
    page,
    profile,
    meta,
    setPage,
    setProfile,
    fetchClientes,
    ...crud,
  }
}
