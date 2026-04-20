---
description: Criar novo componente React seguindo o padrao feature-first
---

# Criar novo componente

## Decidir o diretorio

- Reutilizavel generico -> `components/common/`.
- Layout estrutural (sidebar, header, shell) -> `components/layout/`.
- Especifico de uma feature -> `components/features/<feature>/`.

## Padrao feature-first

Cada feature tem a estrutura:

```
components/features/<feature>/
  types.ts         interfaces e tipos locais
  constants.ts     labels, enums, mapas
  utils.ts         funcoes puras
  hooks/useX.ts    chamadas de API (TanStack Query)
  *.tsx            componentes (<= 250 linhas cada)
  index.ts         barrel export
```

Componentes de apresentacao recebem dados via props e NAO fazem fetch.

## Template

```tsx
'use client'

interface MeuComponenteProps {
  title: string
  items: Array<{ id: string; label: string }>
  onSelect: (id: string) => void
}

export function MeuComponente({ title, items, onSelect }: MeuComponenteProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/65 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((it) => (
          <li key={it.id}>
            <button onClick={() => onSelect(it.id)} className="text-sky-700 hover:underline dark:text-indigo-300">
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Exportar no `index.ts` da feature:

```typescript
export { MeuComponente } from './MeuComponente'
```

## Regras

- Cores e estados seguem [colors.MD](../../colors.MD). Sempre suportar `dark:`.
- Feedback ao usuario: [toast.md](toast.md) (Sonner, nao SweetAlert em telas novas).
- Limite: 250 linhas por componente. Quebrar em sub-componentes se exceder.

## Regra Cursor aplicavel

- `.cursor/rules/feature-module.mdc` (auto em `components/features/**`).
- `.cursor/rules/ui-colors.mdc`.
