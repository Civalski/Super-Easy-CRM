---
description: Como usar SweetAlert2 para modais e confirmações
---
# Usar SweetAlert2

## Import:
```typescript
import Swal from 'sweetalert2';
```

## Modal de Confirmação:

```typescript
const result = await Swal.fire({
    title: 'Confirmar Ação?',
    text: 'Descrição da ação.',
    icon: 'question', // 'success', 'error', 'warning', 'info', 'question'
    showCancelButton: true,
    confirmButtonColor: '#6366f1', // Roxo (padrão do projeto)
    cancelButtonColor: '#4b5563',
    confirmButtonText: 'Sim, confirmar',
    cancelButtonText: 'Cancelar',
    background: '#1f2937', // Tema escuro
    color: '#f3f4f6',
});

if (result.isConfirmed) {
    // Executar ação
}
```

## Modal de Sucesso:

```typescript
await Swal.fire({
    icon: 'success',
    title: 'Operação Concluída',
    html: `
        <div style="padding: 10px;">
            <p style="color: #e5e7eb;">Mensagem de sucesso</p>
        </div>
    `,
    confirmButtonColor: '#6366f1',
    background: '#1f2937',
    color: '#f3f4f6',
});
```

## Toast (notificação rápida):

```typescript
Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Ação realizada!',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: '#1f2937',
    color: '#f3f4f6',
});
```

## Cores do Tema:

- Background: `#1f2937` (gray-800)
- Texto: `#f3f4f6` (gray-100)
- Roxo (confirm): `#6366f1` (indigo-500)
- Cinza (cancel): `#4b5563` (gray-600)
- Verde (sucesso): `#065f46` (green-800)
- Vermelho (erro): `#ef4444` (red-500)
- Amarelo (warning): `#fbbf24` (amber-400)
