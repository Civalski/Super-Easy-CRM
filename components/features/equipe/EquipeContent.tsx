'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { EquipeEmptyState } from './EquipeEmptyState'
import { EquipeHeader } from './EquipeHeader'
import { EquipeLoading } from './EquipeLoading'
import { EquipeMembersTable } from './EquipeMembersTable'
import { EquipeOverviewCards } from './EquipeOverviewCards'
import { useEquipe } from './hooks/useEquipe'
import type { TeamPeriod } from './types'
import { formatPeriodRange, sortMembersByPeriod } from './utils'

export function EquipeContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activePeriod, setActivePeriod] = useState<TeamPeriod>('week')
  const { data, error, isLoading, isRefreshing, mutate } = useEquipe()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'manager') {
      router.replace('/dashboard')
    }
  }, [session?.user?.role, status, router])

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'manager')) {
    return null
  }

  if (error && !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <section className="crm-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nao foi possivel carregar a equipe
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Erro inesperado ao carregar os indicadores.'}
          </p>
        </section>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <EquipeLoading />
      </div>
    )
  }

  const periodLabel = formatPeriodRange(activePeriod, data.periods[activePeriod])
  const sortedMembers = sortMembersByPeriod(data.members, activePeriod)

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <EquipeHeader
        activePeriod={activePeriod}
        onPeriodChange={setActivePeriod}
        memberCount={data.members.length}
        teamName={data.teamName}
        periodLabel={periodLabel}
        isRefreshing={isRefreshing}
        onRefresh={() => void mutate()}
      />

      {error ? (
        <section className="crm-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nao foi possivel carregar a equipe
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Erro inesperado ao carregar os indicadores.'}
          </p>
        </section>
      ) : null}

      {!error && (
        <>
          <EquipeOverviewCards metrics={data.totals[activePeriod]} />
          {sortedMembers.length > 0 ? (
            <EquipeMembersTable members={sortedMembers} activePeriod={activePeriod} />
          ) : (
            <EquipeEmptyState />
          )}
        </>
      )}
    </div>
  )
}
