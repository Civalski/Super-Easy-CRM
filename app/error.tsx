'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro não tratado:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
        <h2 className="text-lg font-semibold text-red-400">
          Algo deu errado
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Recarregar página
          </button>
        </div>
      </div>
    </div>
  )
}
