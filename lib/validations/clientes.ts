import { z } from 'zod'

const campoPersonalizadoSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().max(500).default(''),
})

const optString = (max: number) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined))
    .optional()

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
  // Campos B2B
  cnpj: optString(20),
  matrizFilial: optString(10),
  razaoSocial: optString(120),
  nomeFantasia: optString(120),
  capitalSocial: optString(50),
  porte: optString(30),
  qualificacaoProfissional: optString(100),
  naturezaJuridica: optString(100),
  situacaoCadastral: optString(50),
  dataSituacaoCadastral: optString(20),
  motivoSituacaoCadastral: optString(100),
  dataAbertura: optString(20),
  tipoLogradouro: optString(30),
  logradouro: optString(120),
  numeroEndereco: optString(20),
  complemento: optString(80),
  bairro: optString(80),
  telefone2: optString(30),
  fax: optString(30),
  cnaePrincipal: optString(20),
  cnaePrincipalDesc: optString(200),
  cnaesSecundarios: optString(500),
  mei: optString(10),
  dataEntradaMei: optString(20),
  simples: optString(10),
})

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>
