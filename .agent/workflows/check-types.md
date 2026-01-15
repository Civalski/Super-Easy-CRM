---
description: Como verificar erros de TypeScript antes de fazer alterações
---
# Verificar TypeScript

// turbo-all

## Verificar erros de compilação:

1. Rodar verificação de tipos:
```powershell
npx tsc --noEmit --pretty 2>&1 | Select-Object -First 40
```

Este comando:
- Compila o TypeScript sem gerar arquivos
- Mostra os 40 primeiros erros (se houver)
- Deve ser executado ANTES de fazer alterações significativas
- Deve ser executado DEPOIS de alterações para verificar se não introduziu erros

## Verificar lint:

```powershell
npx eslint . --ext .ts,.tsx --max-warnings 0
```
