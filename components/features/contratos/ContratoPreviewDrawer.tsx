'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import type { Contrato } from './types'

interface ContratoPreviewDrawerProps {
  open: boolean
  contrato: Contrato | null
  onClose: () => void
}

async function fetchPreviewPdfWithFallback(contratoId: string): Promise<Blob> {
  const urls = [`/api/contratos/${contratoId}/pdf-v2?preview=1`, `/api/contratos/${contratoId}/pdf?preview=1`]
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Nao foi possivel carregar o PDF para preview.')
      }
      return await response.blob()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro ao carregar preview do PDF.')
    }
  }

  throw lastError || new Error('Nao foi possivel carregar o PDF para preview.')
}

export function ContratoPreviewDrawer({
  open,
  contrato,
  onClose,
}: ContratoPreviewDrawerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const docNum = useMemo(() => String(contrato?.numero || 0).padStart(5, '0'), [contrato?.numero])
  const documentLabel = contrato?.tipo === 'proposta' ? 'proposta' : 'contrato'

  useEffect(() => {
    let isCancelled = false
    let objectUrl: string | null = null

    const run = async () => {
      if (!open || !contrato) return

      setLoadingPreview(true)
      setErrorMessage(null)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })

      try {
        const blob = await fetchPreviewPdfWithFallback(contrato.id)
        if (isCancelled) return

        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o preview.')
      } finally {
        if (!isCancelled) setLoadingPreview(false)
      }
    }

    void run()

    return () => {
      isCancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [contrato, open])

  if (!contrato) return null

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Preview da {documentLabel} #{docNum}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{contrato.titulo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
          {loadingPreview ? (
            <div className="flex h-full items-center justify-center px-6 text-sm text-gray-500 dark:text-gray-300">
              Gerando preview do PDF...
            </div>
          ) : errorMessage ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          ) : (
            <iframe
              src={previewUrl ?? undefined}
              title={`Preview ${documentLabel} ${docNum}`}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </SideCreateDrawer>
  )
}
