# Recipes - Arker Easy CRM

Snippets minimos e revisados para os casos mais frequentes. Preferir copiar daqui do que reinventar. Sempre respeitar [AGENTS.md](../../AGENTS.md).

## API route

Exemplo alinhado aos contratos reais de [lib/security/api-rate-limit.ts](../../lib/security/api-rate-limit.ts) (`key`, `config`, `error`) e ao model [Nota](../../prisma/schema.prisma) (`userId`, `tipo`, `titulo`, `conteudo`). Substitua o path e o model pelo recurso que estiver implementando.

Arquivo: `app/api/notas/route.ts` (exemplo).

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'

const createSchema = z.object({
  titulo: z.string().max(200).optional(),
  conteudo: z.string().default(''),
})

const writeRateLimitConfig = {
  windowMs: 60 * 1000,
  maxAttempts: 30,
  blockDurationMs: 60 * 1000,
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const data = await prisma.nota.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const rateLimitResponse = await enforceApiRateLimit({
    key: `api:notas:create:user:${userId}`,
    config: writeRateLimitConfig,
    error: 'Muitas requisicoes em pouco tempo. Aguarde alguns segundos.',
  })
  if (rateLimitResponse) return rateLimitResponse

  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const created = await prisma.nota.create({
    data: {
      userId,
      tipo: 'bloco',
      titulo: parsed.data.titulo ?? null,
      conteudo: parsed.data.conteudo,
    },
  })

  return NextResponse.json(created, { status: 201 })
}
```

Rotas dinamicas (`app/api/<recurso>/[id]/route.ts`): carregar o registro com `where: { id, userId }`; se nao existir, 404. Nunca atualizar/apagar sem esse filtro.

Muitas rotas existentes encapsulam auth em `withAuth` de [lib/api/route-helpers.ts](../../lib/api/route-helpers.ts); para codigo novo, prefira o checklist do [AGENTS.md](../../AGENTS.md) (getUserIdFromRequest + Zod + rate limit + tenant).

## Feature module

Estrutura em `components/features/<feature>/`:

```
types.ts
constants.ts
utils.ts
hooks/useFeature.ts
FeatureList.tsx
FeatureCard.tsx
index.ts
```

`index.ts` (barrel):

```typescript
export * from './types'
export * from './constants'
export { useFeature } from './hooks/useFeature'
export { FeatureList } from './FeatureList'
```

Pagina `app/<feature>/page.tsx` so orquestra:

```typescript
'use client'
import { useFeature, FeatureList } from '@/components/features/<feature>'

export default function FeaturePage() {
  const { data, isLoading, refetch } = useFeature()
  return <FeatureList data={data} isLoading={isLoading} onRefresh={refetch} />
}
```

## Hook de dados (TanStack Query)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'

const key = (userId: string) => ['notas', { userId }] as const

export function useNotas(userId: string) {
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: key(userId),
    queryFn: async () => {
      const r = await fetch('/api/notas')
      if (!r.ok) throw new Error('fetch_failed')
      return r.json()
    },
  })

  const create = useMutation({
    mutationFn: async (payload: { titulo?: string; conteudo?: string }) => {
      const r = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error('create_failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success('Criado com sucesso')
      qc.invalidateQueries({ queryKey: key(userId) })
    },
    onError: () => toast.error('Erro ao criar'),
  })

  return { ...list, create }
}
```

## Toast (Sonner via `lib/toast.ts`)

```typescript
import { toast } from '@/lib/toast'

toast.success('Pedido salvo')
toast.error('Falha ao salvar')
toast.info('Sincronizando...')
toast.warning('Campo obrigatorio')

toast.promise(salvar(), {
  loading: 'Salvando...',
  success: 'Salvo',
  error: 'Erro ao salvar',
})
```

SweetAlert2 fica restrito a telas que ja o utilizam. Em telas novas, usar Sonner.

## Confirmacao destrutiva

```tsx
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Excluir pedido?"
  description="Essa acao nao pode ser desfeita."
  confirmLabel="Excluir"
  variant="danger"
/>
```

## Aritmetica monetaria (lib/money.ts + lib/format.ts)

```typescript
import { roundMoney, sumMoney, moneyRemaining } from '@/lib/money'
import { formatCurrency } from '@/lib/format'

const total = sumMoney(parcelas.map((p) => p.valor))
const pago = sumMoney(pagamentos.map((p) => p.valor))
const restante = moneyRemaining(total, pago)

const label = formatCurrency(restante)
```

Persistencia: salvar sempre `roundMoney(valor)`.

## Logging de eventos de negocio

Somente eventos declarados em `BusinessEventName` em [lib/observability/audit.ts](../../lib/observability/audit.ts). Para um novo tipo de evento, amplie o union antes de chamar.

```typescript
import { logBusinessEvent } from '@/lib/observability/audit'

logBusinessEvent({
  event: 'oportunidade.status_changed',
  userId,
  entity: 'oportunidade',
  entityId: id,
  from: statusAtual,
  to: novoStatus,
  metadata: { motivoPerda: null },
})
```

## Schema Prisma multi-tenant

Toda nova model que armazena dados do usuario deve ter:

```prisma
model MinhaEntidade {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Depois: `npm run db:migrate` (dev) / `npm run db:deploy` (prod) e `npm run db:generate`.
