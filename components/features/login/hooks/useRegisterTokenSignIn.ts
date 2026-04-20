'use client'

import { useEffect } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { resolveLoginCallbackUrl } from '../utils'
import {
  readAuthFlowCookie,
  writeAuthFlowCookie,
  clearAuthFlowCookie,
  createFlowNonce,
} from '@/lib/cookies'

async function waitForSessionUser(maxAttempts = 5, delayMs = 150) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession()
    if (session?.user) {
      return session
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }
  }

  return null
}

export type RegisterTokenSignInVariant = 'login' | 'oauthBridge'

/**
 * Conclui login via token (pos-registro ou pos-OAuth Google) com signIn credentials.
 * Em oauthBridge nao limpa a barra de endereco na pagina de login — o redirect sai da rota.
 */
export function useRegisterTokenSignIn(
  setError: (message: string) => void,
  variant: RegisterTokenSignInVariant = 'login'
) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registerTokenParam = searchParams.get('register_token')
  const registerComplete = searchParams.get('register_complete') === '1'
  const urlCallbackUrl = searchParams.get('callbackUrl')
  const callbackUrl = resolveLoginCallbackUrl(searchParams.get('callbackUrl'))

  useEffect(() => {
    const resolveRegisterToken = (): string | null => {
      if (registerTokenParam) return registerTokenParam
      if (!registerComplete || typeof window === 'undefined') return null
      try {
        return sessionStorage.getItem('__register_token')
      } catch {
        return null
      }
    }

    const registerToken = resolveRegisterToken()
    if (!registerToken) {
      if (registerComplete || registerTokenParam) {
        setError('Token de login expirado ou invalido. Tente novamente.')
      }
      return
    }

    let cancelled = false
    const doAutoSignIn = async () => {
      const nonce = createFlowNonce(registerToken)
      const flow = readAuthFlowCookie()

      if (flow?.nonce === nonce && (flow?.status === 'processing' || flow?.status === 'done')) {
        return
      }

      try {
        writeAuthFlowCookie({
          source: registerComplete ? 'oauth' : 'register',
          callbackUrl: urlCallbackUrl || callbackUrl,
          nonce,
          status: 'processing',
        })

        const result = await signIn('credentials', {
          callbackUrl: urlCallbackUrl || callbackUrl,
          redirect: false,
          registerToken,
          username: '',
          password: '',
        })
        if (cancelled) return
        if (result?.ok && !result.error) {
          const session = await waitForSessionUser()
          if (session?.user) {
            clearAuthFlowCookie()
            try {
              sessionStorage.removeItem('__register_token')
            } catch {
              /* ignore */
            }
            if (
              variant === 'login' &&
              registerComplete &&
              typeof window !== 'undefined'
            ) {
              const cleaned = new URL(window.location.href)
              cleaned.searchParams.delete('register_complete')
              window.history.replaceState(null, '', cleaned.toString())
            }
            if (typeof window !== 'undefined') {
              window.location.replace(urlCallbackUrl || callbackUrl)
              return
            }
            router.replace(urlCallbackUrl || callbackUrl)
            router.refresh()
            return
          }
        }
        clearAuthFlowCookie()
        try {
          sessionStorage.removeItem('__register_token')
        } catch {
          /* ignore */
        }
        setError('Token de login expirado ou invalido. Tente novamente.')
      } catch {
        clearAuthFlowCookie()
        try {
          sessionStorage.removeItem('__register_token')
        } catch {
          /* ignore */
        }
        if (!cancelled) setError('Ocorreu um erro ao concluir o login.')
      }
    }
    void doAutoSignIn()
    return () => {
      cancelled = true
    }
  }, [
    registerTokenParam,
    registerComplete,
    urlCallbackUrl,
    callbackUrl,
    router,
    setError,
    variant,
  ])
}
