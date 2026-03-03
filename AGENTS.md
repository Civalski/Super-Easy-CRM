# AGENTS.md

## Objetivo
Este arquivo define instrucoes locais para o Codex neste repositorio.

## Documentacao da stack (Context7)
- Sempre que a pergunta envolver documentacao, configuracao ou boas praticas de tecnologias da stack, consultar primeiro o MCP `context7`.
- Priorizar consultas para: Next.js (App Router), React, Prisma, Tailwind CSS, Node.js e bibliotecas do CRM.
- Se o MCP estiver indisponivel, avisar e responder com o melhor conhecimento local.

## Seguranca
- Nunca gravar chaves de API ou segredos no repositorio. Usar variaveis de ambiente.

## UX / Densidade visual (padrao global)
- Priorizar layout compacto nas telas operacionais do CRM (listas, tabelas e cards de acompanhamento).
- Evitar que itens repetitivos (como parcelas) ocupem varias linhas grandes por padrao: agrupar por entidade principal e exibir detalhes por expansao sob demanda.
- Reduzir desperdicio de largura com truncamento controlado, colunas objetivas e acoes curtas.
- Manter responsividade sem perder densidade: desktop mais compacto e mobile legivel.
- Aplicar esse criterio em novas funcionalidades e refatoracoes de visualizacao do CRM.

## Modularizacao e arquitetura limpa

### Limite de tamanho de arquivo
- Arquivos de pagina (`app/**/page.tsx`) NAO devem ultrapassar 300 linhas.
- Componentes isolados NAO devem ultrapassar 250 linhas.
- Hooks customizados NAO devem ultrapassar 200 linhas.
- Se um arquivo ultrapassar esses limites, DEVE ser refatorado antes de adicionar novas funcionalidades.

### Estrutura de pastas por feature
Cada feature do CRM deve ter sua pasta em `components/features/<nome-da-feature>/` contendo:
- `types.ts` — interfaces e tipos locais da feature
- `constants.ts` — constantes, labels e mapas de valores
- `utils.ts` — funcoes puras de formatacao e calculo
- `hooks/use<NomeDaFeature>.ts` — logica de estado e chamadas de API
- Componentes `.tsx` nomeados por responsabilidade (ex: `PedidosList.tsx`, `PedidosTabs.tsx`)

### Regras de separacao de responsabilidades
- `page.tsx` deve conter APENAS: orquestracao de estado entre hooks, composicao dos componentes e handlers simples de UI.
- Chamadas de API pertencem exclusivamente a hooks em `hooks/`.
- Tipos e interfaces compartilhadas pela feature ficam em `types.ts`.
- Constantes (labels, mapas de cores, enums de display) ficam em `constants.ts`.
- Funcoes puras (formatacao de moeda, datas, calculos) ficam em `utils.ts`.
- Componentes de exibicao pura recebem tudo via props e nao fazem fetch direto.

### Exemplos de referencia ja modularizados
- `app/pedidos/page.tsx` + `components/features/pedidos/` — padrao a seguir para novas features e refatoracoes.

### Arquivos monolitos conhecidos (pendentes de refatoracao)
Os arquivos abaixo ainda estao monoliticos e devem ser modularizados quando houver trabalho neles:
- `app/oportunidades/page.tsx` (~123 KB)
- `app/financeiro/page.tsx` (~71 KB)
- `app/clientes/[id]/page.tsx` (~60 KB)
- `app/grupos/page.tsx` (~54 KB)
- `app/prospectar/page.tsx` (~50 KB)
- `app/metas/page.tsx` (~50 KB)
- `app/produtos/page.tsx` (~44 KB)

