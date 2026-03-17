'use client'

import { Bell } from '@/lib/icons'
import { formatDate } from '@/lib/format'
import type { OrcamentoFormData } from './types'
import { CANAL_OPTIONS, FIELD_CLASS, LABEL_CLASS } from './constants'

interface OrcamentoProximaAcaoSectionProps {
  formData: OrcamentoFormData
  proximaAcaoNumero: number
  proximaAcaoUnidade: 'dias' | 'semanas' | 'meses'
  onChange: (field: keyof OrcamentoFormData, value: string | boolean) => void
  onProximaAcaoNumeroChange: (value: number) => void
  onProximaAcaoUnidadeChange: (value: 'dias' | 'semanas' | 'meses') => void
}

export default function OrcamentoProximaAcaoSection({
  formData,
  proximaAcaoNumero,
  proximaAcaoUnidade,
  onChange,
  onProximaAcaoNumeroChange,
  onProximaAcaoUnidadeChange,
}: OrcamentoProximaAcaoSectionProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onChange('lembreteProximaAcao', !formData.lembreteProximaAcao)}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${formData.lembreteProximaAcao ? 'border-violet-400/60 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-950/40' : 'border-gray-200 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-500'}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${formData.lembreteProximaAcao ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          <Bell size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Lembrete da próxima ação</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formData.lembreteProximaAcao ? 'Você será notificado na data definida' : 'Clique para ativar notificação'}</p>
        </div>
        <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${formData.lembreteProximaAcao ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${formData.lembreteProximaAcao ? 'left-5' : 'left-0.5'}`} />
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Data de Fechamento</label>
          <input type="date" className={FIELD_CLASS} value={formData.dataFechamento} onChange={(e) => onChange('dataFechamento', e.target.value)} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Próxima Ação Em</label>
          <div className="flex gap-2">
            <input type="number" min={1} className={`${FIELD_CLASS} w-20`} value={proximaAcaoNumero} onChange={(e) => onProximaAcaoNumeroChange(Math.max(1, Number(e.target.value)))} />
            <select className={FIELD_CLASS} value={proximaAcaoUnidade} onChange={(e) => onProximaAcaoUnidadeChange(e.target.value as 'dias' | 'semanas' | 'meses')}>
              <option value="dias">dias</option><option value="semanas">semanas</option><option value="meses">meses</option>
            </select>
          </div>
          {formData.proximaAcaoEm && <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{formatDate(formData.proximaAcaoEm)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Canal</label>
          <select className={FIELD_CLASS} value={formData.canalProximaAcao} onChange={(e) => onChange('canalProximaAcao', e.target.value)}>
            {CANAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Responsável</label>
          <input className={FIELD_CLASS} value={formData.responsavelProximaAcao} onChange={(e) => onChange('responsavelProximaAcao', e.target.value)} />
        </div>
      </div>
    </>
  )
}
