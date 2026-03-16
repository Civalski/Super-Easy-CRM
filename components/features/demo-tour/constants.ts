import type { DemoPreviewDefinition } from './types'

export const DEMO_PREVIEWS: Record<string, DemoPreviewDefinition> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Resumo rapido com indicadores, tarefas abertas, pipeline e caixa.',
    toolbar: {
      filters: [{ label: 'Hoje' }, { label: 'Semana', active: true, tone: 'blue' }, { label: 'Com metas', tone: 'emerald' }],
      actions: [{ label: 'Atualizar', tone: 'ghost' }, { label: 'Exportar', tone: 'secondary' }],
    },
    stats: [
      { label: 'Pedidos sem pagamento', value: 'R$ 18,4 mil', tone: 'blue' },
      { label: 'Orcamentos em aberto', value: 'R$ 91,7 mil', tone: 'emerald' },
      { label: 'Tarefas em aberto', value: '11', tone: 'amber' },
      { label: 'Valor total em aberto', value: 'R$ 110,1 mil', tone: 'slate' },
    ],
    sections: [
      {
        type: 'progress',
        title: 'Metas do periodo',
        items: [
          { label: 'Clientes cadastrados', value: '12 de 18', progress: 67, tone: 'emerald', meta: 'ritmo acima da semana passada' },
          { label: 'Orcamentos enviados', value: '5 de 8', progress: 63, tone: 'blue', meta: '2 propostas devem sair hoje' },
          { label: 'Faturamento mensal', value: 'R$ 28 mil de R$ 70 mil', progress: 40, tone: 'amber', meta: 'janela forte nas proximas 48h' },
        ],
      },
      {
        type: 'list',
        title: 'Atividades recentes',
        items: [
          { title: 'Proposta enviada para Aurora Studio', meta: 'ha 14 min', detail: 'orcamento #084 revisado com condicoes finais', badge: 'orcamento', tone: 'blue' },
          { title: 'Pedido #104 aprovado', meta: 'ha 32 min', detail: 'cliente confirmou entrada via pix', badge: 'pedido', tone: 'emerald' },
          { title: 'Follow-up agendado com Nogueira Tech', meta: 'hoje 15:30', detail: 'retomar proposta do modulo premium', badge: 'tarefa', tone: 'amber' },
        ],
      },
      {
        type: 'table',
        title: 'Fila prioritaria',
        span: 'full',
        columns: ['Cliente', 'Etapa', 'Proxima acao', 'Responsavel', 'Valor'],
        rows: [
          ['Aurora Studio', { label: 'Orcamento', tone: 'blue' }, 'Enviar versao final do PDF', 'Marina Lopes', { label: 'R$ 22,5 mil', align: 'right', emphasis: 'strong' }],
          ['Castro Engenharia', { label: 'Negociacao', tone: 'amber' }, 'Ajustar escopo e prazo de implantacao', 'Felipe Duarte', { label: 'R$ 14,8 mil', align: 'right', emphasis: 'strong' }],
          ['Lima Consultoria', { label: 'Pedido', tone: 'emerald' }, 'Confirmar cronograma de entrega', 'Gabriela Pires', { label: 'R$ 26,4 mil', align: 'right', emphasis: 'strong' }],
        ],
      },
    ],
  },
  '/relatorios': {
    title: 'Relatorios',
    subtitle: 'Leitura gerencial por periodo para comparar conversao, perdas e receita.',
    toolbar: {
      filters: [{ label: 'Ultimos 30 dias', active: true, tone: 'blue' }, { label: 'Comercial' }, { label: 'Financeiro' }],
      actions: [{ label: 'Salvar visao', tone: 'ghost' }, { label: 'Exportar CSV', tone: 'secondary' }],
    },
    stats: [
      { label: 'Conversao', value: '31%', tone: 'emerald' },
      { label: 'Ticket medio', value: 'R$ 8,7 mil', tone: 'blue' },
      { label: 'Perdas mapeadas', value: '9', tone: 'amber' },
    ],
    sections: [
      {
        type: 'list',
        title: 'Vistas salvas',
        items: [
          { title: 'Performance de vendas', meta: 'comparativo semanal e mensal', detail: 'pipeline, pedidos e faturamento na mesma leitura', badge: 'gerencial', tone: 'blue' },
          { title: 'Perdas do funil', meta: 'motivos, etapas e responsaveis', detail: 'identifica gargalos por fase comercial', badge: 'diagnostico', tone: 'rose' },
          { title: 'Resumo exportavel', meta: 'csv pronto para reuniao', detail: 'usa os filtros ativos para montar o recorte', badge: 'exportacao', tone: 'emerald' },
        ],
      },
      {
        type: 'progress',
        title: 'Indicadores do recorte',
        items: [
          { label: 'Meta de conversao', value: '31% de 35%', progress: 89, tone: 'emerald', meta: 'queda pequena vs. semana anterior' },
          { label: 'Tempo medio de ciclo', value: '12 dias', progress: 64, tone: 'blue', meta: 'mais rapido nas contas enterprise' },
          { label: 'Pedidos cancelados', value: '3 no periodo', progress: 22, tone: 'amber', meta: 'motivo lider: prazo de entrega' },
        ],
      },
    ],
  },
  '/clientes': {
    title: 'Clientes',
    subtitle: 'Tabela compacta com codigo, empresa, contato e saude comercial.',
    toolbar: {
      searchPlaceholder: 'Buscar cliente, empresa ou email',
      filters: [{ label: 'Ativos', active: true, tone: 'emerald' }, { label: 'Com follow-up' }, { label: 'Sem retorno', tone: 'rose' }],
      actions: [{ label: 'Importar', tone: 'ghost' }, { label: 'Novo cliente', tone: 'primary' }],
    },
    stats: [
      { label: 'Clientes ativos', value: '126', tone: 'blue' },
      { label: 'Com follow-up', value: '19', tone: 'emerald' },
      { label: 'Sem retorno', value: '7', tone: 'rose' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Base principal',
        columns: ['Codigo', 'Nome', 'Empresa', 'Ultima acao', 'Status'],
        rows: [
          [{ label: '00021', emphasis: 'muted' }, { label: 'Ana Martins', emphasis: 'strong' }, 'Aurora Studio', 'Proposta enviada hoje', { label: 'Quente', tone: 'emerald', align: 'right' }],
          [{ label: '00034', emphasis: 'muted' }, { label: 'Carlos Nogueira', emphasis: 'strong' }, 'Nogueira Tech', 'Ligacao agendada 15:30', { label: 'Em negociacao', tone: 'blue', align: 'right' }],
          [{ label: '00011', emphasis: 'muted' }, { label: 'Renata Lima', emphasis: 'strong' }, 'Lima Consultoria', 'Treinamento marcado sexta', { label: 'Ativo', tone: 'amber', align: 'right' }],
        ],
      },
      {
        type: 'list',
        title: 'Atalhos do cadastro',
        items: [
          { title: 'Criar orcamento direto do cliente', meta: 'atalho da coluna de acoes', detail: 'abre a proposta ja vinculada ao cadastro', badge: 'orcamento', tone: 'blue' },
          { title: 'Abrir detalhes em drawer', meta: 'historico, contatos e vendas', detail: 'evita trocar de tela para consultar contexto', badge: 'detalhes', tone: 'slate' },
          { title: 'Enviar WhatsApp ou email', meta: 'acoes rapidas no menu', detail: 'mantem a execucao comercial em um clique', badge: 'contato', tone: 'emerald' },
        ],
      },
    ],
  },
  '/oportunidades': {
    title: 'Orcamentos',
    subtitle: 'Lista de propostas com previsao, probabilidade e proximo passo.',
    toolbar: {
      tabs: [{ label: 'Abertas', count: '14', active: true }, { label: 'Canceladas', count: '3' }],
      actions: [{ label: 'Exportar PDF', tone: 'secondary' }, { label: 'Novo orcamento', tone: 'primary' }],
    },
    stats: [
      { label: 'Em potencial', value: '9', tone: 'blue' },
      { label: 'Em orcamento', value: '6', tone: 'amber' },
      { label: 'Fechadas no mes', value: '4', tone: 'emerald' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Propostas abertas',
        columns: ['No', 'Cliente', 'Titulo', 'Previsao', 'Valor', 'Probab.'],
        rows: [
          ['084', 'Aurora Studio', 'Automacao do atendimento', '18/03', { label: 'R$ 22,5 mil', align: 'right', emphasis: 'strong' }, { label: '64%', tone: 'blue', align: 'right' }],
          ['079', 'Castro Engenharia', 'Dashboard executivo', '20/03', { label: 'R$ 14,8 mil', align: 'right', emphasis: 'strong' }, { label: '58%', tone: 'amber', align: 'right' }],
          ['071', 'Lima Consultoria', 'Renovacao anual do contrato', '25/03', { label: 'R$ 26,4 mil', align: 'right', emphasis: 'strong' }, { label: '48%', tone: 'slate', align: 'right' }],
        ],
      },
      {
        type: 'list',
        title: 'Proximas acoes',
        items: [
          { title: 'Revisar itens do orcamento #084', meta: 'prazo hoje 14:00', detail: 'cliente pediu detalhamento do modulo premium', badge: 'urgente', tone: 'rose' },
          { title: 'Duplicar proposta para filial', meta: 'Castro Engenharia', detail: 'usar a base da proposta #079 e ajustar prazo', badge: 'atalho', tone: 'blue' },
          { title: 'Converter em pedido apos aceite', meta: 'Lima Consultoria', detail: 'pedido pode sair com 30% de entrada', badge: 'fechamento', tone: 'emerald' },
        ],
      },
    ],
  },
  '/pedidos': {
    title: 'Pedidos',
    subtitle: 'Acompanhamento de entrega, pagamento e situacao comercial em grade enxuta.',
    toolbar: {
      tabs: [{ label: 'Em andamento', count: '8', active: true }, { label: 'Vendas', count: '5' }, { label: 'Cancelados', count: '1' }],
      filters: [{ label: 'Pix' }, { label: 'Boleto' }, { label: 'Cartao', active: true, tone: 'blue' }],
      actions: [{ label: 'Novo pedido', tone: 'primary' }],
    },
    stats: [
      { label: 'Em preparacao', value: '3', tone: 'amber' },
      { label: 'Entregues', value: '5', tone: 'emerald' },
      { label: 'Pagamento pendente', value: '2', tone: 'rose' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Pedidos em andamento',
        columns: ['No', 'Cliente', 'Titulo', 'Entrega', 'Pgto', 'Valor'],
        rows: [
          ['104', 'Aurora Studio', 'Implantacao premium', { label: 'Em preparacao', tone: 'amber' }, { label: 'Parcial', tone: 'blue' }, { label: 'R$ 18,9 mil', align: 'right', emphasis: 'strong' }],
          ['103', 'Nogueira Tech', 'Pacote suporte trimestral', { label: 'Pendente', tone: 'rose' }, { label: 'A vencer', tone: 'amber' }, { label: 'R$ 9,4 mil', align: 'right', emphasis: 'strong' }],
          ['102', 'Lima Consultoria', 'Treinamento onsite', { label: 'Entregue', tone: 'emerald' }, { label: 'Pago', tone: 'emerald' }, { label: 'R$ 6,8 mil', align: 'right', emphasis: 'strong' }],
        ],
      },
      {
        type: 'list',
        title: 'Acoes rapidas do pedido',
        items: [
          { title: 'Adicionar produto ou servico', meta: 'mesmo sem sair da lista', detail: 'abre o drawer lateral vinculado ao pedido', badge: 'itens', tone: 'blue' },
          { title: 'Aprovar pagamento e entrega', meta: 'acao de um clique', detail: 'move o pedido para a aba de vendas concluidas', badge: 'aprovacao', tone: 'emerald' },
          { title: 'Gerar PDF ou cancelar pedido', meta: 'menu contextual da linha', detail: 'mantem pos-venda e cobranca organizados', badge: 'operacao', tone: 'amber' },
        ],
      },
    ],
  },
  '/grupos': {
    title: 'Funil',
    subtitle: 'Quadro por etapa para mover leads sem desperdicar espaco operacional.',
    toolbar: {
      filters: [{ label: 'Sem contato' }, { label: 'Contatado', active: true, tone: 'amber' }, { label: 'Em potencial' }, { label: 'Aguardando orcamento', tone: 'emerald' }],
      actions: [{ label: 'Novo lead', tone: 'primary' }],
    },
    stats: [
      { label: 'Novos leads', value: '14', tone: 'blue' },
      { label: 'Em contato', value: '9', tone: 'amber' },
      { label: 'Aguardando orcamento', value: '4', tone: 'emerald' },
    ],
    sections: [
      {
        type: 'kanban',
        span: 'full',
        title: 'Etapas do pipeline',
        columns: [
          {
            title: 'Sem contato',
            cards: [
              { title: 'Vila Norte Comercio', meta: 'SP  |  varejo', detail: 'lead novo, entrou hoje 09:20', badge: 'lead frio', tone: 'blue' },
              { title: 'Ativa Components', meta: 'MG  |  industria', detail: 'origem: indicacao de parceiro', badge: 'novo', tone: 'slate' },
            ],
          },
          {
            title: 'Contatado',
            cards: [
              { title: 'Matriz Delta Servicos', meta: 'ultimo toque hoje', detail: 'aguarda retorno com decisor final', badge: 'follow-up', tone: 'amber' },
              { title: 'Casa Prisma Eventos', meta: 'whatsapp enviado', detail: 'abrir proposta base se responder', badge: 'monitorar', tone: 'amber' },
            ],
          },
          {
            title: 'Em potencial',
            cards: [
              { title: 'Nova Rota Logistica', meta: 'ticket estimado R$ 18 mil', detail: 'cliente ja validou escopo inicial', badge: 'quente', tone: 'emerald' },
            ],
          },
          {
            title: 'Aguardando orcamento',
            cards: [
              { title: 'Aurora Studio', meta: 'prazo amanha 11:00', detail: 'precisa montar proposta com 3 itens', badge: 'orcamento', tone: 'blue' },
            ],
          },
        ],
      },
    ],
  },
  '/equipe': {
    title: 'Equipe',
    subtitle: 'Painel gerencial com ranking, ritmo e gargalos do time.',
    toolbar: {
      filters: [{ label: 'Semana', active: true, tone: 'blue' }, { label: 'Time interno' }, { label: 'Ranking' }],
      actions: [{ label: 'Novo membro', tone: 'primary' }],
    },
    stats: [
      { label: 'Vendedores ativos', value: '6', tone: 'blue' },
      { label: 'Meta media', value: '74%', tone: 'emerald' },
      { label: 'Em risco', value: '1 membro', tone: 'amber' },
    ],
    sections: [
      {
        type: 'list',
        title: 'Ranking da semana',
        items: [
          { title: 'Marina Lopes', meta: 'R$ 18,2 mil vendidos', detail: 'lidera em fechamento e follow-up', badge: 'top 1', tone: 'emerald' },
          { title: 'Felipe Duarte', meta: '9 oportunidades em aberto', detail: 'maior pipeline em valor', badge: 'pipeline', tone: 'blue' },
          { title: 'Gabriela Pires', meta: '82 contatos realizados', detail: 'ritmo alto de prospeccao', badge: 'execucao', tone: 'amber' },
        ],
      },
      {
        type: 'progress',
        title: 'Saude do time',
        items: [
          { label: 'Meta comercial media', value: '74%', progress: 74, tone: 'emerald', meta: '3 membros acima de 80%' },
          { label: 'Agenda em dia', value: '89%', progress: 89, tone: 'blue', meta: 'tarefas atrasadas concentradas em 1 pessoa' },
          { label: 'Aproveitamento do funil', value: '62%', progress: 62, tone: 'amber', meta: 'etapa mais fraca: contatado' },
        ],
      },
    ],
  },
  '/metas': {
    title: 'Metas',
    subtitle: 'Objetivos por periodo com leitura rapida de progresso e risco.',
    toolbar: {
      filters: [{ label: 'Mensal', active: true, tone: 'blue' }, { label: 'Semanal' }, { label: 'Time comercial' }],
      actions: [{ label: 'Nova meta', tone: 'primary' }],
    },
    stats: [
      { label: 'Metas ativas', value: '5', tone: 'blue' },
      { label: 'Batidas', value: '2', tone: 'emerald' },
      { label: 'Media de progresso', value: '67%', tone: 'amber' },
    ],
    sections: [
      {
        type: 'progress',
        span: 'full',
        title: 'Cards de meta',
        items: [
          { label: 'Clientes cadastrados no mes', value: '12 de 18', progress: 67, tone: 'emerald', meta: 'faltam 6 para bater' },
          { label: 'Novos orcamentos da semana', value: '5 de 8', progress: 63, tone: 'blue', meta: '2 negocoes prontas para proposta' },
          { label: 'Meta diaria de contatos', value: '8 de 12', progress: 67, tone: 'amber', meta: 'ritmo pode subir apos o almoco' },
        ],
      },
      {
        type: 'list',
        title: 'Leitura gerencial',
        items: [
          { title: 'Snapshot por periodo', meta: 'salva o progresso do ciclo atual', detail: 'facilita comparacao em reunioes de resultado', badge: 'historico', tone: 'slate' },
          { title: 'Metas diarias e semanais', meta: 'mistura execucao e faturamento', detail: 'cada objetivo aparece no contexto certo da operacao', badge: 'cadencia', tone: 'blue' },
        ],
      },
    ],
  },
  '/tarefas': {
    title: 'Tarefas',
    subtitle: 'Fila de execucao com prioridade, prazo e vinculo com cliente ou oportunidade.',
    toolbar: {
      tabs: [{ label: 'Pendentes', count: '11', active: true }, { label: 'Em andamento', count: '4' }, { label: 'Concluidas', count: '6' }],
      filters: [{ label: 'Alta prioridade', active: true, tone: 'rose' }, { label: 'Hoje' }, { label: 'Semana' }],
      actions: [{ label: 'Nova tarefa', tone: 'primary' }],
    },
    stats: [
      { label: 'Pendentes', value: '11', tone: 'amber' },
      { label: 'Em andamento', value: '4', tone: 'blue' },
      { label: 'Concluidas hoje', value: '6', tone: 'emerald' },
    ],
    sections: [
      {
        type: 'list',
        title: 'Fila do dia',
        items: [
          { title: 'Ligar para lead quente', meta: 'alta  |  vence hoje 14:00', detail: 'vinculada a Nova Rota Logistica', badge: 'urgente', tone: 'rose' },
          { title: 'Enviar proposta revisada', meta: 'media  |  em andamento', detail: 'orcamento #084 para Aurora Studio', badge: 'orcamento', tone: 'blue' },
          { title: 'Preparar treinamento do cliente', meta: 'alta  |  sexta-feira', detail: 'pedido #102 ja confirmado', badge: 'pos-venda', tone: 'emerald' },
        ],
      },
      {
        type: 'table',
        title: 'Agenda vinculada',
        columns: ['Titulo', 'Vinculo', 'Prazo', 'Prioridade'],
        rows: [
          ['Reuniao de kickoff', 'Pedido #104', '18/03 09:00', { label: 'Alta', tone: 'rose', align: 'right' }],
          ['Cobrar retorno do decisor', 'Nogueira Tech', 'Hoje 16:30', { label: 'Media', tone: 'amber', align: 'right' }],
          ['Atualizar cronograma interno', 'Aurora Studio', 'Amanha 10:00', { label: 'Baixa', tone: 'slate', align: 'right' }],
        ],
      },
    ],
  },
  '/produtos': {
    title: 'Produtos e servicos',
    subtitle: 'Catalogo enxuto para montar orcamentos e pedidos com velocidade.',
    toolbar: {
      filters: [{ label: 'Produtos', active: true, tone: 'blue' }, { label: 'Servicos' }, { label: 'Baixo estoque', tone: 'amber' }],
      actions: [{ label: 'Importar tabela', tone: 'ghost' }, { label: 'Novo item', tone: 'primary' }],
    },
    stats: [
      { label: 'Itens ativos', value: '42', tone: 'blue' },
      { label: 'Servicos', value: '18', tone: 'emerald' },
      { label: 'Baixo estoque', value: '3', tone: 'amber' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Itens mais usados',
        columns: ['Item', 'Tipo', 'Preco', 'Status'],
        rows: [
          ['Plano de Implantacao', { label: 'Servico', tone: 'emerald' }, { label: 'R$ 4,2 mil', align: 'right', emphasis: 'strong' }, { label: 'Ativo', tone: 'blue', align: 'right' }],
          ['Modulo de Automacao', { label: 'Produto', tone: 'blue' }, { label: 'R$ 2,8 mil', align: 'right', emphasis: 'strong' }, { label: 'Estoque 20', tone: 'amber', align: 'right' }],
          ['Kit de Suporte Premium', { label: 'Servico', tone: 'emerald' }, { label: 'R$ 980', align: 'right', emphasis: 'strong' }, { label: 'Ativo', tone: 'blue', align: 'right' }],
        ],
      },
      {
        type: 'list',
        title: 'Uso na operacao',
        items: [
          { title: 'Orcamentos puxam itens do catalogo', meta: 'sem redigitar descricao ou preco', detail: 'ajuda a manter padrao comercial', badge: 'orcamento', tone: 'blue' },
          { title: 'Pedidos reaproveitam a base comercial', meta: 'mesma ficha do item', detail: 'facilita pos-venda e controle financeiro', badge: 'pedido', tone: 'emerald' },
        ],
      },
    ],
  },
  '/financeiro': {
    title: 'Financeiro',
    subtitle: 'Contas agrupadas por cliente, parcelas e recorrencias em leitura compacta.',
    toolbar: {
      tabs: [{ label: 'Receber', count: '14', active: true }, { label: 'Pagar', count: '6' }],
      filters: [{ label: 'Atrasadas', tone: 'rose' }, { label: 'Hoje', active: true, tone: 'amber' }, { label: 'Recorrentes', tone: 'blue' }],
      actions: [{ label: 'Registrar movimento', tone: 'secondary' }, { label: 'Nova conta', tone: 'primary' }],
    },
    stats: [
      { label: 'A receber', value: 'R$ 18,4 mil', tone: 'emerald' },
      { label: 'A pagar', value: 'R$ 3,1 mil', tone: 'rose' },
      { label: 'Vence hoje', value: '2 contas', tone: 'amber' },
    ],
    sections: [
      {
        type: 'table',
        span: 'full',
        title: 'Resumo por grupo',
        columns: ['Conta', 'Cliente', 'Parcelas', 'Vencimento', 'Status'],
        rows: [
          ['Recebimento pedido #104', 'Aurora Studio', '1/3', 'Hoje', { label: 'Parcial', tone: 'blue', align: 'right' }],
          ['Licenca operacional mensal', 'Interno', 'Recorrente', 'Ha 4 dias', { label: 'Atrasado', tone: 'rose', align: 'right' }],
          ['Recebimento pedido #103', 'Nogueira Tech', 'Unica', 'Sexta', { label: 'Pendente', tone: 'amber', align: 'right' }],
        ],
      },
      {
        type: 'list',
        title: 'Acoes operacionais',
        items: [
          { title: 'Receber ou pagar a proxima parcela', meta: 'acao rapida no menu do grupo', detail: 'evita abrir cada conta individualmente', badge: 'movimento', tone: 'emerald' },
          { title: 'Expandir parcelamentos e recorrencias', meta: 'visualizacao sob demanda', detail: 'mantem densidade alta sem perder detalhe', badge: 'parcelas', tone: 'blue' },
          { title: 'Gerar lembrete ou aplicar multa', meta: 'fluxo embutido na lista', detail: 'ideal para cobranca e inadimplencia', badge: 'cobranca', tone: 'amber' },
        ],
      },
    ],
  },
}
