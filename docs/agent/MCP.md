# MCP Cheatsheet - Arker Easy CRM

Quando usar cada MCP configurado em [.cursor/mcp.json](../../.cursor/mcp.json) / [.mcp.json](../../.mcp.json) / [.codex/config.toml](../../.codex/config.toml). Objetivo: maxima precisao com minimo de tokens.

## Regra geral

- Antes de especular sobre API de biblioteca da stack -> consultar `context7`.
- Antes de alterar schema -> `prisma` MCP ajuda a introspeccao.
- Para verificar dado real em producao/dev -> `supabase` MCP (apenas leitura segura).
- Para investigar bug runtime do App Router -> `next-devtools`.
- Para verificar envio de email -> `resend` (apenas Cursor).
- NAO usar MCP para perguntas triviais, refatoracoes locais ou leitura de codigo do proprio repo.

## context7 (docs de stack)

- Use para: Next.js 16 (App Router, middleware, metadata), React 19, Prisma 7, Tailwind CSS 4, NextAuth, Stripe, Resend, TanStack Query.
- Padrao: ao responder duvida de API (sintaxe, opcao de config, breaking change), consultar antes de escrever codigo.
- Nao usar para: logica de negocio interna, nomes de arquivos locais.

## prisma (MCP oficial do Prisma)

- Use para: inspecionar schema, verificar model/relation, validar formato de migration, comparar schema X banco.
- Preferencia: antes de editar `schema.prisma` de forma significativa, introspeccionar primeiro.
- Nao usar para: rodar migrations destrutivas em producao (use `npm run db:deploy`).

## supabase (hospedado)

- Use para: listar tabelas, ver counts, rodar queries de leitura seguras, checar policies e indexes.
- Usar com cuidado: evitar mutations em producao; preferir queries `SELECT`.
- Nao usar para: deploy de migrations (use Prisma).

## next-devtools

- Use para: debug de rotas do App Router, inspecao de server components, descoberta de rotas dinamicas, instrumentacao local.
- Nao usar para: build/lint (scripts npm cobrem).

## resend (apenas Cursor)

- Use para: preview de template React Email, teste de envio em dev.
- Credenciais vem de `.env.local` (`envFile` no `.cursor/mcp.json`).
- Nao usar para: disparo em massa ou producao (use Resend dashboard).

## Paridade Cursor x Codex

| MCP | Cursor | Codex |
|---|---|---|
| context7 | sim | sim |
| prisma | sim | sim |
| supabase | sim | sim |
| next-devtools | sim | sim |
| resend | sim | - |

Configuracao: [.cursor/mcp.json](../../.cursor/mcp.json) e [.codex/config.toml](../../.codex/config.toml). Resend esta apenas no Cursor por exigir env local.

## Boas praticas de token

- Nao carregar o MCP se a pergunta ja pode ser respondida pelo codigo local.
- Consulta objetiva: traga o topico exato (ex: "Next.js 16 App Router generateMetadata"), nao exploracao livre.
- Combinar: `context7` para confirmar contrato -> `Grep` no codigo para ver uso atual -> alteracao.
