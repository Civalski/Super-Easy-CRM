/**
 * Header da pagina de clientes
 * Design consistente com outras paginas do CRM
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { Button } from '@/components/common'
import { ChevronDown, Download, Filter, Loader2, Plus, Upload, Users } from '@/lib/icons'

interface ClientesHeaderProps {
  onCreateClick?: () => void
  onFilterClick?: () => void
  onDownloadBackup?: () => void
  onRestoreBackup?: (file: File) => void
  backupLoading?: boolean
  searchValue: string
  onSearchChange: (value: string) => void
}

export function ClientesHeader({
  onCreateClick,
  onFilterClick,
  onDownloadBackup,
  onRestoreBackup,
  backupLoading,
  searchValue,
  onSearchChange,
}: ClientesHeaderProps) {
  const [backupMenuOpen, setBackupMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const backupButtonRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!backupMenuOpen || !backupButtonRef.current) return
    const updatePos = () => {
      const el = backupButtonRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        setMenuPosition({ top: rect.bottom + 4, left: rect.right - 180 })
      }
    }
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [backupMenuOpen])

  const handleRestoreClick = () => {
    setBackupMenuOpen(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file && onRestoreBackup) {
      onRestoreBackup(file)
    }
  }

  const hasBackupActions = Boolean(onDownloadBackup || onRestoreBackup)

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seus clientes e contatos</p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
        <label className="w-full md:w-[328px] lg:w-[388px]">
          <input
            type="text"
            placeholder="Buscar por codigo, nome, celular, CPF ou CNPJ"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </label>
        {onFilterClick ? (
          <Button variant="secondary" onClick={onFilterClick}>
            <Filter size={20} className="mr-2" />
            Filtrar
          </Button>
        ) : null}
        {hasBackupActions ? (
          <div className="relative" ref={backupButtonRef}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="secondary"
              disabled={backupLoading}
              onClick={() => setBackupMenuOpen((prev) => !prev)}
            >
              {backupLoading ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                <Download size={20} className="mr-2" />
              )}
              Backup
              <ChevronDown size={16} className="ml-1" />
            </Button>
            {backupMenuOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden
                    onClick={() => setBackupMenuOpen(false)}
                  />
                  <div
                    className="fixed z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    role="menu"
                  >
                    {onDownloadBackup && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => {
                          setBackupMenuOpen(false)
                          onDownloadBackup()
                        }}
                      >
                        <Download size={18} />
                        Baixar backup
                      </button>
                    )}
                    {onRestoreBackup && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={handleRestoreClick}
                      >
                        <Upload size={18} />
                        Importar backup
                      </button>
                    )}
                  </div>
                </>,
                document.body
              )}
          </div>
        ) : null}
        {onCreateClick ? (
          <Button onClick={onCreateClick}>
            <Plus size={20} className="mr-2" />
            Novo Cliente
          </Button>
        ) : (
          <Link href="/clientes/novo">
            <Button>
              <Plus size={20} className="mr-2" />
              Novo Cliente
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
