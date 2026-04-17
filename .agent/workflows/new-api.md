---
description: Criar nova rota de API em app/api/**/route.ts
---

# Criar nova API route

## Checklist

1. Criar `app/api/<recurso>/route.ts`.
2. Copiar o template de [docs/agent/RECIPES.md](../../docs/agent/RECIPES.md) (secao "API route").
3. Confirmar as 6 obrigacoes:
   - `getUserIdFromRequest` de [lib/auth.ts](../../lib/auth.ts). Sem `userId` -> 401.
   - `enforceApiRateLimit` de [lib/security/api-rate-limit.ts](../../lib/security/api-rate-limit.ts) em escritas.
   - Zod para body/query/params.
   - Multi-tenant: `where: { userId, ... }` em TODA query Prisma.
   - `logBusinessEvent` de [lib/observability/audit.ts](../../lib/observability/audit.ts) para eventos relevantes.
   - Respeitar edicao OSS via [lib/crmEdition.ts](../../lib/crmEdition.ts).
4. Rotas dinamicas `[id]`: conferir `registro.userId === userId` antes de mutar/apagar.
5. Rodar `npm run check` ao final.

## Regra Cursor aplicavel

- `.cursor/rules/auth-api.mdc` (ativa automaticamente em `app/api/**/route.ts`).
- `.cursor/rules/security-oss.mdc`.
