'use client'

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import type { CampoPersonalizado, Cliente } from '../types'
import type { CreateClienteForm } from '../../types'
import { INITIAL_FORM_DATA } from '../utils'
import { toUpdateClientePayload } from '../../utils'

export function useClienteDetalhes() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id
  const clienteId = Array.isArray(rawId) ? rawId[0] : rawId

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState<CreateClienteForm>({ ...INITIAL_FORM_DATA, perfil: 'b2c' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const syncFormWithCliente = (c: Cliente | null) => {
    if (!c) return
    setFormData({
      perfil:
        c.camposPersonalizados?.some(
          (campo) =>
            campo.label?.trim().toLowerCase() === 'perfil'
            && campo.value?.trim().toLowerCase() === 'b2b'
        )
          ? 'b2b'
          : 'b2c',
      nome: c.nome || '', email: c.email || '', telefone: c.telefone || '', empresa: c.empresa || '',
      endereco: c.endereco || '', cidade: c.cidade || '', estado: c.estado || '', cep: c.cep || '',
      cargo: c.cargo || '', documento: c.documento || '', website: c.website || '',
      dataNascimento: c.dataNascimento || '', observacoes: c.observacoes || '',
      camposPersonalizados: Array.isArray(c.camposPersonalizados)
        ? c.camposPersonalizados.map((f) => ({ label: f.label || '', value: f.value || '' }))
        : [],
    })
  }

  const fetchCliente = useCallback(async (signal?: AbortSignal) => {
    if (!clienteId) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, { signal })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar cliente')
      setCliente(data)
    } catch (err: unknown) {
      if (
        (err instanceof DOMException && err.name === 'AbortError')
        || (typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'AbortError')
      ) return
      setError(err instanceof Error ? err.message : 'Erro ao carregar cliente')
    } finally { setLoading(false) }
  }, [clienteId])

  useEffect(() => {
    if (!clienteId) return
    const c = new AbortController()
    void fetchCliente(c.signal)
    return () => c.abort()
  }, [clienteId, fetchCliente])
  useEffect(() => { syncFormWithCliente(cliente) }, [cliente])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }
  const handleCustomFieldChange = (index: number, field: keyof CampoPersonalizado, value: string) => {
    setFormData((prev) => ({ ...prev, camposPersonalizados: prev.camposPersonalizados.map((item, i) => i === index ? { ...item, [field]: value } : item) }))
  }
  const handleAddCustomField = () => {
    setFormData((prev) => ({ ...prev, camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }] }))
  }
  const handleRemoveCustomField = (index: number) => {
    setFormData((prev) => ({ ...prev, camposPersonalizados: prev.camposPersonalizados.filter((_, i) => i !== index) }))
  }

  const handleUpdate = async (event?: Pick<FormEvent<HTMLFormElement>, 'preventDefault'>) => {
    event?.preventDefault(); if (!clienteId) return
    setSaving(true); setError(null)
    try {
      const payload = toUpdateClientePayload(formData)
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar cliente')
      setCliente(data); setEditMode(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
      setError(msg); toast.error('Erro', { description: msg })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!clienteId) return
    setDeleting(true); setError(null)
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, { method: 'DELETE' })
      const data = res.ok ? null : await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir cliente')
      setDeleteDialogOpen(false); router.push('/clientes')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir cliente'
      setError(msg); toast.error('Erro', { description: msg })
    } finally { setDeleting(false) }
  }

  const handleCancelEdit = () => { syncFormWithCliente(cliente); setEditMode(false) }

  return {
    cliente, formData, loading, saving, deleting, editMode, setEditMode, error, deleteDialogOpen, setDeleteDialogOpen,
    fetchCliente, handleChange, handleCustomFieldChange, handleAddCustomField, handleRemoveCustomField,
    handleUpdate, handleDelete, handleCancelEdit,
  }
}


