'use client'

import { useMemo } from 'react'
import { RotateCcw, Trophy } from '@/lib/icons'
import {
  CLIENTES_COMMERCIAL_STATUS_OPTIONS,
  CLIENTES_LAST_CONTACT_OPTIONS,
  CLIENTES_LAST_PURCHASE_OPTIONS,
  CLIENTES_REVENUE_RANGE_OPTIONS,
} from './constants'

type OptionalFilterKey = 'profile' | 'topCustomers' | 'cidade' | 'estado' | 'commercialStatus' | 'lastPurchaseDays' | 'lastContactDays' | 'revenueRange'

interface ClientesFiltersProps {
  open: boolean
  searchValue: string
  profileValue: '' | 'b2b' | 'b2c'
  enabledFilters: OptionalFilterKey[]
  cidadeValue: string
  estadoValue: string
  commercialStatusValue: string
  lastPurchaseDaysValue: string
  lastContactDaysValue: string
  revenueRangeValue: string
  topCustomersOnly: boolean
  onToggleFilter: (key: OptionalFilterKey) => void
  onClose: () => void
  onProfileChange: (value: '' | 'b2b' | 'b2c') => void
  onCidadeChange: (value: string) => void
  onEstadoChange: (value: string) => void
  onCommercialStatusChange: (value: string) => void
  onLastPurchaseDaysChange: (value: string) => void
  onLastContactDaysChange: (value: string) => void
  onRevenueRangeChange: (value: string) => void
  onTopCustomersOnlyChange: (value: boolean) => void
  onClearFilters: () => void
}

export function ClientesFilters({
  open,
  searchValue,
  profileValue,
  enabledFilters,
  cidadeValue,
  estadoValue,
  commercialStatusValue,
  lastPurchaseDaysValue,
  lastContactDaysValue,
  revenueRangeValue,
  topCustomersOnly,
  onToggleFilter,
  onClose,
  onProfileChange,
  onCidadeChange,
  onEstadoChange,
  onCommercialStatusChange,
  onLastPurchaseDaysChange,
  onLastContactDaysChange,
  onRevenueRangeChange,
  onTopCustomersOnlyChange,
  onClearFilters,
}: ClientesFiltersProps) {
  const filterOptions = useMemo(
    () =>
      [
        { key: 'profile', label: 'Perfil (B2B/B2C)' },
        { key: 'topCustomers', label: 'Melhores clientes' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'estado', label: 'UF' },
        { key: 'commercialStatus', label: 'Status comercial' },
        { key: 'lastPurchaseDays', label: 'Ultima compra' },
        { key: 'lastContactDays', label: 'Ultimo contato' },
        { key: 'revenueRange', label: 'Valor comprado' },
      ] as Array<{ key: OptionalFilterKey; label: string }>,
    []
  )

  const isFilterEnabled = (key: OptionalFilterKey) => enabledFilters.includes(key)
  const hasVisibleAdvancedFilters =
    isFilterEnabled('profile') ||
    isFilterEnabled('topCustomers') ||
    isFilterEnabled('cidade') ||
    isFilterEnabled('estado') ||
    isFilterEnabled('commercialStatus') ||
    isFilterEnabled('lastPurchaseDays') ||
    isFilterEnabled('lastContactDays') ||
    isFilterEnabled('revenueRange')

  const hasActiveFilters = Boolean(
    searchValue.trim() ||
      (isFilterEnabled('profile') && profileValue) ||
      cidadeValue.trim() ||
      estadoValue.trim() ||
      commercialStatusValue ||
      lastPurchaseDaysValue ||
      lastContactDaysValue ||
      revenueRangeValue ||
      topCustomersOnly
  )

  return (
    <div className={`relative ${hasVisibleAdvancedFilters ? 'mb-4 space-y-2' : 'mb-0'}`}>
      {open ? (
        <div className="absolute right-0 top-0 z-20 min-w-[240px] rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="space-y-1">
            {filterOptions.map((option) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={isFilterEnabled(option.key)}
                  onChange={() => onToggleFilter(option.key)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Fechar
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RotateCcw size={12} className="mr-1" />
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {hasVisibleAdvancedFilters ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {isFilterEnabled('profile') ? (
          <select
            value={profileValue}
            onChange={(event) => onProfileChange(event.target.value as '' | 'b2b' | 'b2c')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Perfil: Todos</option>
            <option value="b2b">Perfil B2B</option>
            <option value="b2c">Perfil B2C</option>
          </select>
        ) : null}
        {isFilterEnabled('topCustomers') ? (
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => onTopCustomersOnlyChange(false)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                !topCustomersOnly
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onTopCustomersOnlyChange(true)}
              className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                topCustomersOnly
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Trophy size={12} className="mr-1" />
              Melhores clientes
            </button>
          </div>
        ) : null}
        {isFilterEnabled('cidade') ? (
          <input
            type="text"
            placeholder="Cidade"
            value={cidadeValue}
            onChange={(event) => onCidadeChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        ) : null}
        {isFilterEnabled('estado') ? (
          <input
            type="text"
            maxLength={2}
            placeholder="UF"
            value={estadoValue}
            onChange={(event) => onEstadoChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm uppercase dark:border-gray-600 dark:bg-gray-800"
          />
        ) : null}
        {isFilterEnabled('commercialStatus') ? (
          <select
            value={commercialStatusValue}
            onChange={(event) => onCommercialStatusChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {CLIENTES_COMMERCIAL_STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        {isFilterEnabled('lastPurchaseDays') ? (
          <select
            value={lastPurchaseDaysValue}
            onChange={(event) => onLastPurchaseDaysChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {CLIENTES_LAST_PURCHASE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        {isFilterEnabled('lastContactDays') ? (
          <select
            value={lastContactDaysValue}
            onChange={(event) => onLastContactDaysChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {CLIENTES_LAST_CONTACT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        {isFilterEnabled('revenueRange') ? (
          <select
            value={revenueRangeValue}
            onChange={(event) => onRevenueRangeChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {CLIENTES_REVENUE_RANGE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        </div>
      ) : null}
    </div>
  )
}
