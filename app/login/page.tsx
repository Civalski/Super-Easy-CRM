'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { ArrowRight } from 'lucide-react'

declare global {
  interface Window {
    particlesJS?: (tagId: string, params: unknown) => void
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove?: (widgetId: string) => void
    }
  }
}

function ParticlesJsBackground() {
  const initParticles = () => {
    if (!window.particlesJS) return
    const container = document.getElementById('particles-js-bg')
    if (!container) return

    container.innerHTML = ''
    window.particlesJS('particles-js-bg', {
      interactivity: {
        detect_on: 'canvas',
        events: {
          onclick: {
            enable: false,
            mode: 'push',
          },
          onhover: {
            enable: false,
            mode: 'repulse',
          },
          resize: true,
        },
      },
      particles: {
        color: {
          value: ['#4C1D95', '#5B21B6', '#6D28D9'],
        },
        line_linked: {
          color: '#312E81',
          distance: 250,
          enable: true,
          opacity: 0.45,
          width: 1,
        },
        move: {
          bounce: false,
          direction: 'none',
          enable: true,
          out_mode: 'out',
          random: true,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            value_area: 800,
          },
          value: 80,
        },
        opacity: {
          anim: {
            enable: true,
            opacity_min: 0.1,
            speed: 0.8,
            sync: false,
          },
          random: true,
          value: 0.5,
        },
        shape: {
          stroke: {
            color: '#000000',
            width: 0,
          },
          type: 'circle',
        },
        size: {
          anim: {
            enable: false,
            size_min: 0.1,
            speed: 40,
            sync: false,
          },
          random: true,
          value: 3,
        },
      },
      retina_detect: true,
    })
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
        strategy="afterInteractive"
        onReady={initParticles}
        onLoad={initParticles}
      />
      <div id="particles-js-bg" className="absolute inset-0 h-full w-full" aria-hidden />
    </>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [website, setWebsite] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReady, setTurnstileReady] = useState(!turnstileSiteKey)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const callbackUrlFromQuery = searchParams.get('callbackUrl')
  const callbackUrl =
    callbackUrlFromQuery &&
    callbackUrlFromQuery.startsWith('/') &&
    !callbackUrlFromQuery.startsWith('//') &&
    callbackUrlFromQuery !== '/login' &&
    callbackUrlFromQuery !== '/register'
      ? callbackUrlFromQuery
      : '/dashboard'

  const renderTurnstile = useCallback(() => {
    if (!turnstileSiteKey || !window.turnstile || !turnstileContainerRef.current) {
      return false
    }

    if (turnstileWidgetIdRef.current && window.turnstile.remove) {
      window.turnstile.remove(turnstileWidgetIdRef.current)
      turnstileWidgetIdRef.current = null
    }

    turnstileContainerRef.current.innerHTML = ''
    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
      size: 'normal',
      callback: (token: string) => {
        setTurnstileToken(token)
      },
      'expired-callback': () => {
        setTurnstileToken('')
      },
      'error-callback': () => {
        setTurnstileToken('')
        setError('Nao foi possivel carregar a verificacao anti-bot. Recarregue a pagina.')
      },
    })

    turnstileWidgetIdRef.current = String(widgetId)
    setTurnstileReady(true)
    return true
  }, [turnstileSiteKey])

  useEffect(() => {
    if (!turnstileSiteKey) return

    let attempts = 0
    const maxAttempts = 30
    const interval = window.setInterval(() => {
      attempts += 1
      if (renderTurnstile() || attempts >= maxAttempts) {
        window.clearInterval(interval)
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [renderTurnstile, turnstileSiteKey])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const resolvedTurnstileToken = turnstileToken || (turnstileSiteKey
      ? (
          document.querySelector('input[name="cf-turnstile-response"]') as
            | HTMLInputElement
            | null
        )
          ?.value?.trim() ?? ''
      : '')

    if (turnstileSiteKey && !resolvedTurnstileToken) {
      setError('Confirme a verificacao anti-bot para continuar')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        callbackUrl,
        password,
        redirect: false,
        turnstileToken: resolvedTurnstileToken,
        username,
        website,
      })

      if (!result?.ok || result.error) {
        setError('Falha na autenticacao. Verifique os dados e tente novamente.')
        window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
        setTurnstileToken('')
        setLoading(false)
        return
      }

      const session = await getSession()
      if (!session?.user) {
        setError('Login validado, mas a sessao nao foi criada. Verifique NEXTAUTH_URL e NEXTAUTH_SECRET no deploy.')
        setLoading(false)
        return
      }

      router.replace(callbackUrl)
      router.refresh()
    } catch (_error) {
      setError('Ocorreu um erro ao tentar fazer login')
      window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
      setTurnstileToken('')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.2),transparent_42%)]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        {turnstileSiteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => {
              renderTurnstile()
            }}
          />
        )}

        <section className="relative flex min-h-[40vh] flex-col justify-between overflow-hidden border-b border-slate-800/70 bg-linear-to-br from-purple-950 via-slate-950 to-black px-6 py-8 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-14 lg:py-12">
          <ParticlesJsBackground />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.22),transparent_52%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_75%,rgba(124,58,237,0.14),transparent_46%)]" />

          <div className="relative z-10">
            <Image
              src="/arkerlogo1.png"
              alt="ArkerSoft"
              width={210}
              height={58}
              className="h-9 w-auto object-contain"
            />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <h1 className="crm-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Mantenha o controle da sua empresa e seus clientes no mesmo lugar.
            </h1>
            <p className="max-w-lg text-sm text-slate-200/85 sm:text-base">
              Visualize prioridades, padronize o processo comercial, gerencie pedidos, produtos e tarefas, e monitore cada etapa.
            </p>
          </div>

          <div className="relative z-10 hidden gap-4 text-xs text-slate-200/80 sm:flex">
            <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Automacao comercial</span>
            <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Pipeline em tempo real</span>
            <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">CRM + ERP integrado</span>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-slate-950 px-3 py-8 sm:px-8 lg:px-12">
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-600/70 bg-slate-800/65 p-4 shadow-[0_30px_60px_-40px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex justify-center">
              <Image
                src="/arker10.png"
                alt="Arker CRM"
                width={220}
                height={56}
                className="h-10 w-auto object-contain"
              />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium text-slate-200">
                  Usuario ou email
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="seu.usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                />
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden opacity-0"
              >
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {turnstileSiteKey && (
                <div className="flex justify-center">
                  <div ref={turnstileContainerRef} className="inline-block min-h-[65px]" />
                </div>
              )}

              {turnstileSiteKey && !turnstileReady && (
                <p className="text-center text-xs text-amber-300">
                  Carregando verificacao anti-bot...
                </p>
              )}

              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-xs transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
              >
                {loading ? 'Autenticando...' : 'Entrar no CRM'}
                {!loading && <ArrowRight size={16} />}
              </button>

              <p className="pt-1 text-center text-xs text-slate-400">
                Ao acessar, voce concorda com as politicas internas da plataforma.
              </p>

              <p className="text-center text-sm text-slate-300">
                Nao tem acesso?{' '}
                <Link href="/register" className="font-medium text-indigo-300 transition hover:text-indigo-200">
                  Cadastre-se
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}


