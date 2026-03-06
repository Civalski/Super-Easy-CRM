import { z } from 'zod'

const TAREFA_STATUS = ['pendente', 'em_andamento', 'concluida'] as const
const TAREFA_PRIORIDADE = ['baixa', 'media', 'alta'] as const

export const TAREFA_STATUS_SET = new Set(TAREFA_STATUS)
export const TAREFA_PRIORIDADE_SET = new Set(TAREFA_PRIORIDADE)

export const tarefaCreateSchema = z.object({
  titulo: z.string().trim().min(1, 'Título é obrigatório'),
  descricao: z.string().trim().max(2000).optional().nullable(),
  status: z
    .string()
    .optional()
    .default('pendente')
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => TAREFA_STATUS_SET.has(v as (typeof TAREFA_STATUS)[number]), 'Status inválido'),
  prioridade: z
    .string()
    .optional()
    .default('media')
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => TAREFA_PRIORIDADE_SET.has(v as (typeof TAREFA_PRIORIDADE)[number]), 'Prioridade inválida'),
  dataVencimento: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || v === '') return null
      const date = new Date(v)
      return Number.isNaN(date.getTime()) ? ('INVALID' as const) : date
    })
    .refine((v) => v !== 'INVALID', { message: 'Data de vencimento inválida' }),
  clienteId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (!v || v === '') ? null : v),
  oportunidadeId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (!v || v === '') ? null : v),
  notificar: z.boolean().optional().default(false),
})

export type TarefaCreateInput = z.infer<typeof tarefaCreateSchema>
