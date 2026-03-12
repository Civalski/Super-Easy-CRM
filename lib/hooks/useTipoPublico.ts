'use client'

import { useCallback, useEffect, useState } from 'react'

export type TipoPublico = 'B2B' | 'B2C' | 'ambos'

let cachedTipoPublico: TipoPublico | null = null
let cachedPromise: Promise<TipoPublico> | null = null

function fetchTipoPublico(): Promise<TipoPublico> {
  if (cachedPromise) return cachedPromise
  cachedPromise = fetch('/api/users/me/onboarding')
    .then(async (r) => {
      if (!r.ok) return 'ambos'
      const data = await r.json()
      const tp = data?.empresaConfig?.tipoPublico
      return tp === 'B2B' || tp === 'B2C' ? tp : 'ambos'
    })
    .catch(() => 'ambos')
  return cachedPromise
}

function invalidateCache() {
  cachedTipoPublico = null
  cachedPromise = null
}

/**
 * Retorna o tipo de público configurado no onboarding (B2B, B2C ou ambos).
 * Usado para ocultar/desativar opções conforme a escolha do usuário.
 */
export function useTipoPublico(): { tipoPublico: TipoPublico; loading: boolean } {
  const [tipoPublico, setTipoPublico] = useState<TipoPublico>(cachedTipoPublico ?? 'ambos')
  const [loading, setLoading] = useState(!cachedTipoPublico)

  const load = useCallback(async () => {
    const result = await fetchTipoPublico()
    cachedTipoPublico = result
    setTipoPublico(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (cachedTipoPublico !== null) {
      setTipoPublico(cachedTipoPublico)
      setLoading(false)
      return
    }
    load()
  }, [load])

  useEffect(() => {
    const handleInvalidate = () => {
      invalidateCache()
      setLoading(true)
      load()
    }
    window.addEventListener('arker:onboarding-reset', handleInvalidate)
    window.addEventListener('arker:empresa-config-updated', handleInvalidate)
    return () => {
      window.removeEventListener('arker:onboarding-reset', handleInvalidate)
      window.removeEventListener('arker:empresa-config-updated', handleInvalidate)
    }
  }, [load])

  return { tipoPublico, loading }
}
