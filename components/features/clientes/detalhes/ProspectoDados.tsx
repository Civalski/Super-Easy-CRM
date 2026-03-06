'use client'

import { BadgeDollarSign, Briefcase, Building, Building2, FileText, Scale, Tag } from '@/lib/icons'
import type { Prospecto } from './types'
import { formatCapitalSocial } from './utils'

interface ProspectoDadosProps {
  prospecto: Prospecto
}

function DataCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  )
}

export function ProspectoDados({ prospecto }: ProspectoDadosProps) {
  const situacaoAtiva = prospecto.situacaoCadastral?.toLowerCase().includes('ativa')

  return (
    <section className="crm-card border border-gray-200/70 p-4 md:p-5 dark:border-gray-700">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Dados empresariais</h3>
        </div>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          Receita Federal
        </span>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <DataCell label="CNPJ" value={prospecto.cnpj || '-'} />
          <DataCell label="Razao social" value={prospecto.razaoSocial || '-'} />
          <DataCell label="Nome fantasia" value={prospecto.nomeFantasia || '-'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Capital social
            </p>
            <p className="text-sm text-gray-900 dark:text-white">{formatCapitalSocial(prospecto.capitalSocial)}</p>
          </div>
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Briefcase className="h-3.5 w-3.5" />
              Porte
            </p>
            <p className="text-sm text-gray-900 dark:text-white">{prospecto.porte || '-'}</p>
          </div>
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Scale className="h-3.5 w-3.5" />
              Natureza juridica
            </p>
            <p className="text-sm text-gray-900 dark:text-white">{prospecto.naturezaJuridica || '-'}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              CNAE principal
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {prospecto.cnaePrincipal && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                  {prospecto.cnaePrincipal}
                </span>
              )}
              <span className="text-sm text-gray-900 dark:text-white">{prospecto.cnaePrincipalDesc || '-'}</span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Building2 className="h-3.5 w-3.5" />
              Matriz/filial
            </p>
            <p className="text-sm text-gray-900 dark:text-white">{prospecto.matrizFilial || '-'}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Tag className="h-3.5 w-3.5" />
              Situacao cadastral
            </p>
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                situacaoAtiva
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
              }`}
            >
              {prospecto.situacaoCadastral || '-'}
            </span>
          </div>
          <DataCell label="Data abertura" value={prospecto.dataAbertura || '-'} />
          <DataCell label="Lote" value={prospecto.lote || '-'} />
        </div>
      </div>
    </section>
  )
}
