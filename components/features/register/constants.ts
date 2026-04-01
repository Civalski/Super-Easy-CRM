import { PLAN_CARD_THEMES } from '@/components/common/planCardThemes'
import { User } from '@/lib/icons'
import type {
  RegisterFormValues,
  RegisterPlanDefinition,
} from '@/components/features/register/types'

export const INITIAL_REGISTER_FORM: RegisterFormValues = {
  confirmPassword: '',
  email: '',
  isManager: false,
  name: '',
  password: '',
  phone: '',
  planId: 'plan_1',
  teamMembers: [],
  username: '',
  website: '',
}

export const REGISTER_INPUT_CLASS =
  'h-11 w-full rounded-xl border border-slate-200 bg-white/88 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-hidden transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600/70 dark:bg-slate-950/55 dark:text-slate-100 dark:placeholder:text-slate-400/90 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25'

/** Planos disponiveis no registro. No momento, apenas plano individual esta ativo. */
export const REGISTER_PLANS: readonly RegisterPlanDefinition[] = [
  {
    id: 'plan_1',
    name: 'Individual',
    label: '1 licenca',
    licenses: 1,
    supportsManager: false,
    description: 'Ideal para iniciar o CRM com 1 mes premium gratis apos confirmar o email.',
    highlights: ['1 usuario', '1 mes premium gratis', 'Sem cartao'],
    priceLabel: '1 mes premium gratis',
    pricePeriod: 'sem cartao',
    icon: User,
    theme: PLAN_CARD_THEMES.bronze,
  },
] as const

/** Mantido por compatibilidade com imports existentes no fluxo de cadastro. */
export const WHATSAPP_PLAN_PERSONALIZADO_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_PERSONALIZADO_URL ??
  'https://wa.me/5519998205608?text=Ola%2C%20quero%20saber%20mais%20sobre%20o%20Arker%20CRM.'

export const REGISTER_COPY = {
  antiBotError: 'Falha na verificacao anti-bot',
  creatingAccount: 'Criando conta...',
  creatingCheckout: 'Preparando confirmacao...',
  defaultError: 'Erro ao registrar usuario',
  invalidEmail: 'Email invalido',
  loadingAntiBot: 'Carregando verificacao anti-bot...',
  missingFields: 'Preencha nome, email, celular, usuario e senha',
  phoneLabel: 'Celular',
  invalidPhone: 'Informe um celular valido (com DDD)',
  passwordLength: 'A senha deve ter pelo menos 8 caracteres',
  passwordComplexity:
    'A senha deve ter maiuscula, minuscula, numero e caractere especial (!@#$%^&* etc.)',
  passwordMismatch: 'As senhas nao conferem',
  submitLabelIndividual: 'Criar conta',
  submitLabelTeam: 'Criar conta',
  hintIndividual:
    'Informe seus dados para criar sua conta e liberar 1 mes premium gratis apos confirmar o email.',
  hintTeam:
    'Informe os dados da equipe para liberar 1 mes premium gratis apos confirmar o email do responsavel.',
  accessHintIndividual: 'Nao pedimos cartao agora. O acesso e liberado assim que voce confirmar o email.',
  accessHintTeam: 'Nao pedimos cartao agora. O acesso da equipe e liberado apos confirmar o email do responsavel.',
  turnstileRequired: 'Confirme a verificacao anti-bot para continuar',
  selectPlan: 'Selecione o plano',
  planIndividual: 'Individual',
  planTeam: 'Equipe (indisponivel)',
  planEnterprise: 'Enterprise (indisponivel)',
  planPersonalizado: 'Personalizado (indisponivel)',
  continueViaWhatsApp: 'Plano indisponivel',
  registerAsManager: 'Cadastrar como gerente de equipe',
  registerAsManagerHint:
    'Uma das licencas sera de gerente, com aba Equipe para acompanhar o time.',
  teamMembers: 'Membros da equipe',
  addMember: 'Membro',
  allAccountsRequired: 'Preencha todos os usuarios do pacote para continuar.',
  stepOf: 'Etapa',
  next: 'Proximo',
  previous: 'Anterior',
  memberNumber: 'Usuario',
  networkError:
    'Sem conexao. Verifique sua internet e tente novamente. Seus dados foram salvos.',
  serverError:
    'O servidor esta temporariamente indisponivel. Tente novamente em alguns minutos. Seus dados foram salvos.',
  resumeDraft: 'Continuar cadastro',
  resumeDraftHint: 'Encontramos um cadastro em andamento. Deseja continuar de onde parou?',
  discardDraft: 'Comecar do zero',
}
