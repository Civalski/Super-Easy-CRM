'use client'

import type { FormEvent, RefObject } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/common'
import { REGISTER_COPY } from '@/components/features/register/constants'
import { RegisterFormActions } from '@/components/features/register/RegisterFormActions'
import { UserFieldsBlock } from '@/components/features/register/RegisterFields'
import type { LoginThemeAppearance } from '@/components/features/login/types'
import type { RegisterFormValues, RegisterUserInput } from '@/components/features/register/types'

interface RegisterFormProps {
  appearance: LoginThemeAppearance
  error: string
  form: RegisterFormValues
  loading: boolean
  loadingLabel: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onGoogleSignIn?: () => void
  onUpdateField: (field: keyof RegisterFormValues, value: string | boolean) => void
  onUpdateTeamMember: (
    index: number,
    field: keyof RegisterUserInput,
    value: string
  ) => void
  onNextStep: () => void
  onPrevStep: () => void
  onBackToPlanSelection: () => void
  showGoogleSignIn: boolean
  step: number
  totalSteps: number
  isPackage: boolean
  isFirstStep: boolean
  isLastStep: boolean
  showTurnstile: boolean
  turnstileContainerRef: RefObject<HTMLDivElement | null>
  turnstileReady: boolean
}

export function RegisterForm({
  appearance,
  error,
  form,
  loading,
  loadingLabel,
  onSubmit,
  onGoogleSignIn,
  onUpdateField,
  isPackage,
  isFirstStep,
  isLastStep,
  onNextStep,
  onPrevStep,
  showGoogleSignIn,
  showTurnstile,
  turnstileContainerRef,
  turnstileReady,
}: RegisterFormProps) {
  const submitLabel = REGISTER_COPY.submitLabelIndividual

  return (
    <section className={`relative flex items-center justify-center px-2 py-6 sm:px-6 lg:px-10 ${appearance.formSection}`}>
      <div className={`relative z-10 w-full max-w-3xl rounded-3xl border p-4 backdrop-blur-xl sm:p-6 ${appearance.formCard}`}>
        <div className="mb-5 flex justify-center">
          <div className="relative flex h-12 w-[220px] items-center justify-center">
            <Image
              src="/arkercrmlogo.png?v=2"
              alt="Arker CRM"
              width={240}
              height={88}
              className="h-12 w-auto object-contain dark:hidden"
            />
            <Image
              src="/arker10.png"
              alt="Arker CRM"
              width={220}
              height={56}
              className="hidden h-10 w-auto object-contain dark:block"
            />
          </div>
        </div>

        <form className="relative space-y-5" onSubmit={onSubmit}>
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
              value={form.website}
              onChange={(event) => onUpdateField('website', event.target.value)}
            />
          </div>

          {showGoogleSignIn && onGoogleSignIn && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onGoogleSignIn}
                className="h-12 w-full gap-2 rounded-xl text-sm font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Entrar com Google
              </Button>
              <div className={`flex items-center gap-3 text-xs ${appearance.helperText}`}>
                <span className="h-px flex-1 bg-current opacity-30" />
                ou preencha o formulario
                <span className="h-px flex-1 bg-current opacity-30" />
              </div>
            </>
          )}

          <UserFieldsBlock form={form} onUpdateField={onUpdateField} />

          {error ? (
            <div className={`rounded-xl border px-3 py-2 text-sm ${appearance.errorBox}`}>
              {error}
            </div>
          ) : null}

          <p className={`pt-1 text-center text-xs ${appearance.helperText}`}>
            {REGISTER_COPY.accessHintIndividual}
          </p>

          {showTurnstile && isLastStep ? (
            <div className="space-y-2">
              <p className={`text-center text-xs ${appearance.helperText}`}>
                Confirme a verificacao anti-bot para continuar.
              </p>
              <div className="flex justify-center">
                <div ref={turnstileContainerRef} className="inline-block min-h-[65px]" />
              </div>
            </div>
          ) : null}

          {showTurnstile && !turnstileReady && isLastStep ? (
            <p className={`text-center text-xs ${appearance.turnstileMessage}`}>
              {REGISTER_COPY.loadingAntiBot}
            </p>
          ) : null}

          <RegisterFormActions
            loading={loading}
            loadingLabel={loadingLabel}
            submitLabel={submitLabel}
            isPackage={isPackage}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onNextStep={onNextStep}
            onPrevStep={onPrevStep}
          />

          <p className={`text-center text-sm ${appearance.helperText}`}>
            Ja tem conta?{' '}
            <Link
              href="/login"
              className={`font-medium transition ${appearance.link}`}
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </section>
  )
}
