---
description: Quando usar cada MCP (context7, prisma, supabase, next-devtools, resend)
---

# Usar MCP

Cheatsheet completo: [docs/agent/MCP.md](../../docs/agent/MCP.md).

## Resumo de quando usar

| Situacao | MCP |
|---|---|
| Duvida sobre API da stack (Next, React, Prisma, Tailwind, NextAuth, Stripe) | `context7` |
| Inspecionar/validar schema Prisma | `prisma` |
| Ver dados reais no Postgres (queries de leitura) | `supabase` |
| Debug runtime do App Router | `next-devtools` |
| Preview/envio de email em dev | `resend` (Cursor) |

## Quando NAO usar

- Pergunta trivial respondida por codigo local.
- Leitura de arquivos do proprio repo (use `Read`/`Grep`/`Glob`).
- Refatoracao puramente mecanica.

## Paridade Cursor x Codex

Os mesmos MCPs estao em [.cursor/mcp.json](../../.cursor/mcp.json) e [.codex/config.toml](../../.codex/config.toml), com excecao do `resend` que e exclusivo do Cursor (depende de `.env.local`).
