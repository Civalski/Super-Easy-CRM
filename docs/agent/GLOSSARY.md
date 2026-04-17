# Glossario de dominio - Arker Easy CRM

Termos do CRM com a model correspondente em [prisma/schema.prisma](../../prisma/schema.prisma). Use este arquivo quando precisar entender "o que e X" sem abrir toda a UI.

## Entidades principais

| Termo | Model | O que e |
|---|---|---|
| Usuario | `User` | Conta que loga no sistema. Chave de multi-tenant: `userId` aparece em quase toda tabela. |
| Cliente | `Cliente` | Empresa/pessoa ja convertida (nao-lead). Possui historico comercial. |
| Fornecedor | `Fornecedor` | Parceiro que fornece produtos/servicos; usado em contas a pagar. |
| Funcionario | `Funcionario` | Membro do time do usuario (usado em permissoes e metas). |
| Contato | `Contato` | Pessoa de contato vinculada a um cliente ou fornecedor. |
| Oportunidade | `Oportunidade` | Orcamento / negociacao em andamento. Passa por funil (`status`) ate virar pedido ou perda. |
| Pedido | `Pedido` | Venda fechada, com itens e financeiro associados. |
| Item de pedido | `PedidoItem` | Produto/servico de um pedido (quantidade, preco unitario, total). |
| Motivo de perda | `MotivoPerda` | Classificacao configurada pelo usuario para oportunidades perdidas. |
| Prospecto | `Prospecto` | Lead em prospeccao. Pode ser qualificado, promovido e enviado ao funil. |
| Agendamento de envio | `ProspectoEnvioAgendado` | Agenda de mensagens/follow-ups do fluxo de prospeccao. |
| Produto/servico | `ProdutoServico` | Catalogo do usuario (itens vendaveis). |
| Tarefa | `Tarefa` | Item de checklist com data, prioridade e notificacao. |
| Nota | `Nota` | Anotacao anexada a oportunidade, cliente, etc. |
| Follow-up attempt | `FollowUpAttempt` | Registro de tentativa de contato (parte do fluxo de prospeccao). |
| Meta | `Goal` / `GoalSnapshot` | Meta comercial (diaria/semanal/mensal/personalizada) e fotos do progresso. |
| Meta de contato | `MetaContatoConfig` / `MetaContatoDiaEsquecido` | Meta diaria de contatos e dias sem registro. |
| Conta a receber / pagar | `ContaReceber` | Representa tambem contas a pagar (`tipo`). Controla parcelas e recorrencias. |
| Movimento financeiro | `MovimentoFinanceiro` | Entrada/saida efetiva (baixa de parcela, quitacao). |
| Workspace / Grupo | `Workspace` / `WorkspaceMember` | Agrupamento colaborativo de usuarios (grupo de vendas). |
| Contrato | `Contrato` | Contrato gerado a partir de IA (`IaGeracaoContrato` armazena o prompt/resultado). |
| OAuth Google | `GoogleOAuthToken` | Token de integracao (calendar/gmail). |
| Registration code | `RegistrationCode` | Codigo de convite obrigatorio para registro. |
| Configuracoes de empresa / PDF | `EmpresaConfig` / `PdfConfig` | Dados usados em exports e PDFs de orcamento. |

## Funil (status de oportunidade)

Resumo do mapeamento status -> UI em [lib/domain/status.ts](../../lib/domain/status.ts) e [lib/domain/probabilidade.ts](../../lib/domain/probabilidade.ts).

Ordem usual do funil: `novo` -> `em_andamento` -> `proposta` -> `fechado` (ganho) ou `perdido` (com `MotivoPerda`).

## Edicao do produto

Definido em [lib/crmEdition.ts](../../lib/crmEdition.ts) via `NEXT_PUBLIC_CRM_EDITION`:

- `full` (padrao, sem variavel ou vazio): todo o CRM.
- `oss`: apenas funil de vendas (`/grupos` + `/oportunidades`), clientes e tarefas. Rotas fora desse escopo respondem 403 ou redirecionam.

## Terminologia de processo

- **Funil de vendas**: conjunto das oportunidades organizadas por status.
- **Grupo de vendas / Workspace**: agrupamento que compartilha dados entre membros.
- **Recorrencia financeira**: geracao automatica de parcelas futuras via [lib/financeiro/automation.ts](../../lib/financeiro/automation.ts). Detalhes em [AUTOMACAO.md](../../AUTOMACAO.md).
- **Prospecto -> funil**: a conversao e feita por [lib/prospectos/enviarAoFunil.ts](../../lib/prospectos/enviarAoFunil.ts).
- **Meta de contato diario**: componente `leads` ajuda o usuario a bater contatos do dia.

## Fontes de verdade

- Modelos/schema: [prisma/schema.prisma](../../prisma/schema.prisma) (sempre autoridade final).
- Processo e automacoes: [AUTOMACAO.md](../../AUTOMACAO.md).
- Fluxo de seguranca / edicao: [SECURITY.md](../../SECURITY.md) + [lib/crmEdition.ts](../../lib/crmEdition.ts).
