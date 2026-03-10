'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/common'
import { ChevronDown, Download, Filter, Plus, Upload, Users } from '@/lib/icons'

interface ClientesHeaderProps {
  onCreateClick?: () => void
  onFilterClick?: () => void
  onExportCsvClick?: () => void
  onImportClick?: () => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export function ClientesHeader({
  onCreateClick,
  onFilterClick,
  onExportCsvClick,
  onImportClick,
  searchValue,
  onSearchChange,
}: ClientesHeaderProps) {
  const [backupOpen, setBackupOpen] = useState(false)

  const handleExport = () => {
    setBackupOpen(false)
    onExportCsvClick?.()
  }

  const handleImport = () => {
    setBackupOpen(false)
    onImportClick?.()
  }

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

        {(onExportCsvClick || onImportClick) ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setBackupOpen((o) => !o)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-xs bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Backup
              <ChevronDown size={18} className={`transition-transform ${backupOpen ? 'rotate-180' : ''}`} />
            </button>
            {backupOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBackupOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                  {onExportCsvClick && (
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Download size={18} />
                      Exportar
                    </button>
                  )}
                  {onImportClick && (
                    <button
                      type="button"
                      onClick={handleImport}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Upload size={18} />
                      Importar
                    </button>
                  )}
                </div>
              </>
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
