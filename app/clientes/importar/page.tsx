'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { readCsvToObjects } from '@/lib/csv'

function ImportarClientesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const autoOpen = searchParams.get('auto') === '1'

  useEffect(() => {
    if (!autoOpen || !inputRef.current) return
    const t = setTimeout(() => inputRef.current?.click(), 100)
    return () => clearTimeout(t)
  }, [autoOpen])

  function detectarFormato(rows: Record<string, unknown>[]): 'clientes' | 'leads' {
    const first = rows[0]
    if (!first) return 'leads'
    const keys = Object.keys(first).map((k) => k.toLowerCase().trim())
    const has = (k: string) => keys.some((x) => x === k || x.includes(k))
    if (keys.includes('perfil') || (has('nome') && (has('cargo') || has('website') || has('dataNascimento') || has('camposPersonalizados')))) {
      return 'clientes'
    }
    if (has('razao social') || has('cod atividade') || has('natureza juridica') || (has('cnpj') && has('municipio'))) {
      return 'leads'
    }
    return has('nome') || has('email') ? 'clientes' : 'leads'
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let loadingId: string | number | undefined = toast.loading('Lendo arquivo...')
    let importId: string | number | undefined = undefined

    try {
      const lowerName = file.name.toLowerCase()
      if (!lowerName.endsWith('.csv')) {
        throw new Error('Formato nao suportado. Use arquivo .csv')
      }
      const text = await file.text()
      const jsonData = readCsvToObjects(text) as Record<string, unknown>[]
      if (jsonData.length === 0) {
        throw new Error('O arquivo esta vazio')
      }

      const formato = detectarFormato(jsonData)
      const rowsAsStrings = jsonData.map((r) => {
        const out: Record<string, string> = {}
        for (const [k, v] of Object.entries(r)) {
          out[k] = v != null ? String(v) : ''
        }
        return out
      })

      toast.dismiss(loadingId)
      importId = toast.loading(
        formato === 'leads'
          ? `Importando ${rowsAsStrings.length} lead(s) e convertendo em cliente(s)...`
          : `Importando ${rowsAsStrings.length} cliente(s)...`
      )

      const url = formato === 'leads' ? '/api/clientes/import-via-leads' : '/api/clientes/import'
      const body = formato === 'leads' ? { empresas: rowsAsStrings } : { clientes: rowsAsStrings }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()

      toast.dismiss(importId)
      if (!res.ok) throw new Error(result.error || 'Erro ao importar')

      toast.success('Importacao concluida!', { description: result.mensagem })
      if (typeof window !== 'undefined' && window !== window.top) {
        window.top!.location.href = '/clientes'
      } else {
        router.push('/clientes')
      }
    } catch (err) {
      toast.dismiss(loadingId)
      toast.dismiss(importId)
      toast.error('Erro na importacao', {
        description: err instanceof Error ? err.message : 'Nao foi possivel processar o arquivo.',
      })
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft size={18} />
        Voltar para clientes
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Importar clientes</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Suporta dois formatos: (1) Backup de clientes exportado pelo sistema (perfil, nome, email, empresa, cnpj, razaoSocial, etc.) e (2) Leads do funil (CNPJ, Razao Social, Nome Fantasia, Municipio, UF, Telefone, Email). O formato e detectado automaticamente. B2B/B2C identificado pelo perfil ou pela presenca de CNPJ/razao social.
        </p>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/50 p-8 transition-colors hover:border-sky-400 hover:bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20 dark:hover:border-sky-700 dark:hover:bg-sky-900/30">
          <input
            ref={inputRef}
            id="import-csv-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Upload size={48} className="text-sky-600 dark:text-sky-400" />
          <span className="mt-3 text-base font-medium text-sky-700 dark:text-sky-200">
            Clique para selecionar o arquivo CSV
          </span>
        </label>
      </div>
    </div>
  )
}

export default function ImportarClientesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900" />}>
      <ImportarClientesContent />
    </Suspense>
  )
}
