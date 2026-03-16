import { PLAN_CARD_THEMES } from '@/components/common/planCardThemes'
import { Building2, MessageCircle, User, Users } from '@/lib/icons'
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

/** Planos disponiveis no registro. Apenas plan_3 e plan_10 permitem gerente de equipe. */
export const REGISTER_PLANS: readonly RegisterPlanDefinition[] = [
  {
    id: 'plan_1',
    name: 'Individual',
    label: '1 licenca',
    licenses: 1,
    supportsManager: false,
    description: 'Ideal para iniciar o CRM com 7 dias gratis liberados apos confirmar o email.',
    highlights: ['1 usuario', '7 dias gratis', 'Sem cartao'],
    priceLabel: '7 dias gratis',
    pricePeriod: 'sem cartao',
    icon: User,
    theme: PLAN_CARD_THEMES.bronze,
  },
  {
    id: 'plan_3',
    name: 'Equipe',
    label: '3 licencas',
    licenses: 3,
    supportsManager: true,
    description: 'Para times pequenos que querem testar o CRM por 7 dias sem pedir cartao.',
    highlights: ['Ate 3 usuarios', '7 dias gratis', 'Opcao de gerente'],
    priceLabel: '7 dias gratis',
    pricePeriod: 'sem cartao',
    icon: Users,
    theme: PLAN_CARD_THEMES.silver,
  },
  {
    id: 'plan_10',
    name: 'Enterprise',
    label: '10 licencas',
    licenses: 10,
    supportsManager: true,
    description: 'Mais estrutura para testar o CRM por 7 dias antes de ativar a assinatura.',
    highlights: ['Ate 10 usuarios', '7 dias gratis', 'Gestao por gerente'],
    priceLabel: '7 dias gratis',
    pricePeriod: 'sem cartao',
    icon: Building2,
    theme: PLAN_CARD_THEMES.gold,
  },
  {
    id: 'plan_personalizado',
    name: 'Personalizado',
    label: 'Sob medida',
    licenses: 0,
    supportsManager: false,
    description: 'Licencas customizadas, servidor dedicado, VPS ou dominio proprio.',
    highlights: ['Licencas personalizadas', 'Servidor dedicado', 'VPS', 'Dominio dedicado'],
    priceLabel: 'Fale conosco',
    pricePeriod: 'via WhatsApp',
    icon: MessageCircle,
    theme: PLAN_CARD_THEMES.diamond,
    whatsappRedirect: true,
  },
] as const

/** Numero WhatsApp para plano personalizado (formato: 5511999999999). Fallback do SuporteCard. */
const WHATSAPP_PLAN_PERSONALIZADO =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_PERSONALIZADO ?? '5519998205608'

const WHATSAPP_PLAN_PERSONALIZADO_MSG = encodeURIComponent(
  'Olá! Gostaria de assinar o plano Personalizado do Arker CRM. Tenho interesse em: licenças personalizadas, servidor, VPS e/ou domínio dedicado.'
)

export const WHATSAPP_PLAN_PERSONALIZADO_URL = `https://wa.me/${WHATSAPP_PLAN_PERSONALIZADO}?text=${WHATSAPP_PLAN_PERSONALIZADO_MSG}`

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
  hintIndividual: 'Informe seus dados para criar sua conta e liberar 7 dias gratis apos confirmar o email.',
  hintTeam: 'Informe os dados da equipe para liberar 7 dias gratis apos confirmar o email do responsavel.',
  accessHintIndividual: 'Nao pedimos cartao agora. O acesso e liberado assim que voce confirmar o email.',
  accessHintTeam: 'Nao pedimos cartao agora. O acesso da equipe e liberado apos confirmar o email do responsavel.',
  turnstileRequired: 'Confirme a verificacao anti-bot para continuar',
  selectPlan: 'Selecione o plano',
  planIndividual: 'Individual',
  planTeam: 'Equipe (3 licencas)',
  planEnterprise: 'Enterprise (10 licencas)',
  planPersonalizado: 'Personalizado',
  continueViaWhatsApp: 'Falar no WhatsApp',
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
