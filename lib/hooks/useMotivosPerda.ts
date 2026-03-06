'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const DEFAULT_MOTIVOS = [
  'Prazo de entrega',
  'Preco',
  'Forma de pagamento',
  'Concorrente',
  'Desistencia',
]

const MAX_CUSTOM = 3

const uniqueMotivos = (items: string[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

interface AddMotivoResult {
  ok: boolean
  motivo?: string
  error?: string
}

export function useMotivosPerda() {
  const [motivos, setMotivos] = useState<string[]>(DEFAULT_MOTIVOS)
  const [customCount, setCustomCount] = useState(0)
  const [maxCustom, setMaxCustom] = useState(MAX_CUSTOM)
  const [loading, setLoading] = useState(true)

  const fetchMotivos = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/motivos-perda', { signal })
      if (!response.ok) {
        throw new Error('Erro ao buscar motivos de perda')
      }
      const data = await response.json()
      const list = Array.isArray(data?.motivos) ? data.motivos : DEFAULT_MOTIVOS
      setMotivos(uniqueMotivos(list))
      setCustomCount(
        typeof data?.customCount === 'number' ? data.customCount : 0
      )
      setMaxCustom(
        typeof data?.maxCustom === 'number' ? data.maxCustom : MAX_CUSTOM
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao carregar motivos de perda:', error)
      setMotivos(DEFAULT_MOTIVOS)
      setCustomCount(0)
      setMaxCustom(MAX_CUSTOM)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchMotivos(controller.signal)
    return () => controller.abort()
  }, [fetchMotivos])

  const addMotivo = useCallback(
    async (novoMotivo: string): Promise<AddMotivoResult> => {
      const trimmed = novoMotivo.trim()
      if (!trimmed) {
        return { ok: false, error: 'Informe um motivo valido' }
      }

      try {
        const response = await fetch('/api/motivos-perda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: trimmed }),
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          return { ok: false, error: data?.error || 'Erro ao criar motivo' }
        }

        const motivo = typeof data?.motivo === 'string' ? data.motivo : trimmed
        setMotivos((prev) => uniqueMotivos([...prev, motivo]))
        if (typeof data?.customCount === 'number') {
          setCustomCount(data.customCount)
        }
        if (typeof data?.maxCustom === 'number') {
          setMaxCustom(data.maxCustom)
        }
        return { ok: true, motivo }
      } catch (error) {
        console.error('Erro ao criar motivo de perda:', error)
        return { ok: false, error: 'Erro ao criar motivo' }
      }
    },
    []
  )

  const canAddCustom = useMemo(() => customCount < maxCustom, [customCount, maxCustom])

  return {
    motivos,
    addMotivo,
    loading,
    customCount,
    maxCustom,
    canAddCustom,
    refresh: fetchMotivos,
  }
}
