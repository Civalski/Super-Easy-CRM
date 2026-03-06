/**
 * Header da pagina de clientes
 * Design consistente com outras paginas do CRM
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Filter, Plus, Users } from '@/lib/icons'

interface ClientesHeaderProps {
  onCreateClick?: () => void
  onFilterClick?: () => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export function ClientesHeader({ onCreateClick, onFilterClick, searchValue, onSearchChange }: ClientesHeaderProps) {
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
