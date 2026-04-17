---
description: Comandos de validacao antes de encerrar uma tarefa
---

# Rodar checks

Sempre ao final de uma tarefa que altera codigo:

```powershell
npm run check
```

Equivale a:

1. `npm run lint` (ESLint).
2. `npm run type-check` (`tsc --noEmit`).
3. `npm run test:smoke` (garantias de auth em rotas de API).

## Checks por contexto

- Alterou apenas docs/markdown: nao precisa rodar `check`.
- Alterou `schema.prisma`: `npm run db:generate` + `npm run db:migrate` (dev) ou `npm run db:deploy` (prod). Ver [migrate-db.md](migrate-db.md).
- Alterou rota de API: alem do `check`, validar manualmente que `userId` + Zod + rate limit estao presentes.

## Reportar resultado

Ao encerrar a tarefa, informar:

- Quais comandos foram executados.
- Resultado (sucesso / falha).
- Se houve erro, onde foi corrigido.
