---
description: Feedback ao usuario (toast, confirmacoes). Substitui sweetalert como padrao.
---

# Feedback ao usuario

Padrao do projeto: **Sonner**, via wrapper [lib/toast.ts](../../lib/toast.ts).

SweetAlert2 ainda existe nas telas legadas, mas nao deve ser usado em telas novas.

## Import

```typescript
import { toast } from '@/lib/toast'
```

## Casos

```typescript
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

## Confirmacao destrutiva

Para acoes irreversiveis (excluir, perder dados), usar o componente `ConfirmDialog`:

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

## Regras

- Preferencia por toast discreto; modal bloqueia fluxo e so cabe em confirmacao destrutiva.
- Nao reinventar paleta; Sonner herda tema via `Toaster` global em `app/Providers.tsx`.
- Textos curtos, em portugues, verbo claro ("Pedido salvo", "Falha ao salvar").
