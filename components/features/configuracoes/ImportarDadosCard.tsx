/**
 * Opção para importar dados de um backup JSON (exceto clientes).
 * Clientes devem ser importados manualmente na aba de clientes.
 */
'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button } from '@/components/common'

export function ImportarDadosCard() {
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object') {
        throw new Error('Arquivo JSON inválido')
      }

      const response = await fetch('/api/users/me/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao importar')
      }

      toast.success('Importação concluída', {
        description: result.message,
      })
    } catch (error) {
      toast.error('Erro ao importar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setImporting(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!importing) inputRef.current?.click()
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="crm-card p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Upload className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Importar dados
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Restaura tarefas, orçamentos, pedidos, metas, financeiro, prospectos e produtos. Importe clientes na aba Clientes.
              </p>
            </div>
          </div>
          <Button
            onClick={handleClick}
            disabled={importing}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
