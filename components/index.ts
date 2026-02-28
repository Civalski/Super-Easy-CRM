/**
 * Barrel export principal de componentes
 *
 * Estrutura:
 * - common/     → Componentes UI reutilizáveis
 * - layout/     → Estrutura de layout (Header, Sidebar)
 * - features/   → Componentes organizados por módulo
 *   - leads/         → Busca e importação de leads
 *   - oportunidades/ → Orçamentos comerciais
 *   - clientes/      → Gerenciamento de clientes
 *   - tarefas/       → Gerenciamento de tarefas
 *   - dashboard/     → Métricas e visão geral
 *   - prospectar/    → Gestão de prospectos
 *   - relatorios/    → Relatórios e análises
 *   - configuracoes/ → Configurações do sistema
 */

// Re-exports para manter compatibilidade
export * from './common';
