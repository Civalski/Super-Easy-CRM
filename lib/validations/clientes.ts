import { z } from 'zod'

const campoPersonalizadoSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().max(500).default(''),
})

export const clienteCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(120),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (!v || v === '' ? undefined : v))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email inválido'),
  telefone: z.string().trim().max(30).optional().nullable(),
  empresa: z.string().trim().max(120).optional().nullable(),
  endereco: z.string().trim().max(200).optional().nullable(),
  cidade: z.string().trim().max(80).optional().nullable(),
  estado: z
    .string()
    .trim()
    .max(2)
    .optional()
    .nullable()
    .transform((v) => (!v || v === '' ? null : v.toUpperCase()))
    .refine((v) => !v || v.length === 2, 'Estado deve ter 2 caracteres'),
  cep: z.string().trim().max(12).optional().nullable(),
  cargo: z.string().trim().max(100).optional().nullable(),
  documento: z.string().trim().max(30).optional().nullable(),
  website: z.string().trim().max(200).optional().nullable(),
  dataNascimento: z.string().trim().max(20).optional().nullable(),
  observacoes: z.string().trim().max(2000).optional().nullable(),
  camposPersonalizados: z
    .array(campoPersonalizadoSchema)
    .max(20)
    .optional()
    .transform((arr) => (arr && arr.length > 0 ? arr : undefined)),
})

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>
