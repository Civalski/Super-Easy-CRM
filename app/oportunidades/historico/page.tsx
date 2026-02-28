'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirecionamento para a página principal de orcamentos.
 * O histórico agora está integrado na aba "Histórico" em /oportunidades.
 */
export default function HistoricoOportunidadesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/oportunidades')
  }, [router])

  return null
}

