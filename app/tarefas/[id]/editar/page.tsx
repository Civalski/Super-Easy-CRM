'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from '@/lib/icons'

export default function EditarTarefaPage() {
  const router = useRouter()
  const params = useParams()
  const tarefaId = typeof params.id === 'string' ? params.id : params.id?.[0]

  useEffect(() => {
    if (tarefaId) {
      router.replace(`/tarefas?edit=${tarefaId}`)
    } else {
      router.replace('/tarefas')
    }
  }, [router, tarefaId])

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  )
}
