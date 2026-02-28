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
