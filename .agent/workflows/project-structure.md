---
description: Estrutura do projeto e onde encontrar cada funcionalidade
---
# Estrutura do Projeto Arker CRM

## Diretórios Principais:

### `/app` - Páginas e API Routes (Next.js App Router)
- `/app/api/*` - Endpoints da API
- `/app/clientes` - Página de clientes
- `/app/leads` - Página de busca de leads
- `/app/prospectar` - Página de prospecção
- `/app/tarefas` - Página de tarefas
- `/app/oportunidades` - Página de oportunidades

### `/components` - Componentes React
- `/components/common` - Componentes genéricos reutilizáveis
- `/components/layout` - Layout (Sidebar, Header)
- `/components/features` - Componentes específicos de cada funcionalidade
  - `/components/features/leads` - Componentes de Leads
  - `/components/features/prospectar` - Componentes de Prospectar
  - `/components/features/clientes` - Componentes de Clientes

### `/lib` - Utilitários e configurações
- `/lib/prisma.ts` - Cliente do Prisma
- `/lib/hooks` - Custom hooks React

### `/types` - Definições TypeScript
- `/types/leads.ts` - Tipos para leads e filtros

### `/prisma` - Configuração do banco de dados
- `/prisma/schema.prisma` - Schema do banco de dados
- `/prisma/dev.db` - Banco SQLite de desenvolvimento

### `/backend-parquet` - Backend Python (FastAPI)
- `/backend-parquet/main.py` - API para busca em arquivos Parquet
- Dados dos leads estão em arquivos .parquet

## Padrões de Código:

### Componentes React:
- Usar `'use client'` no topo de componentes interativos
- Exportar via barrel exports (`index.ts`)
- Usar Tailwind CSS para estilos
- Tema escuro é o padrão

### APIs:
- Next.js API routes em `/app/api/*/route.ts`
- Usar `NextRequest` e `NextResponse`
- Prisma para operações de banco

### Banco de Dados:
- SQLite em desenvolvimento
- Prisma como ORM
- Schema em `/prisma/schema.prisma`
