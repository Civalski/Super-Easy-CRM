'use client'

import { useCallback, useEffect } from 'react'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { ContratoFormDrawer } from './ContratoFormDrawer'
import { ContratoFormFields } from './ContratoFormFields'
import { useContratoForm } from './hooks/useContratoForm'
import type { CreateContratoModalProps } from './types'

interface CreateContratoManualModalProps extends CreateContratoModalProps {
  onBack: () => void
}

export function CreateContratoManualModal({
  open,
  onClose,
  onCreated,
  onSave,
  saving,
  onBack,
}: CreateContratoManualModalProps) {
  const {
    form,
    resetForm,
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
  } = useContratoForm()

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  const handleSelectChange = useCallback(
    (opt: AsyncSelectOption | null) => {
      if (opt?.tipo && opt.tipo !== 'cliente') return
      handleClienteChange(opt?.id ?? '', opt?.nome ?? '')
    },
    [handleClienteChange]
  )

  const handleSubmit = useCallback(async () => {
    const created = await onSave(buildPayload())
    if (created) onCreated()
  }, [buildPayload, onCreated, onSave])

  return (
    <ContratoFormDrawer
      open={open}
      onClose={onClose}
      onBack={onBack}
      onSubmit={() => void handleSubmit()}
      title="Novo contrato manual"
      description="Preencha os dados do contrato sem usar geracao por IA."
      primaryLabel="Criar contrato"
      primaryDisabled={saving}
      primaryLoading={saving}
    >
      <ContratoFormFields
        form={form}
        clienteLabel={clienteLabel}
        clausulasMode={clausulasMode}
        clausulasTextoBruto={clausulasTextoBruto}
        customFieldsContratante={customFieldsContratante}
        customFieldsContratado={customFieldsContratado}
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
