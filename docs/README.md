# Arker CRM

Sistema de CRM completo desenvolvido com Next.js, Prisma, e funcionalidades de drag and drop.

## Tecnologias

- **Next.js 14** - Framework React com App Router
- **Prisma** - ORM para gerenciamento de banco de dados
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **@dnd-kit** - Biblioteca para drag and drop
- **SQLite** - Banco de dados

## Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── api/               # Rotas da API
│   ├── dashboard/         # Página do dashboard
│   ├── clientes/          # Páginas de clientes
│   └── oportunidades/     # Página de oportunidades (Kanban)
├── components/            # Componentes React
│   ├── KanbanBoard.tsx    # Board principal com drag and drop
│   ├── KanbanColumn.tsx   # Coluna do Kanban
│   └── OportunidadeCard.tsx # Card arrastável
├── lib/                   # Utilitários
│   └── prisma.ts          # Cliente Prisma
└── prisma/                # Schema do Prisma
    └── schema.prisma      # Modelos do banco de dados
```

## Modelos de Dados

- **Cliente**: Informações dos clientes
- **Contato**: Contatos relacionados aos clientes
- **Oportunidade**: Pipeline de vendas com status (prospecção, qualificação, proposta, negociação, fechada, perdida)
- **Tarefa**: Tarefas relacionadas a clientes ou oportunidades

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure o banco de dados SQLite:
   - Crie um arquivo `.env` na raiz do projeto com:
   ```
   DATABASE_URL="file:./dev.db"
   ```
   - Ou use outro caminho para o arquivo SQLite se preferir

3. Execute as migrações do Prisma:
```bash
npm run db:generate
npm run db:push
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000)

**Nota:** O banco de dados SQLite será criado automaticamente na primeira execução. O arquivo `dev.db` será criado na raiz do projeto.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run db:generate` - Gera o cliente Prisma
- `npm run db:push` - Sincroniza schema com o banco
- `npm run db:migrate` - Cria migração
- `npm run db:studio` - Abre Prisma Studio

## Funcionalidades

- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de clientes
- ✅ Pipeline de oportunidades com drag and drop (Kanban)
- ✅ API REST completa (clientes, oportunidades, tarefas, ambientes)
- ✅ Banco de dados SQLite integrado
- ✅ Interface responsiva
- ✅ Busca integrada

## Próximos Passos

- Formulários de criação/edição
- Autenticação de usuários
- Filtros e busca
- Relatórios e gráficos
- Notificações

