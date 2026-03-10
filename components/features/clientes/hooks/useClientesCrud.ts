'use client'

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'
import { initialCreateForm } from '../constants'
import type { CampoPersonalizado, Cliente, ClientePerfil, CreateClienteForm } from '../types'
import { clienteToCreateForm, getErrorMessage, toCreateClientePayload, toUpdateClientePayload } from '../utils'

type UseClientesCrudOptions = {
  fetchClientes: (targetPage: number, targetProfile: ClientePerfil | '') => Promise<void>
  page: number
  profile: ClientePerfil | ''
  setPage: Dispatch<SetStateAction<number>>
}

type FormSetter = Dispatch<SetStateAction<CreateClienteForm>>

function updateFormField(setter: FormSetter, name: string, value: string) {
  setter((prev) => ({ ...prev, [name]: value }))
}

function addCustomField(setter: FormSetter) {
  setter((prev) => ({
    ...prev,
    camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }],
  }))
}

function updateCustomField(
  setter: FormSetter,
  index: number,
  field: keyof CampoPersonalizado,
  value: string
) {
  setter((prev) => ({
    ...prev,
    camposPersonalizados: prev.camposPersonalizados.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ),
  }))
}

function removeCustomField(setter: FormSetter, index: number) {
  setter((prev) => ({
    ...prev,
    camposPersonalizados: prev.camposPersonalizados.filter((_, itemIndex) => itemIndex !== index),
  }))
}

export function useClientesCrud({
  fetchClientes,
  page,
  profile,
  setPage,
}: UseClientesCrudOptions) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClienteForm>(initialCreateForm)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [clienteToEditId, setClienteToEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CreateClienteForm>(initialCreateForm)
  const [savingEdit, setSavingEdit] = useState(false)
  const closeCreateDrawer = useCallback(() => {
    setShowCreateDrawer(false)
    setCreateForm(initialCreateForm)
  }, [])
  const openCreateDrawer = useCallback(() => setShowCreateDrawer(true), [])

  const openEditDrawer = useCallback(async (clienteId: string) => {
    setClienteToEditId(clienteId)
    setShowEditDrawer(true)
    try {
      const response = await fetch(`/api/clientes/${clienteId}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao carregar cliente')
      }
      setEditForm(clienteToCreateForm(data))
    } catch (error) {
      toast.error('Erro', { description: getErrorMessage(error, 'Erro ao carregar cliente') })
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
    [closeCreateDrawer, createForm, fetchClientes, profile, setPage]
  )

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
        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao atualizar cliente')
        }
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

  return {
    deletingId,
    clienteToDelete,
    showCreateDrawer,
    creating,
    createForm,
    showEditDrawer,
    editForm,
    savingEdit,
    setClienteToDelete,
    openCreateDrawer,
    closeCreateDrawer,
    openEditDrawer,
    closeEditDrawer,
    handleDeleteCliente,
    handleCreateInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      updateFormField(setCreateForm, event.target.name, event.target.value),
    handleAddCustomField: () => addCustomField(setCreateForm),
    handleCustomFieldChange: (index: number, field: keyof CampoPersonalizado, value: string) =>
      updateCustomField(setCreateForm, index, field, value),
    handleRemoveCustomField: (index: number) => removeCustomField(setCreateForm, index),
    handleCreateCliente,
    handleEditInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      updateFormField(setEditForm, event.target.name, event.target.value),
    handleEditCustomFieldChange: (index: number, field: keyof CampoPersonalizado, value: string) =>
      updateCustomField(setEditForm, index, field, value),
    handleEditAddCustomField: () => addCustomField(setEditForm),
    handleEditRemoveCustomField: (index: number) => removeCustomField(setEditForm, index),
    handleUpdateCliente,
  }
}
