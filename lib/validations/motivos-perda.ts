import { z } from 'zod'

export const motivoPerdaCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Informe um motivo válido'),
})

export type MotivoPerdaCreateInput = z.infer<typeof motivoPerdaCreateSchema>
