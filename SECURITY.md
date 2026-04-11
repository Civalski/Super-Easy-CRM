# Segurança

## Reportar vulnerabilidades

Se você encontrar um problema de segurança, **não** abra um issue público com detalhes exploráveis. Entre em contato com os mantenedores por um canal privado (e-mail ou formulário de suporte do projeto, se existir).

Inclua, quando possível:

- Descrição do impacto e passos para reproduzir
- Versão ou commit do repositório
- Se já houve tentativa de correção ou workaround

## Boas práticas para quem hospeda este repositório

- **Segredos:** use apenas variáveis de ambiente no deploy. Não commite `.env`, chaves de API, connection strings ou `NEXTAUTH_SECRET` reais.
- **Rotação:** se um segredo vazar (git, log, screenshot), revogue e substitua imediatamente no provedor (Supabase, Stripe, Turnstile, etc.).
- **Produção:** mantenha `NEXT_PUBLIC_CRM_EDITION` **vazio** ou defina explicitamente o comportamento da edição completa conforme a documentação em [README.md](./README.md) e [DEPLOY.md](./DEPLOY.md).
- **Dependências:** execute `npm audit` periodicamente e atualize pacotes com correções de segurança.

## Escopo da edição open source (`NEXT_PUBLIC_CRM_EDITION=oss`)

Com `oss`, rotas e APIs fora do escopo público respondem com **403** ou **redirecionamento**. Isso **não substitui** controles de autorização por usuário: todas as rotas autenticadas continuam devendo validar o `userId` no servidor.
