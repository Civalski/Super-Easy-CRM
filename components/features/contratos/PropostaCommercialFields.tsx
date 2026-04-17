'use client'

import { useEffect, useMemo } from 'react'
import {
  buildPropostaComercialText,
  formatPropostaValidadeFromDate,
  parsePropostaComercialFields,
} from './utils'

interface PropostaCommercialFieldsProps {
  observacoes: string
  dataFim: string
  inputClassName: string
  labelClassName: string
  onObservacoesChange: (value: string) => void
}

export function PropostaCommercialFields({
  observacoes,
  dataFim,
  inputClassName,
  labelClassName,
  onObservacoesChange,
}: PropostaCommercialFieldsProps) {
  const fields = useMemo(() => parsePropostaComercialFields(observacoes), [observacoes])

  const validadeAtual = useMemo(
    () => formatPropostaValidadeFromDate(dataFim) || fields.validadeProposta,
    [dataFim, fields.validadeProposta]
  )

  useEffect(() => {
    const nextText = buildPropostaComercialText({
      ...fields,
      validadeProposta: validadeAtual,
    })

    if (nextText !== observacoes) {
      onObservacoesChange(nextText)
    }
  }, [fields, observacoes, onObservacoesChange, validadeAtual])

  const updateField = (
    key: 'precoProjeto' | 'taxasExtras' | 'formaPagamento' | 'opcionais' | 'observacoesComplementares',
    value: string,
  ) => {
    onObservacoesChange(
      buildPropostaComercialText({
        ...fields,
        [key]: value,
        validadeProposta: validadeAtual,
      }),
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Preco do projeto</label>
          <input
            type="text"
            value={fields.precoProjeto}
            onChange={(event) => updateField('precoProjeto', event.target.value)}
            className={inputClassName}
            placeholder="Ex: R$ 12.500,00"
          />
        </div>

        <div>
          <label className={labelClassName}>Taxas extras (opcional)</label>
          <input
            type="text"
            value={fields.taxasExtras}
            onChange={(event) => updateField('taxasExtras', event.target.value)}
            className={inputClassName}
            placeholder="Ex: taxa de urgencia, deslocamento, suporte adicional"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Forma de pagamento</label>
          <textarea
            value={fields.formaPagamento}
            onChange={(event) => updateField('formaPagamento', event.target.value)}
            className={inputClassName}
            rows={3}
            placeholder="Ex: 40% na assinatura + 3x sem juros"
          />
        </div>

        <div>
          <label className={labelClassName}>Opcionais</label>
          <textarea
            value={fields.opcionais}
            onChange={(event) => updateField('opcionais', event.target.value)}
            className={inputClassName}
            rows={3}
            placeholder="Ex: treinamento extra, manutencao estendida, dashboard adicional"
          />
        </div>
      </div>

      <div>
        <label className={labelClassName}>Observacoes comerciais complementares (opcional)</label>
        <textarea
          value={fields.observacoesComplementares}
          onChange={(event) => updateField('observacoesComplementares', event.target.value)}
          className={inputClassName}
          rows={4}
          placeholder="Use blocos com ## Titulo para destacar condicoes adicionais."
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {
          'A validade da proposta e sincronizada automaticamente com o campo "Validade da proposta" acima.'
        }
      </p>
    </div>
  )
}

