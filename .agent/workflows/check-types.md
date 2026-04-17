---
description: Como validar tipos e lint antes de encerrar uma tarefa
---

# Verificar tipos, lint e smoke

Sempre ao final de uma tarefa de codigo, rodar:

```powershell
npm run check
```

`check` executa na sequencia:

1. `npm run lint` (ESLint)
2. `npm run type-check` (`tsc --noEmit`)
3. `npm run test:smoke` (garantias de auth em rotas de API)

## Checks individuais

```powershell
npm run type-check   # so tipos
npm run lint         # so lint
npm run test:smoke   # so smoke de API guards
```

## Quando ha muitos erros

Rodar so type-check filtrando os primeiros 40 erros:

```powershell
npx tsc --noEmit --pretty 2>&1 | Select-Object -First 40
```

Corrigir na origem (componentes e hooks) antes de tocar em tipos globais em `types/`.

## O que NAO fazer

- Nao ignorar erros com `@ts-ignore` / `any` sem justificativa explicita.
- Nao encerrar a tarefa sem `npm run check` passando quando a alteracao for de codigo.
