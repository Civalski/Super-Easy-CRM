'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirecionamento para a página principal de orcamentos.
 * A criação de orcamentos agora é feita via modal na página /oportunidades.
 */
export default function NovaOportunidadePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/oportunidades')
  }, [router])

  return null
}

