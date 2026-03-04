'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/common'

interface SubscriptionPayload {
  provider: string | null
  status: string
  active: boolean
  subscriptionId: string | null
  checkoutUrl: string | null
  nextBillingAt: string | null
  amount: number
  currencyId: string
  frequency: number
  frequencyType: string
}

const STATUS_COPY: Record<string, string> = {
  inactive: 'Inativa',
  pending: 'Pendente',
  authorized: 'Ativa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  authorized: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  paused: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function AssinaturaMercadoPagoCard() {
  const [subscription, setSubscription] = useState<SubscriptionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const loadStatus = useCallback(async (sync = false) => {
    if (sync) setSyncing(true)
    else setLoading(true)

    try {
      const response = await fetch(
        `/api/billing/mercado-pago/subscription${sync ? '?sync=1' : ''}`,
        { cache: 'no-store' }
      )
      const data = (await response.json()) as SubscriptionPayload & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel consultar assinatura')
      }

      setSubscription(data)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao consultar assinatura')
    } finally {
      if (sync) setSyncing(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const amountLabel = useMemo(() => {
    const amount = subscription?.amount ?? 24.9
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: subscription?.currencyId || 'BRL',
    }).format(amount)
  }, [subscription?.amount, subscription?.currencyId])

  const status = subscription?.status ?? 'inactive'
  const statusLabel = STATUS_COPY[status] || status
  const badgeClass =
    STATUS_BADGE_CLASS[status] ||
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

  const handleStartSubscription = async () => {
    setStarting(true)
    setError('')

    try {
      const response = await fetch('/api/billing/mercado-pago/subscription', {
        method: 'POST',
      })
      const data = (await response.json()) as {
        checkoutUrl?: string | null
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel iniciar assinatura')
      }

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl)
        return
      }

      await loadStatus(true)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Erro ao iniciar assinatura')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Assinatura</p>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${badgeClass}`}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Plano mensal de {amountLabel} por mes (Mercado Pago).
          </p>
          {subscription?.nextBillingAt && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Proxima cobranca:{' '}
              {new Date(subscription.nextBillingAt).toLocaleDateString('pt-BR')}
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void loadStatus(true)}
            disabled={loading || syncing || starting}
            className="gap-1.5"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Atualizar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleStartSubscription}
            disabled={loading || starting || subscription?.active === true}
            className="gap-1.5"
          >
            {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {subscription?.active ? 'Assinatura ativa' : 'Assinar agora'}
          </Button>
        </div>
      </div>
    </div>
  )
}
