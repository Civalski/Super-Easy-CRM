'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import {
  PasswordChangeForm,
  PasswordPageShell,
  PasswordResetRequestForm,
  useRecoveryPasswordReset,
  useResetPasswordRequest,
} from '@/components/features/alterar-senha'

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const {
    error: recoveryError,
    hasRecoveryToken,
    info: recoveryInfo,
    loading: recoveryLoading,
    setField,
    values,
    verified,
    verifying,
    handleSubmit: handleRecoverySubmit,
  } = useRecoveryPasswordReset({ code, tokenHash, type })

  const requestInitialInfo =
    hasRecoveryToken && !verified && !verifying
      ? recoveryError || 'O link de redefinicao nao e mais valido. Solicite um novo.'
      : ''

  const {
    email,
    error: requestError,
    info: requestInfo,
    loading: requestLoading,
    hideTurnstilePrompt,
    setEmail,
    setWebsite,
    showTurnstilePrompt,
    success,
    handleSubmit: handleRequestSubmit,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    website,
  } = useResetPasswordRequest(requestInitialInfo)

  if (verifying) {
    return (
      <PasswordPageShell
        title="Verificando link"
        description="Estamos validando sua solicitacao de redefinicao."
        footerLinkHref="/login"
        footerLinkLabel="Voltar ao login"
      >
        <div className="text-sm text-slate-300">Aguarde um instante...</div>
      </PasswordPageShell>
    )
  }

  if (verified) {
    return (
      <PasswordPageShell
        title="Redefinir senha"
        description="Crie uma nova senha para acessar sua conta."
        footerLinkHref={recoveryInfo ? '/login?reset=success' : '/login'}
        footerLinkLabel={recoveryInfo ? 'Voltar ao login' : 'Cancelar'}
      >
        <PasswordChangeForm
          error={recoveryError}
          info={recoveryInfo}
          loading={recoveryLoading}
          mode="recovery"
          onChange={setField}
          onSubmit={handleRecoverySubmit}
          submitLabel="Redefinir senha"
          values={values}
        />
      </PasswordPageShell>
    )
  }

  return (
    <PasswordPageShell
      title={success ? 'Verifique seu email' : 'Redefinir senha'}
      description={
        success
          ? 'Enviamos as instrucoes para redefinicao. Abra o link recebido e volte aqui para concluir.'
          : 'Informe seu email para receber um link seguro de redefinicao.'
      }
      footerLinkHref="/login"
      footerLinkLabel="Voltar ao login"
    >
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      ) : null}

      <PasswordResetRequestForm
        email={email}
        error={requestError}
        info={requestInfo}
        loading={requestLoading}
        onEmailChange={setEmail}
        onSubmit={handleRequestSubmit}
        onWebsiteChange={setWebsite}
        onHideTurnstilePrompt={hideTurnstilePrompt}
        showTurnstilePrompt={showTurnstilePrompt}
        turnstileContainerRef={turnstileContainerRef}
        turnstileReady={turnstileReady}
        turnstileSiteKey={turnstileSiteKey}
        website={website}
      />

      {success ? (
        <p className="mt-4 text-center text-sm text-slate-400">
          Ja recebeu o link?{' '}
          <Link href="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Entrar no CRM
          </Link>
        </p>
      ) : null}
    </PasswordPageShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
