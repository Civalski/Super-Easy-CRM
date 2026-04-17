'use client'

import { useCallback, useState } from 'react'
import { formatDateToLocalISO } from '@/lib/date'
import { CAMPOS_FIXOS_PARTE } from '../constants'
import type {
  Clausula,
  Contrato,
  ContratoCustomField,
  ContratoFormState,
  ContratoFormValues,
  DadosParte,
  DadosPartes,
} from '../types'
import { parseClausulasFromText } from '../utils'

const emptyParte: DadosParte = {
  nome: '',
  rg: '',
  documento: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  email: '',
  telefone: '',
}

function createInitialFormState(tipo: string = 'geral'): ContratoFormState {
  return {
    titulo: '',
    tipo,
    descricao: '',
    preambulo: '',
    clausulas: [{ titulo: '', conteudo: '' }],
    dadosPartes: {
      contratante: { ...emptyParte },
      contratado: { ...emptyParte },
    },
    dataInicio: formatDateToLocalISO(new Date()) || '',
    dataFim: '',
    dataAssinatura: formatDateToLocalISO(new Date()) || '',
    localAssinatura: '',
    observacoes: '',
  }
}

function mergeCustomFields(
  parte: DadosParte | undefined,
  customFields: ContratoCustomField[]
): DadosParte {
  const base = { ...parte } as DadosParte

  for (const { key, value } of customFields) {
    const normalizedKey = key.trim()
    if (normalizedKey && !CAMPOS_FIXOS_PARTE.includes(normalizedKey as (typeof CAMPOS_FIXOS_PARTE)[number])) {
      base[normalizedKey] = value.trim()
    }
  }

  return base
}

export function useContratoForm() {
  const [clienteId, setClienteId] = useState('')
  const [clienteLabel, setClienteLabel] = useState('')
  const [clausulasMode, setClausulasMode] = useState<'manual' | 'paste'>('manual')
  const [clausulasTextoBruto, setClausulasTextoBruto] = useState('')
  const [customFieldsContratante, setCustomFieldsContratante] = useState<ContratoCustomField[]>([])
  const [customFieldsContratado, setCustomFieldsContratado] = useState<ContratoCustomField[]>([])
  const [form, setForm] = useState<ContratoFormState>(createInitialFormState)

  const resetForm = useCallback((options?: { tipo?: string }) => {
    setClienteId('')
    setClienteLabel('')
    setClausulasMode('manual')
    setClausulasTextoBruto('')
    setCustomFieldsContratante([])
    setCustomFieldsContratado([])
    setForm(createInitialFormState(options?.tipo ?? 'geral'))
  }, [])

  const setFormFromContrato = useCallback((contrato: Contrato) => {
    const isProposta = contrato.tipo === 'proposta'
    const clausulas = isProposta
      ? []
      : Array.isArray(contrato.clausulas) && contrato.clausulas.length > 0
        ? contrato.clausulas.map((c) => ({ titulo: c.titulo ?? '', conteudo: c.conteudo ?? '' }))
        : [{ titulo: '', conteudo: '' }]

    const dadosPartes = contrato.dadosPartes ?? {}
    const contratante = { ...emptyParte, ...dadosPartes.contratante }
    const contratado = { ...emptyParte, ...dadosPartes.contratado }

    const extractCustom = (parte: DadosParte): ContratoCustomField[] =>
      Object.entries(parte)
        .filter(([k, v]) => v && typeof v === 'string' && !CAMPOS_FIXOS_PARTE.includes(k as (typeof CAMPOS_FIXOS_PARTE)[number]))
        .map(([key, value]) => ({ key, value: value as string }))

    setClienteId(contrato.clienteId ?? '')
    setClienteLabel(contrato.cliente?.nome ?? '')
    setClausulasMode('manual')
    setClausulasTextoBruto('')
    setCustomFieldsContratante(extractCustom(contratante))
    setCustomFieldsContratado(extractCustom(contratado))
    setForm({
      titulo: contrato.titulo ?? '',
      tipo: contrato.tipo ?? 'geral',
      descricao: contrato.descricao ?? '',
      preambulo: contrato.preambulo ?? '',
      clausulas,
      dadosPartes: { contratante, contratado },
      dataInicio: formatDateToLocalISO(contrato.dataInicio) || formatDateToLocalISO(new Date()) || '',
      dataFim: formatDateToLocalISO(contrato.dataFim) || '',
      dataAssinatura: formatDateToLocalISO(contrato.dataAssinatura) || formatDateToLocalISO(new Date()) || '',
      localAssinatura: contrato.localAssinatura ?? '',
      observacoes: contrato.observacoes ?? '',
    })
  }, [])

  const handleClienteChange = useCallback((id: string, label: string) => {
    setClienteId(id)
    setClienteLabel(label)
  }, [])

  const handleField = useCallback(
    <K extends keyof ContratoFormState>(field: K, value: ContratoFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleClausulaChange = useCallback((idx: number, field: keyof Clausula, value: string) => {
    setForm((prev) => {
      const next = [...prev.clausulas]
      next[idx] = { ...next[idx], [field]: value }
      return { ...prev, clausulas: next }
    })
  }, [])

  const addClausula = useCallback(() => {
    setForm((prev) => ({ ...prev, clausulas: [...prev.clausulas, { titulo: '', conteudo: '' }] }))
  }, [])

  const removeClausula = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      clausulas: prev.clausulas.filter((_, currentIndex) => currentIndex !== idx),
    }))
  }, [])

  const handleParteChange = useCallback((parte: 'contratante' | 'contratado', field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      dadosPartes: {
        ...prev.dadosPartes,
        [parte]: {
          ...(prev.dadosPartes[parte] ?? emptyParte),
          [field]: value,
        } as DadosParte,
      },
    }))
  }, [])

  const addCustomField = useCallback((parte: 'contratante' | 'contratado') => {
    const setter = parte === 'contratante' ? setCustomFieldsContratante : setCustomFieldsContratado
    setter((prev) => [...prev, { key: '', value: '' }])
  }, [])

  const updateCustomField = useCallback(
    (parte: 'contratante' | 'contratado', idx: number, field: keyof ContratoCustomField, value: string) => {
      const setter = parte === 'contratante' ? setCustomFieldsContratante : setCustomFieldsContratado
      setter((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], [field]: value }
        return next
      })
    },
    []
  )

  const removeCustomField = useCallback((parte: 'contratante' | 'contratado', idx: number) => {
    const setter = parte === 'contratante' ? setCustomFieldsContratante : setCustomFieldsContratado
    setter((prev) => prev.filter((_, currentIndex) => currentIndex !== idx))
  }, [])

  const applyParsedClausulas = useCallback(() => {
    const parsed = parseClausulasFromText(clausulasTextoBruto)
    if (parsed.length > 0) {
      setForm((prev) => ({ ...prev, clausulas: parsed }))
      setClausulasMode('manual')
    }
  }, [clausulasTextoBruto])

  const buildPayload = useCallback((): ContratoFormValues => {
    const isProposta = form.tipo === 'proposta'
    const clausulas =
      isProposta
        ? []
        : clausulasMode === 'paste'
        ? parseClausulasFromText(clausulasTextoBruto)
        : form.clausulas.filter((clausula) => clausula.titulo.trim() || clausula.conteudo.trim())

    const dadosPartes: DadosPartes = {
      contratante: mergeCustomFields(form.dadosPartes.contratante, customFieldsContratante),
      contratado: mergeCustomFields(form.dadosPartes.contratado, customFieldsContratado),
    }

    return {
      ...form,
      clausulas,
      dadosPartes,
      clienteId: clienteId || '',
      oportunidadeId: '',
    }
  }, [clausulasMode, clausulasTextoBruto, customFieldsContratado, customFieldsContratante, form, clienteId])

  return {
    form,
    setForm,
    resetForm,
    setFormFromContrato,
    clienteId,
    clienteLabel,
    clausulasMode,
    setClausulasMode,
    clausulasTextoBruto,
    setClausulasTextoBruto,
    customFieldsContratante,
    customFieldsContratado,
    handleClienteChange,
    handleField,
    handleClausulaChange,
    addClausula,
    removeClausula,
    handleParteChange,
    addCustomField,
    updateCustomField,
    removeCustomField,
    applyParsedClausulas,
    buildPayload,
    emptyParte,
  }
}
