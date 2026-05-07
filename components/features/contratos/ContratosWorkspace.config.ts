import type { LucideIcon } from '@/lib/icons'
import { DocumentCheck, DocumentDuplicate } from '@/lib/icons'
export type ContratosWorkspaceVariant = 'contratos' | 'propostas'

export const CONTRATOS_WORKSPACE_VARIANT_UI: Record<
  ContratosWorkspaceVariant,
  {
    title: string
    subtitle: string
    heroIcon: LucideIcon
    filterAria: string
    downloadFallback: string
  }
> = {
  contratos: {
    title: 'Contratos',
    subtitle: 'Crie contratos, preencha cláusulas e gere PDFs formais',
    heroIcon: DocumentCheck,
    filterAria: 'Filtrar contratos',
    downloadFallback: 'Contrato.pdf',
  },
  propostas: {
    title: 'Proposta',
    subtitle: 'Propostas comerciais (tipo Proposta de Serviços, PDF via motor de contratos).',
    heroIcon: DocumentDuplicate,
    filterAria: 'Filtrar propostas',
    downloadFallback: 'Proposta.pdf',
  },
}
