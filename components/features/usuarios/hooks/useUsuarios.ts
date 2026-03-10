'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UsuarioListItem } from '../types'

export function useUsuarios() {
  const [users, setUsers] = useState<UsuarioListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await fetch('/api/usuarios', { cache: 'no-store' })
      if (res.status === 403) {
        setForbidden(true)
        setUsers([])
        return
      }
      if (!res.ok) throw new Error('Falha ao carregar usuários')
      const data = (await res.json()) as UsuarioListItem[]
      setUsers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  return { users, loading, error, forbidden, refetch: fetchUsers }
}
