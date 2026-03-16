'use client'

import { REGISTER_COPY, REGISTER_INPUT_CLASS } from '@/components/features/register/constants'
import { formatPhoneInput } from '@/components/features/register/utils'
import type { RegisterFormValues, RegisterUserInput } from '@/components/features/register/types'

type UserFieldsBlockProps = {
  form: RegisterFormValues
  onUpdateField: (field: keyof RegisterFormValues, value: string | boolean) => void
  showConfirmPassword?: boolean
}

export function UserFieldsBlock({
  form,
  onUpdateField,
  showConfirmPassword = true,
}: UserFieldsBlockProps) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Seu nome"
          value={form.name}
          onChange={(event) => onUpdateField('name', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={form.email}
          onChange={(event) => onUpdateField('email', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {REGISTER_COPY.phoneLabel}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={form.phone}
          onChange={(event) => onUpdateField('phone', formatPhoneInput(event.target.value))}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="seu.usuario"
          value={form.username}
          onChange={(event) => onUpdateField('username', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="********"
          value={form.password}
          onChange={(event) => onUpdateField('password', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      {showConfirmPassword ? (
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="********"
            value={form.confirmPassword}
            onChange={(event) => onUpdateField('confirmPassword', event.target.value)}
            className={REGISTER_INPUT_CLASS}
          />
        </div>
      ) : null}
    </div>
  )
}

type TeamMemberFieldsBlockProps = {
  member: RegisterUserInput
  memberIndex: number
  onUpdateTeamMember: (index: number, field: keyof RegisterUserInput, value: string) => void
}

export function TeamMemberFieldsBlock({
  member,
  memberIndex,
  onUpdateTeamMember,
}: TeamMemberFieldsBlockProps) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {REGISTER_COPY.memberNumber} {memberIndex + 1}
        </span>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome</label>
        <input
          type="text"
          placeholder="Nome"
          value={member.name}
          onChange={(event) => onUpdateTeamMember(memberIndex, 'name', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
        <input
          type="email"
          placeholder="voce@empresa.com"
          value={member.email}
          onChange={(event) => onUpdateTeamMember(memberIndex, 'email', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Usuario</label>
        <input
          type="text"
          placeholder="seu.usuario"
          value={member.username}
          onChange={(event) => onUpdateTeamMember(memberIndex, 'username', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Senha</label>
        <input
          type="password"
          placeholder="********"
          value={member.password}
          onChange={(event) => onUpdateTeamMember(memberIndex, 'password', event.target.value)}
          className={REGISTER_INPUT_CLASS}
        />
      </div>
    </div>
  )
}
