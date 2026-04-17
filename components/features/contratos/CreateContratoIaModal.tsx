'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { MODELOS_IA_CONTRATO } from '@/lib/contratos-ia'
import { toast } from '@/lib/toast'
import { ContratoFormDrawer } from './ContratoFormDrawer'
import { ContratoFormFields } from './ContratoFormFields'
import { ContratoIaAssistPanel } from './ContratoIaAssistPanel'
import { useContratoForm } from './hooks/useContratoForm'
import type { CreateContratoModalProps } from './types'

interface CreateContratoIaModalProps extends CreateContratoModalProps {
  onBack: () => void
}

const DEFAULT_PRIMARY_MODEL = 'gpt-5-nano'
const FIXED_MULTI_PRIMARY_MODEL = 'gemini-2.0-flash'
const FIXED_MULTI_SECONDARY_MODEL = 'gpt-5-mini'

export function CreateContratoIaModal({
  open,
  onClose,
  onCreated,
  onSave,
  saving,
  onBack,
  documentVariant = 'contrato',
}: CreateContratoIaModalProps) {
  const {
    form,
    setForm,
    resetForm,
    clienteLabel,
    emptyParte,
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
  } = useContratoForm()
  const [iaPrompt, setIaPrompt] = useState('')
  const [iaLoading, setIaLoading] = useState(false)
  const [useMultiModels, setUseMultiModels] = useState(false)
  const [primaryModel, setPrimaryModel] = useState(DEFAULT_PRIMARY_MODEL)
  const [iaRigidez, setIaRigidez] = useState('moderado')
  const [iaUso, setIaUso] = useState<{ model: string; usado: number; limite: number; restante: number }[]>([])

  useEffect(() => {
    if (!open) return

    resetForm({ tipo: documentVariant === 'proposta' ? 'proposta' : 'geral' })
    setIaPrompt('')
    setUseMultiModels(false)
    setPrimaryModel(DEFAULT_PRIMARY_MODEL)
    setIaRigidez('moderado')

    fetch('/api/contratos/gerar-ia/uso')
      .then((response) => response.json())
      .then((data) => setIaUso(data.uso ?? []))
      .catch(() => setIaUso([]))
  }, [documentVariant, open, resetForm])

  const handleSelectChange = useCallback(
    (opt: AsyncSelectOption | null) => {
      if (opt?.tipo && opt.tipo !== 'cliente') return
      handleClienteChange(opt?.id ?? '', opt?.nome ?? '')
    },
    [handleClienteChange]
  )

  const handleGerarComIa = useCallback(async () => {
    const prompt = iaPrompt.trim()
    if (!prompt) {
      toast.error(documentVariant === 'proposta' ? 'Descreva a proposta' : 'Descreva o contrato', {
        description:
          documentVariant === 'proposta'
            ? 'Informe escopo e condições para a IA montar a proposta comercial.'
            : 'Informe o que deseja no contrato para a IA gerar.',
      })
      return
    }

    const isProposta = form.tipo === 'proposta'

    setIaLoading(true)

    try {
      const response = await fetch('/api/contratos/gerar-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          titulo: form.titulo || undefined,
          tipo: form.tipo || undefined,
          modoDocumento: isProposta ? 'proposta' : 'contrato',
          preambuloBase: form.preambulo || undefined,
          clausulasBase: isProposta
            ? []
            : form.clausulas.filter((clausula) => clausula.titulo.trim() || clausula.conteudo.trim()),
          model: useMultiModels ? 'multi-models' : primaryModel,
          useMultiModels,
          primaryModel: useMultiModels ? FIXED_MULTI_PRIMARY_MODEL : primaryModel,
          secondaryModel: useMultiModels ? FIXED_MULTI_SECONDARY_MODEL : undefined,
          rigidez: iaRigidez,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao gerar com IA')
      }

      setForm((prev) => ({
        ...prev,
        preambulo: data.preambulo ?? prev.preambulo,
        observacoes: isProposta ? (data.condicoesComerciais ?? prev.observacoes) : prev.observacoes,
        clausulas:
          isProposta
            ? []
            : Array.isArray(data.clausulas) && data.clausulas.length > 0
              ? data.clausulas
              : prev.clausulas,
        dadosPartes: {
          contratante: {
            ...emptyParte,
            ...prev.dadosPartes.contratante,
            ...data.dadosPartes?.contratante,
          },
          contratado: {
            ...emptyParte,
            ...prev.dadosPartes.contratado,
            ...data.dadosPartes?.contratado,
          },
        },
      }))
      setClausulasMode('manual')
      setIaPrompt('')
      setIaUso((prev) =>
        prev.map((uso) =>
          uso.model === (useMultiModels ? 'multi-models' : primaryModel)
            ? { ...uso, usado: uso.usado + 1, restante: Math.max(0, uso.restante - 1) }
            : uso
        )
      )
      toast.success(documentVariant === 'proposta' ? 'Proposta gerada com IA' : 'Contrato gerado com IA')
    } catch (error) {
      toast.error('Erro', {
        description:
          error instanceof Error
            ? error.message
            : documentVariant === 'proposta'
              ? 'Nao foi possivel gerar a proposta.'
              : 'Nao foi possivel gerar o contrato.',
      })
    } finally {
      setIaLoading(false)
    }
  }, [
    emptyParte,
    form.clausulas,
    form.preambulo,
    form.tipo,
    documentVariant,
    form.titulo,
    iaPrompt,
    iaRigidez,
    primaryModel,
    setClausulasMode,
    setForm,
    useMultiModels,
  ])

  const handleSubmit = useCallback(async () => {
    const created = await onSave(buildPayload())
    if (created) onCreated()
  }, [buildPayload, onCreated, onSave])

  const effectiveUsageKey = useMultiModels ? 'multi-models' : primaryModel
  const effectiveUsage = iaUso.find((uso) => uso.model === effectiveUsageKey)
  const fallbackModelLimit = MODELOS_IA_CONTRATO.find((model) => model.id === effectiveUsageKey)?.limiteDiario ?? 0
  const canGenerate = (effectiveUsage?.restante ?? fallbackModelLimit) > 0

  return (
    <ContratoFormDrawer
      open={open}
      onClose={onClose}
      onBack={onBack}
      onSubmit={() => void handleSubmit()}
      title={documentVariant === 'proposta' ? 'Nova proposta com I.A' : 'Novo contrato com I.A'}
      description={
        documentVariant === 'proposta'
          ? 'Descreva a oportunidade: a IA monta escopo e condições comerciais (sem cláusulas).'
          : 'Fluxo dedicado a IA: descreva o contrato, gere e revise os dados das partes.'
      }
      primaryLabel={documentVariant === 'proposta' ? 'Criar proposta' : 'Criar contrato'}
      primaryDisabled={saving}
      primaryLoading={saving}
    >
      <ContratoFormFields
        formContext={documentVariant === 'proposta' ? 'proposta' : 'contrato'}
        form={form}
        clienteLabel={clienteLabel}
        clausulasMode={clausulasMode}
        clausulasTextoBruto={clausulasTextoBruto}
        customFieldsContratante={customFieldsContratante}
        customFieldsContratado={customFieldsContratado}
        extraContent={
          <ContratoIaAssistPanel
            iaPrompt={iaPrompt}
            iaLoading={iaLoading}
            useMultiModels={useMultiModels}
            primaryModel={primaryModel}
            iaRigidez={iaRigidez}
            iaUso={iaUso}
            canGenerate={canGenerate}
            onIaPromptChange={setIaPrompt}
            onUseMultiModelsChange={setUseMultiModels}
            onPrimaryModelChange={setPrimaryModel}
            onIaRigidezChange={setIaRigidez}
            onGenerate={() => void handleGerarComIa()}
          />
        }
        onClienteChange={handleSelectChange}
        onFieldChange={handleField}
        onClausulasModeChange={setClausulasMode}
        onClausulasTextoBrutoChange={setClausulasTextoBruto}
        onApplyClausulasTexto={applyParsedClausulas}
        onClausulaChange={handleClausulaChange}
        onAddClausula={addClausula}
        onRemoveClausula={removeClausula}
        onParteChange={handleParteChange}
        onAddCustomField={addCustomField}
        onUpdateCustomField={updateCustomField}
        onRemoveCustomField={removeCustomField}
      />
    </ContratoFormDrawer>
  )
}
