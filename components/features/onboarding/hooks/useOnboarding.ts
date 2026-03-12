'use client'

import { useCallback, useEffect, useState } from 'react'
import { setThemePreference } from '@/lib/ui/themePreference'
import { setMenuLayout } from '@/lib/ui/menuLayoutPreference'
import type { OnboardingFormData, OnboardingStatus } from '../types'

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skipped, setSkipped] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me/onboarding')
      if (!res.ok) throw new Error('Falha ao carregar')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      setError('Não foi possível carregar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const handleReset = () => {
      setSkipped(false)
      setLoading(true)
      fetchStatus()
    }
    window.addEventListener('arker:onboarding-reset', handleReset)
    return () => window.removeEventListener('arker:onboarding-reset', handleReset)
  }, [fetchStatus])

  const submit = useCallback(
    async (data: OnboardingFormData) => {
      setSaving(true)
      setError(null)
      try {
        const res = await fetch('/api/users/me/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            areaAtuacao: data.areaAtuacao.trim() || null,
            tipoPublico: data.tipoPublico,
            nomeEmpresa: data.nomeEmpresa.trim() || null,
            nomeVendedor: data.nomeVendedor.trim() || null,
            telefone: data.telefone.trim() || null,
            email: data.email.trim() || null,
            site: data.site.trim() || null,
            rodape: data.rodape.trim() || null,
            logoBase64: data.logoBase64 || null,
            logoPosicao: data.logoPosicao || 'topo',
            corPrimaria: data.corPrimaria?.trim() || null,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error || 'Erro ao salvar')
        }
        setThemePreference(data.temaPreferencia)
        setMenuLayout(data.menuLayout)
        setStatus((prev) => prev ? { ...prev, completed: true } : prev)
        window.dispatchEvent(new CustomEvent('arker:empresa-config-updated'))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar')
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const skip = useCallback(async () => {
    // Mark onboarding completed without filling data
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/users/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaAtuacao: null,
          tipoPublico: null,
          nomeEmpresa: null,
          nomeVendedor: null,
          telefone: null,
          email: null,
          site: null,
          rodape: null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Erro ao pular')
      }
      setSkipped(true)
      setStatus((prev) => prev ? { ...prev, completed: true } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pular')
    } finally {
      setSaving(false)
    }
  }, [])

  /** true when onboarding should be displayed */
  const shouldShow = !loading && status !== null && !status.completed && !skipped

  return { status, loading, saving, error, submit, skip, shouldShow, skipped }
}
