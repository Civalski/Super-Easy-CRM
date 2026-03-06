import type { CreateClienteForm } from './types'

/** Cliente da API com campos usados no formulário de edição */
type ClienteParaForm = {
  nome?: string | null
  email?: string | null
  telefone?: string | null
  empresa?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  cargo?: string | null
  documento?: string | null
  website?: string | null
  dataNascimento?: string | null
  observacoes?: string | null
  camposPersonalizados?: Array<{ label?: string; value?: string }> | null
}

export function clienteToCreateForm(cliente: ClienteParaForm, perfil: 'b2c' | 'b2b' = 'b2c'): CreateClienteForm {
  const cp = cliente.camposPersonalizados
  const isB2B =
    perfil === 'b2b' ||
    (Array.isArray(cp) &&
      cp.some(
        (c) =>
          c?.label?.trim().toLowerCase() === 'perfil' && c?.value?.trim().toLowerCase() === 'b2b'
      ))
  return {
    perfil: isB2B ? 'b2b' : 'b2c',
    nome: cliente.nome || '',
    email: cliente.email || '',
    telefone: cliente.telefone || '',
    empresa: cliente.empresa || '',
    endereco: cliente.endereco || '',
    cidade: cliente.cidade || '',
    estado: cliente.estado || '',
    cep: cliente.cep || '',
    cargo: cliente.cargo || '',
    documento: cliente.documento || '',
    website: cliente.website || '',
    dataNascimento: cliente.dataNascimento || '',
    observacoes: cliente.observacoes || '',
    camposPersonalizados: Array.isArray(cliente.camposPersonalizados)
      ? cliente.camposPersonalizados.map((f) => ({ label: f?.label || '', value: f?.value || '' }))
      : [],
  }
}

export function sanitizeCreateClienteForm(form: CreateClienteForm): CreateClienteForm {
  return {
    ...form,
    nome: form.nome.trim(),
    email: form.email.trim(),
    telefone: form.telefone.trim(),
    empresa: form.empresa.trim(),
    endereco: form.endereco.trim(),
    cidade: form.cidade.trim(),
    estado: form.estado.trim(),
    cep: form.cep.trim(),
    cargo: form.cargo.trim(),
    documento: form.documento.trim(),
    website: form.website.trim(),
    dataNascimento: form.dataNascimento.trim(),
    observacoes: form.observacoes.trim(),
    camposPersonalizados: form.camposPersonalizados
      .map((campo) => ({
        label: campo.label.trim(),
        value: campo.value.trim(),
      }))
      .filter((campo) => campo.label.length > 0),
  }
}

export function toCreateClientePayload(form: CreateClienteForm) {
  const sanitized = sanitizeCreateClienteForm(form)
  const nomeFallback = sanitized.perfil === 'b2b' ? sanitized.empresa : ''
  const nomeFinal = sanitized.nome || nomeFallback
  const { perfil, ...payload } = sanitized

  return {
    ...payload,
    nome: nomeFinal,
    camposPersonalizados: payload.camposPersonalizados,
  }
}

export function toUpdateClientePayload(form: CreateClienteForm) {
  return toCreateClientePayload(form)
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
