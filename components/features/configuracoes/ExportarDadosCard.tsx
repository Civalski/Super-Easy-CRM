/**
 * Opção para exportar todos os dados da conta (clientes, tarefas, orçamentos,
 * pedidos, metas, financeiro) em JSON. Útil para backup e processamento por LLM.
 */
'use client'

import { useState } from 'react'
import { Download, Loader2 } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button } from '@/components/common'

export function ExportarDadosCard() {
  const [exporting, setExporting] = useState(false)

  const handleExportar = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/users/me/export')
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Falha ao exportar')
      }
      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? `backup-crm-${new Date().toISOString().slice(0, 10)}.json`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exportação concluída', {
        description: 'Seus dados foram baixados com sucesso.',
      })
    } catch (error) {
      toast.error('Erro ao exportar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Download className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Exportar dados
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Salva clientes, tarefas, orçamentos, pedidos, metas, financeiro, prospectos e produtos em JSON
            </p>
          </div>
        </div>
        <Button
          onClick={handleExportar}
          disabled={exporting}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
