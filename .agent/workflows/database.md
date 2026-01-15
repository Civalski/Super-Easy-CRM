---
description: Como aplicar alterações no banco de dados com Prisma
---
# Atualizar Banco de Dados

## Após modificar o schema.prisma:

// turbo-all

1. Aplicar as alterações ao banco de dados:
```powershell
npx prisma db push
```

2. Regenerar o cliente Prisma:
```powershell
npx prisma generate
```

**IMPORTANTE:** Se o servidor de desenvolvimento estiver rodando, pode dar erro EPERM. 
Nesse caso, pare o servidor, execute os comandos, e reinicie.

## Visualizar dados no banco:

```powershell
npx prisma studio
```

Isso abre uma interface web para visualizar e editar dados.

## Resetar banco de dados (CUIDADO - apaga todos os dados):

```powershell
npx prisma db push --force-reset
```
