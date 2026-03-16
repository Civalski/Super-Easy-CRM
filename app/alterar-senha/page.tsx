'use client'

import { ShieldCheck } from '@/lib/icons'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'
import {
  PasswordChangeForm,
  useAuthenticatedPasswordChange,
} from '@/components/features/alterar-senha'

function AlterarSenhaHeader() {
  const minimal = usePageHeaderMinimal()

  if (minimal) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 p-2.5 shadow-lg shadow-emerald-500/25">
        <ShieldCheck className="h-6 w-6 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Alterar senha
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Atualize sua senha sem sair do CRM.
        </p>
      </div>
    </div>
  )
}

export default function AlterarSenhaPage() {
  const { error, info, loading, setField, values, handleSubmit } =
    useAuthenticatedPasswordChange()

  return (
    <div className="max-w-2xl space-y-6">
      <AlterarSenhaHeader />

      <section className="crm-card max-w-xl p-5">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Trocar senha da conta
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Informe sua senha atual e confirme a nova senha duas vezes.
          </p>
        </div>

        <PasswordChangeForm
          error={error}
          info={info}
          loading={loading}
          mode="authenticated"
          onChange={setField}
          onSubmit={handleSubmit}
          submitLabel="Salvar nova senha"
          values={values}
        />
      </section>
    </div>
  )
}
