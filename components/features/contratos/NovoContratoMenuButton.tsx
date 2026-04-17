'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus } from '@/lib/icons'
import { Button } from '@/components/common'

interface NovoContratoMenuButtonProps {
  onSelect: (mode: 'manual' | 'ia') => void
  variant?: 'contrato' | 'proposta'
}

export function NovoContratoMenuButton({ onSelect, variant = 'contrato' }: NovoContratoMenuButtonProps) {
  const isProposta = variant === 'proposta'
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleSelect = (mode: 'manual' | 'ia') => {
    setOpen(false)
    onSelect(mode)
  }

  return (
    <div ref={menuRef} className="relative inline-flex">
      <Button onClick={() => setOpen((prev) => !prev)}>
        <Plus size={16} className="mr-1.5" /> {isProposta ? 'Nova proposta' : 'Novo contrato'}
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => handleSelect('manual')}
            className="block w-full border-b border-gray-200 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Gerar manualmente
          </button>
          <button
            type="button"
            onClick={() => handleSelect('ia')}
            className="block w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Gerar com I.A
          </button>
        </div>
      ) : null}
    </div>
  )
}
