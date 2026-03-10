'use client'

import { useEffect, useState } from 'react'
import {
  PAGE_HEADER_EVENT,
  getHidePageHeaderDecorations,
} from '@/lib/ui/pageHeaderPreference'

/** Retorna true quando ícones e descrições devem ser ocultados nos headers das páginas */
export function usePageHeaderMinimal(): boolean {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const sync = () => setHide(getHidePageHeaderDecorations())
    const handleChange = (event: Event) => {
      const e = event as CustomEvent<boolean>
      setHide(e.detail)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(PAGE_HEADER_EVENT, handleChange as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(PAGE_HEADER_EVENT, handleChange as EventListener)
    }
  }, [])

  return hide
}
