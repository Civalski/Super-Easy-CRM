'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from '@/lib/icons'
import { Button } from '@/components/common'

const MOTIVOS_CANCELAMENTO = [
  { value: 'preco', label: 'Preço' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'forma_pagamento', label: 'Forma de pagamento' },
  { value: 'concorrente', label: 'Concorrente' },
  { value: 'desconhecido', label: 'Desconhecido' },
  { value: 'outro', label: 'Outro (descrever)' },
] as const

interface CancelarPedidoModalProps {
  open: boolean
  onConfirm: (motivo: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function CancelarPedidoModal({
  open,
  onConfirm,
  onCancel,
  loading = false,
}: CancelarPedidoModalProps) {
  const [motivo, setMotivo] = useState<string>('')
  const [outroDescricao, setOutroDescricao] = useState('')

  useEffect(() => {
    if (!open) {
      setMotivo('')
      setOutroDescricao('')
    }
  }, [open])

  if (!open) return null

  const isOutro = motivo === 'outro'
  const motivoLabel = MOTIVOS_CANCELAMENTO.find((m) => m.value === motivo)?.label ?? motivo

  const handleConfirm = () => {
    if (!motivo) return
    const motivoFinal = isOutro
      ? (outroDescricao.trim() ? `Outro: ${outroDescricao.trim()}` : 'Outro')
      : motivoLabel
    onConfirm(motivoFinal)
  }

  const canConfirm = motivo && (!isOutro || outroDescricao.trim().length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cancelar pedido
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Informe o motivo do cancelamento para entendermos por que pedidos sao cancelados.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Motivo do cancelamento
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione um motivo</option>
              {MOTIVOS_CANCELAMENTO.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {isOutro && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descreva o motivo
              </label>
              <textarea
                value={outroDescricao}
                onChange={(e) => setOutroDescricao(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Voltar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Cancelar pedido'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
