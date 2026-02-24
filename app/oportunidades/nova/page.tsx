'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirecionamento para a página principal de propostas.
 * A criação de propostas agora é feita via modal na página /oportunidades.
 */
export default function NovaOportunidadePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/oportunidades')
  }, [router])

  return null
}
