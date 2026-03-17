'use client'

import { useCallback, useEffect } from 'react'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { ContratoFormDrawer } from './ContratoFormDrawer'
import { ContratoFormFields } from './ContratoFormFields'
import { useContratoForm } from './hooks/useContratoForm'
import type { Contrato, ContratoFormValues } from './types'

interface EditContratoDrawerProps {
  open: boolean
  contrato: Contrato | null
  saving: boolean
  onClose: () => void
  onSave: (id: string, values: ContratoFormValues) => Promise<unknown>
}

export function EditContratoDrawer({
  open,
  contrato,
  saving,
  onClose,
  onSave,
}: EditContratoDrawerProps) {
  const {
    form,
    setFormFromContrato,
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
    if (open && contrato) {
      setFormFromContrato(contrato)
    }
  }, [open, contrato, setFormFromContrato])

  const handleSelectChange = useCallback(
    (opt: AsyncSelectOption | null) => {
      if (opt?.tipo && opt.tipo !== 'cliente') return
      handleClienteChange(opt?.id ?? '', opt?.nome ?? '')
    },
    [handleClienteChange]
  )

  const handleSubmit = useCallback(async () => {
    if (!contrato) return
    const updated = await onSave(contrato.id, buildPayload())
    if (updated) onClose()
  }, [buildPayload, contrato, onClose, onSave])

  if (!contrato) return null

  return (
    <ContratoFormDrawer
      open={open}
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      title="Editar contrato"
      description={`Altere os dados do contrato #${String(contrato.numero).padStart(5, '0')}`}
      primaryLabel="Salvar alterações"
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
