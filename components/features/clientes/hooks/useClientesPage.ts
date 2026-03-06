'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/lib/toast'
import { CLIENTES_PAGE_SIZE, initialCreateForm, initialPaginationMeta } from '../constants'
import type { CampoPersonalizado, Cliente, ClientePerfil, CreateClienteForm, PaginationMeta } from '../types'
import { clienteToCreateForm, getErrorMessage, toCreateClientePayload, toUpdateClientePayload } from '../utils'

type UseClientesPageOptions = {
  queryFilter?: string
}

export function useClientesPage({ queryFilter = '' }: UseClientesPageOptions = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [profile, setProfile] = useState<ClientePerfil | ''>('')
  const [meta, setMeta] = useState<PaginationMeta>(initialPaginationMeta)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClienteForm>(initialCreateForm)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [clienteToEditId, setClienteToEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CreateClienteForm>(initialCreateForm)
  const [savingEdit, setSavingEdit] = useState(false)
  const lastQueryFilterRef = useRef(queryFilter)

  const fetchClientes = useCallback(
    async (targetPage: number, targetProfile: ClientePerfil | '', signal?: AbortSignal) => {
      try {
        setLoading(true)
        const query = queryFilter ? `&${queryFilter}` : ''
        const profileQuery = targetProfile ? `&profile=${targetProfile}` : ''
        const response = await fetch(
          `/api/clientes?paginated=true&page=${targetPage}&limit=${CLIENTES_PAGE_SIZE}${profileQuery}${query}`,
          { signal }
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
      fetchClientes(page, profile)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      controller.abort()
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchClientes, page, profile, queryFilter])

  const resetCreateForm = useCallback(() => {
    setCreateForm(initialCreateForm)
  }, [])

  const closeCreateDrawer = useCallback(() => {
    setShowCreateDrawer(false)
    resetCreateForm()
  }, [resetCreateForm])

  const openCreateDrawer = useCallback(() => {
    setShowCreateDrawer(true)
  }, [])

  const openEditDrawer = useCallback(async (clienteId: string) => {
    setClienteToEditId(clienteId)
    setShowEditDrawer(true)
    try {
      const res = await fetch(`/api/clientes/${clienteId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar cliente')
      setEditForm(clienteToCreateForm(data))
    } catch (err) {
      toast.error('Erro', { description: getErrorMessage(err, 'Erro ao carregar cliente') })
      setShowEditDrawer(false)
      setClienteToEditId(null)
    }
  }, [])

  const closeEditDrawer = useCallback(() => {
    setShowEditDrawer(false)
    setClienteToEditId(null)
    setEditForm(initialCreateForm)
  }, [])

  const handleDeleteCliente = useCallback(
    async (clienteId: string) => {
      setDeletingId(clienteId)
      try {
        const response = await fetch(`/api/clientes/${clienteId}`, { method: 'DELETE' })
        const data = response.ok ? null : await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao excluir cliente')
        }

        await fetchClientes(page, profile)
        setClienteToDelete(null)
      } catch (error) {
        alert(getErrorMessage(error, 'Erro ao excluir cliente'))
      } finally {
        setDeletingId(null)
      }
    },
    [fetchClientes, page, profile]
  )

  const handleCreateInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target
      setCreateForm((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleAddCustomField = useCallback(() => {
    setCreateForm((prev) => ({
      ...prev,
      camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }],
    }))
  }, [])

  const handleCustomFieldChange = useCallback(
    (index: number, field: keyof CampoPersonalizado, value: string) => {
      setCreateForm((prev) => ({
        ...prev,
        camposPersonalizados: prev.camposPersonalizados.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      }))
    },
    []
  )

  const handleRemoveCustomField = useCallback((index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.filter((_, itemIndex) => itemIndex !== index),
    }))
  }, [])

  const handleCreateCliente = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      setCreating(true)

      try {
        const response = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toCreateClientePayload(createForm)),
        })

        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao criar cliente')
        }

        closeCreateDrawer()
        await fetchClientes(1, profile)
        setPage(1)
      } catch (error) {
        alert(getErrorMessage(error, 'Erro ao criar cliente'))
      } finally {
        setCreating(false)
      }
    },
    [closeCreateDrawer, createForm, fetchClientes, profile]
  )

  const handleEditInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target
      setEditForm((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleEditCustomFieldChange = useCallback(
    (index: number, field: keyof CampoPersonalizado, value: string) => {
      setEditForm((prev) => ({
        ...prev,
        camposPersonalizados: prev.camposPersonalizados.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      }))
    },
    []
  )

  const handleEditAddCustomField = useCallback(() => {
    setEditForm((prev) => ({
      ...prev,
      camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }],
    }))
  }, [])

  const handleEditRemoveCustomField = useCallback((index: number) => {
    setEditForm((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.filter((_, itemIndex) => itemIndex !== index),
    }))
  }, [])

  const handleUpdateCliente = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (!clienteToEditId) return
      setSavingEdit(true)
      try {
        const response = await fetch(`/api/clientes/${clienteToEditId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toUpdateClientePayload(editForm)),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || 'Erro ao atualizar cliente')
        closeEditDrawer()
        await fetchClientes(page, profile)
      } catch (error) {
        toast.error('Erro', { description: getErrorMessage(error, 'Erro ao atualizar cliente') })
      } finally {
        setSavingEdit(false)
      }
    },
    [clienteToEditId, closeEditDrawer, editForm, fetchClientes, page, profile]
  )

  const handleImportCompleted = useCallback(async () => {
    await fetchClientes(1, profile)
    setPage(1)
  }, [fetchClientes, profile])

  return {
    clientes,
    loading,
    page,
    profile,
    meta,
    deletingId,
    clienteToDelete,
    showCreateDrawer,
    creating,
    createForm,
    showEditDrawer,
    editForm,
    savingEdit,
    setPage,
    setProfile,
    setClienteToDelete,
    openCreateDrawer,
    closeCreateDrawer,
    openEditDrawer,
    closeEditDrawer,
    handleDeleteCliente,
    handleCreateInputChange,
    handleAddCustomField,
    handleCustomFieldChange,
    handleRemoveCustomField,
    handleCreateCliente,
    handleEditInputChange,
    handleEditCustomFieldChange,
    handleEditAddCustomField,
    handleEditRemoveCustomField,
    handleUpdateCliente,
    handleImportCompleted,
  }
}
