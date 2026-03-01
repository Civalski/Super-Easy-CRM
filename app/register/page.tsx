'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    const container = document.getElementById('particles-js-bg-register')
    if (!container) return

    container.innerHTML = ''
    window.particlesJS('particles-js-bg-register', {
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
      <div
        id="particles-js-bg-register"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
    </>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [website, setWebsite] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReady, setTurnstileReady] = useState(!turnstileSiteKey)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    setError('')
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedName || !normalizedEmail) {
      setError('Preencha nome e email para continuar')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas nao conferem')
      return
    }

    setLoading(true)

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          username,
          password,
          code,
          website,
          turnstileToken: resolvedTurnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || 'Erro ao registrar usuario')
        window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
        setTurnstileToken('')
        setLoading(false)
        return
      }

      router.push('/login')
    } catch (err) {
      setError('Erro ao registrar usuario')
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

        <section className="relative flex min-h-[40vh] flex-col justify-between overflow-hidden border-b border-slate-800/70 bg-gradient-to-br from-purple-950 via-slate-950 to-black px-6 py-8 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-14 lg:py-12">
          <ParticlesJsBackground />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.22),transparent_52%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_75%,rgba(124,58,237,0.14),transparent_46%)]" />

          <div className="relative z-10">
            <Image
              src="/arker10.png"
              alt="Arker CRM"
              width={240}
              height={66}
              className="h-11 w-auto object-contain"
            />
          </div>

          <div className="relative z-10 max-w-xl space-y-4">
            <h1 className="crm-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Crie sua conta e padronize seu processo comercial.
            </h1>
            <p className="max-w-lg text-sm text-slate-200/85 sm:text-base">
              Ative o CRM com codigo de registro e mantenha clientes, oportunidades, pedidos e tarefas no mesmo fluxo.
            </p>
          </div>

          <div className="relative z-10 hidden gap-4 text-xs text-slate-200/80 sm:flex">
            <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Cadastro seguro</span>
            <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Turnstile ativo</span>
            <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Acesso por convite</span>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-slate-950 px-2 py-6 sm:px-6 lg:px-10">
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-600/70 bg-slate-800/65 p-4 shadow-[0_30px_60px_-40px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-6">
            <div className="mb-4 space-y-1.5 text-left">
              <h2 className="crm-display text-3xl font-semibold text-white">Criar conta</h2>
              <p className="text-sm text-slate-300">Informe seus dados e o codigo de registro.</p>
            </div>

            <form className="relative grid gap-3 sm:gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-slate-200">
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium text-slate-200">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="seu.usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
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
                  autoComplete="new-password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="code" className="text-sm font-medium text-slate-200">
                  Codigo de registro
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  placeholder="Digite o codigo"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
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
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 md:col-span-2">
                  {error}
                </div>
              )}

              <p className="pt-1 text-center text-xs text-slate-400 md:col-span-2">
                O acesso e liberado apenas com codigo de registro valido.
              </p>
              <p className="text-center text-xs text-slate-300 md:col-span-2">
                Para adquirir uma chave de acesso, entre em contato com um consultor:{' '}
                <a
                  href="https://wa.me/5519998205608?text=Ol%C3%A1%2C%20gostaria%20de%20adquirir%20uma%20chave%20de%20acesso%20para%20o%20CRM"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-emerald-300 transition hover:text-emerald-200"
                >
                  WhatsApp (19) 99820-5608
                </a>
              </p>

              {turnstileSiteKey && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-center text-xs text-slate-400">
                    Confirme a verificacao anti-bot para continuar.
                  </p>
                  <div className="flex justify-center">
                    <div ref={turnstileContainerRef} className="inline-block min-h-[65px]" />
                  </div>
                </div>
              )}

              {turnstileSiteKey && !turnstileReady && (
                <p className="text-center text-xs text-amber-300 md:col-span-2">
                  Carregando verificacao anti-bot...
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
                {!loading && <ArrowRight size={16} />}
              </button>

              <p className="text-center text-sm text-slate-300 md:col-span-2">
                Ja tem conta?{' '}
                <Link href="/login" className="font-medium text-indigo-300 transition hover:text-indigo-200">
                  Entrar
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

