/**
 * Configuração da plataforma de e-mail usada no botão "Enviar e-mail" do funil.
 */
'use client'

import { useEffect, useState } from 'react'
import { Mail } from '@/lib/icons'
import {
  PLATAFORMAS_EMAIL,
  getPlataformaEmailPreference,
  setPlataformaEmailPreference,
  type PlataformaEmail,
} from '@/lib/emailCompose'

export function PlataformaEmailCard() {
  const [plataforma, setPlataforma] = useState<PlataformaEmail>(getPlataformaEmailPreference())

  useEffect(() => {
    const sync = () => setPlataforma(getPlataformaEmailPreference())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const handleChange = (value: string) => {
    const p = value as PlataformaEmail
    setPlataforma(p)
    setPlataformaEmailPreference(p)
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 shrink-0 mt-0.5 text-gray-500 dark:text-gray-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Plataforma de e-mail</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Usada ao clicar em &quot;Enviar e-mail&quot; no funil de leads
          </p>
          <select
            value={plataforma}
            onChange={(e) => handleChange(e.target.value)}
            className="crm-input text-xs w-full max-w-xs"
            aria-label="Plataforma de e-mail"
          >
            {PLATAFORMAS_EMAIL.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
