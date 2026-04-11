/**
 * Edição do CRM (definida em build via `NEXT_PUBLIC_CRM_EDITION`).
 *
 * - `full` (padrão): todos os módulos — produção comercial / self-host completo.
 * - `oss`: apenas funil de vendas (`/grupos` + `/oportunidades`), clientes e tarefas.
 */
export type CrmEdition = 'full' | 'oss'

export function getCrmEdition(): CrmEdition {
  const v = process.env.NEXT_PUBLIC_CRM_EDITION?.trim().toLowerCase()
  return v === 'oss' ? 'oss' : 'full'
}

export function isOssEdition(): boolean {
  return getCrmEdition() === 'oss'
}

/** Destino após login ou clique na marca (OSS evita `/dashboard`, que usa APIs da edição completa). */
export function getPostLoginPath(): string {
  return getCrmEdition() === 'oss' ? '/grupos' : '/dashboard'
}

/** Rotas de menu (`href`) habilitadas na edição OSS. */
export const OSS_MENU_HREFS = new Set<string>([
  '/grupos',
  '/oportunidades',
  '/clientes',
  '/tarefas',
])
