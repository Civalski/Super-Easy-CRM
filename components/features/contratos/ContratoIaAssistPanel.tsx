'use client'

import { Button } from '@/components/common'
import { Loader2, Sparkles } from '@/lib/icons'
import { MODELOS_IA_CONTRATO } from '@/lib/contratos-ia'
import { RIGIDEZ_OPCOES } from './constants'

interface ContratoIaAssistPanelProps {
  iaPrompt: string
  iaLoading: boolean
  useMultiModels: boolean
  primaryModel: string
  iaRigidez: string
  iaUso: { model: string; usado: number; limite: number; restante: number }[]
  canGenerate: boolean
  onIaPromptChange: (value: string) => void
  onUseMultiModelsChange: (value: boolean) => void
  onPrimaryModelChange: (value: string) => void
  onIaRigidezChange: (value: string) => void
  onGenerate: () => void
}

export function ContratoIaAssistPanel({
  iaPrompt,
  iaLoading,
  useMultiModels,
  primaryModel,
  iaRigidez,
  iaUso,
  canGenerate,
  onIaPromptChange,
  onUseMultiModelsChange,
  onPrimaryModelChange,
  onIaRigidezChange,
  onGenerate,
}: ContratoIaAssistPanelProps) {
  const executionModels = MODELOS_IA_CONTRATO.filter((model) => model.id !== 'multi-models')
  const effectiveUsageKey = useMultiModels ? 'multi-models' : primaryModel
  const effectiveUsage = iaUso.find((uso) => uso.model === effectiveUsageKey)
  const effectiveRemaining = effectiveUsage?.restante ?? 0

  return (
    <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-900 dark:text-indigo-200">
        <Sparkles size={16} />
        Geracao assistida por IA
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo de geracao</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onUseMultiModelsChange(false)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              !useMultiModels
                ? 'border-indigo-400 bg-indigo-100/70 shadow-sm dark:border-indigo-500 dark:bg-indigo-900/40'
                : 'border-gray-200 bg-white/80 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:hover:bg-gray-800'
            }`}
            aria-pressed={!useMultiModels}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modelo unico</p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">Usa apenas o modelo principal</p>
          </button>

          <button
            type="button"
            onClick={() => onUseMultiModelsChange(true)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              useMultiModels
                ? 'border-indigo-400 bg-indigo-100/70 shadow-sm dark:border-indigo-500 dark:bg-indigo-900/40'
                : 'border-gray-200 bg-white/80 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:hover:bg-gray-800'
            }`}
            aria-pressed={useMultiModels}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Segundo modelo ativo</p>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">Gemini gera e ChatGPT melhora</p>
          </button>
        </div>
      </div>

      {useMultiModels ? (
        <div className="rounded-lg border border-indigo-200 bg-white/70 px-3 py-2 text-xs text-gray-600 dark:border-indigo-700 dark:bg-gray-900/40 dark:text-gray-300">
          Fluxo ativo: 1o modelo Gemini (rascunho) + 2o modelo ChatGPT (aprimora, complementa e corrige).
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Modelo principal
          </label>
          <select
            value={primaryModel}
            onChange={(event) => onPrimaryModelChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {executionModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-xs text-gray-600 dark:text-gray-400">
        Limite do modo atual: {Math.max(0, effectiveRemaining)} restante(s) hoje.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rigidez do contrato
        </label>
        <select
          value={iaRigidez}
          onChange={(event) => onIaRigidezChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {RIGIDEZ_OPCOES.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label} - {opcao.descricao}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descricao do contrato
        </label>
        <textarea
          value={iaPrompt}
          onChange={(event) => onIaPromptChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          rows={4}
          placeholder="Ex: Contrato de prestacao de servicos para desenvolvimento de software, valor R$ 50.000, prazo de 6 meses, empresa contratante XYZ Ltda, contratado Joao Silva..."
          disabled={iaLoading}
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={onGenerate} disabled={iaLoading || !canGenerate}>
          {iaLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="mr-1" />}
          {iaLoading ? 'Gerando...' : 'Gerar base com IA'}
        </Button>
      </div>
    </div>
  )
}
