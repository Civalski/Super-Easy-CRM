import type { ClientePerfil, CreateClienteForm } from './types'

type ClienteFormSource = {
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
  camposPersonalizados?: Array<{ label?: string | null; value?: string | null }> | null
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function inferClientePerfil(cliente: ClienteFormSource): ClientePerfil {
  const perfilField =
    Array.isArray(cliente.camposPersonalizados)
      ? cliente.camposPersonalizados
          .find((item) => item?.label?.trim().toLowerCase() === 'perfil')
          ?.value?.trim()
          .toLowerCase()
      : undefined

  if (perfilField === 'b2b' || perfilField === 'b2c') {
    return perfilField
  }

  return cliente.empresa?.trim() ? 'b2b' : 'b2c'
}

export function clienteToCreateForm(cliente: ClienteFormSource, perfil?: ClientePerfil): CreateClienteForm {
  const isB2B = (perfil ?? inferClientePerfil(cliente)) === 'b2b'

  return {
    perfil: isB2B ? 'b2b' : 'b2c',
    nome: readText(cliente.nome),
    email: readText(cliente.email),
    telefone: readText(cliente.telefone),
    empresa: readText(cliente.empresa),
    endereco: readText(cliente.endereco),
    cidade: readText(cliente.cidade),
    estado: readText(cliente.estado),
    cep: readText(cliente.cep),
    cargo: readText(cliente.cargo),
    documento: readText(cliente.documento),
    website: readText(cliente.website),
    dataNascimento: readText(cliente.dataNascimento),
    observacoes: readText(cliente.observacoes),
    camposPersonalizados: Array.isArray(cliente.camposPersonalizados)
      ? cliente.camposPersonalizados.map((campo) => ({
          label: campo?.label || '',
          value: campo?.value || '',
        }))
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
