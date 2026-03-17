/**
 * Opcao para iniciar a apresentacao guiada das abas do CRM.
 */
'use client'

import { useSession } from 'next-auth/react'
import { Compass } from '@/lib/icons'
import { menuItems } from '@/lib/menuItems'
import { useGuideTour } from '@/components/layout/GuideTourProvider'
import { toast } from '@/lib/toast'

const GUIDE_ITEMS = menuItems.filter((item) => item.helpDescription || item.guideSteps?.length)

function getVisibleGuideItems(
  session: { user?: { username?: string | null; role?: string | null } } | null
) {
  const username = (session?.user?.username ?? '').trim().toLowerCase()
  const role = session?.user?.role ?? ''

  return GUIDE_ITEMS.filter((item) => {
    if (item.requiresAdmin && role !== 'admin') return false
    if (item.requiresManager && role !== 'manager') return false
    if (!item.visibleForUsernames) return true
    return item.visibleForUsernames.some((value) => value.trim().toLowerCase() === username)
  })
}

export function ApresentacaoGuiadaCard() {
  const { data: session } = useSession()
  const { openGuide } = useGuideTour()

  const handleOpenGuide = () => {
    const visibleItems = getVisibleGuideItems(session)
    if (visibleItems.length === 0) {
      toast.error('Nao encontramos etapas de guia para seu perfil.')
      return
    }

    openGuide(visibleItems)
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Apresentacao guiada</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Mostra como cada aba do CRM funciona, passo a passo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenGuide}
          className="shrink-0 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-600 dark:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/30"
        >
          Iniciar guia
        </button>
      </div>
    </div>
  )
}

