/**
 * Acao para gerar dados mockados de demonstracao
 */
'use client'

import { useState } from 'react'
import { Database, Loader2 } from 'lucide-react'
import { Button } from '@/components/common'
import { SeedResultCard } from './SeedResultCard'
import type { SeedResult } from './ConfiguracoesTypes'

export function MockDataCard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)

  const handleGenerateMockData = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      })
      const data = (await response.json()) as SeedResult
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crm-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Database className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Gerar dados mockados</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Popular CRM com volume ampliado e distribuicao realista para demonstracao
            </p>
          </div>
        </div>

        <Button
          onClick={handleGenerateMockData}
          disabled={loading}
          variant="primary"
          size="sm"
          className="shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Gerar mocks
            </>
          )}
        </Button>
      </div>

      {result && <SeedResultCard result={result} />}
    </div>
  )
}
