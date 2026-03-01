'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/common'
import { useMotivosPerda } from '@/lib/hooks/useMotivosPerda'

interface MotivoPerdaModalProps {
  open: boolean
  onConfirm: (motivo: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function MotivoPerdaModal({
  open,
  onConfirm,
  onCancel,
  loading = false,
}: MotivoPerdaModalProps) {
  const { motivos, addMotivo, loading: motivosLoading, canAddCustom, customCount, maxCustom } =
    useMotivosPerda()
  const [selectedMotivo, setSelectedMotivo] = useState('')
  const [novoMotivo, setNovoMotivo] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedMotivo('')
    setNovoMotivo('')
  }, [open])

  const motivosOrdenados = useMemo(
    () => [...motivos].sort((a, b) => a.localeCompare(b)),
    [motivos]
  )

  if (!open) return null

  const handleAddMotivo = async () => {
    const trimmed = novoMotivo.trim()
    if (!trimmed) return
    const result = await addMotivo(trimmed)
    if (!result.ok) {
      alert(result.error || 'Nao foi possivel adicionar o motivo')
      return
    }
    setSelectedMotivo(result.motivo || trimmed)
    setNovoMotivo('')
  }

  const handleConfirm = () => {
    if (!selectedMotivo) return
    onConfirm(selectedMotivo)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Motivo da perda
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Selecione um motivo ou crie uma nova categoria.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={selectedMotivo}
              onChange={(event) => setSelectedMotivo(event.target.value)}
              disabled={motivosLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              <option value="">{motivosLoading ? 'Carregando...' : 'Selecione um motivo'}</option>
              {motivosOrdenados.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nova categoria
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={novoMotivo}
                onChange={(event) => setNovoMotivo(event.target.value)}
                placeholder="Digite um novo motivo"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMotivo}
                disabled={!novoMotivo.trim() || !canAddCustom}
              >
                Adicionar
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {canAddCustom
                ? `Voce pode adicionar mais ${Math.max(0, maxCustom - customCount)} motivo(s).`
                : 'Limite de 3 motivos personalizados atingido.'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!selectedMotivo || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Registrar perda'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
