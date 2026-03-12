'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Check, Loader2, Building, Target, FileText, Upload, X, Moon, Sun, PanelLeft, Menu, Settings } from '@/lib/icons'
import { setThemePreference } from '@/lib/ui/themePreference'
import { setMenuLayout } from '@/lib/ui/menuLayoutPreference'
import type { OnboardingFormData } from './types'
import { TIPO_PUBLICO_OPTIONS, AREA_ATUACAO_SUGGESTIONS, ONBOARDING_STEPS } from './constants'

const LOGO_LIMIT_KB = 450
const DEFAULT_PDF_COLOR = '#122d8c'

const TOTAL_STEPS = ONBOARDING_STEPS.length

interface OnboardingFormProps {
  initialData?: Partial<OnboardingFormData>
  onSubmit: (data: OnboardingFormData) => void
  onSkip: () => void
  saving: boolean
  error: string | null
  onStepChange?: (step: number) => void
}

export function OnboardingForm({
  initialData,
  onSubmit,
  onSkip,
  saving,
  error,
  onStepChange,
}: OnboardingFormProps) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [animating, setAnimating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<OnboardingFormData>({
    areaAtuacao: initialData?.areaAtuacao ?? '',
    tipoPublico: initialData?.tipoPublico ?? 'ambos',
    nomeEmpresa: initialData?.nomeEmpresa ?? '',
    nomeVendedor: initialData?.nomeVendedor ?? '',
    telefone: initialData?.telefone ?? '',
    email: initialData?.email ?? '',
    site: initialData?.site ?? '',
    rodape: initialData?.rodape ?? '',
    logoBase64: initialData?.logoBase64 ?? '',
    logoPosicao: initialData?.logoPosicao ?? 'topo',
    corPrimaria: initialData?.corPrimaria ?? DEFAULT_PDF_COLOR,
    temaPreferencia: initialData?.temaPreferencia ?? 'dark',
    menuLayout: initialData?.menuLayout ?? 'header',
  })

  const set = (field: keyof OnboardingFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  const goTo = (newStep: number) => {
    if (animating || newStep === step) return
    setDirection(newStep > step ? 'forward' : 'backward')
    setAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setAnimating(false)
    }, 200)
  }

  const goNext = () => {
    if (step < TOTAL_STEPS) goTo(step + 1)
  }
  const goBack = () => {
    if (step > 1) goTo(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < TOTAL_STEPS) {
      goNext()
    } else {
      onSubmit(form)
    }
  }

  return (
    <div className="onb-wizard">
      {/* Progress header */}
      <div className="onb-progress-header">
        <div className="onb-steps-row">
          {ONBOARDING_STEPS.map((s, i) => {
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => isDone && goTo(s.id)}
                className={`onb-step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                disabled={!isDone && !isActive}
                aria-label={`Etapa ${s.id}: ${s.title}`}
              >
                <span className="onb-dot-circle">
                  {isDone ? <Check className="onb-dot-icon" /> : s.id}
                </span>
                <span className="onb-dot-label">{s.title}</span>
              </button>
            )
          })}
        </div>
        <div className="onb-progress-track">
          <div
            className="onb-progress-fill"
            style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="onb-error" role="alert">
          {error}
        </div>
      )}

      {/* Step content */}
      <form onSubmit={handleSubmit}>
        <div
          ref={contentRef}
          className={`onb-step-content ${animating ? (direction === 'forward' ? 'slide-out-left' : 'slide-out-right') : 'slide-in'}`}
        >
          {step === 1 && <Step1AreaAtuacao form={form} setForm={setForm} set={set} />}
          {step === 2 && <Step2TipoPublico form={form} setForm={setForm} />}
          {step === 3 && <Step3DadosPdf form={form} set={set} setForm={setForm} />}
          {step === 4 && <Step4Preferencias form={form} setForm={setForm} />}
        </div>

        {/* Footer actions */}
        <div className="onb-footer">
          <div className="onb-footer-left">
            {step > 1 ? (
              <button type="button" onClick={goBack} className="onb-btn-back">
                <ArrowLeft className="onb-btn-icon" />
                Voltar
              </button>
            ) : (
              <button type="button" onClick={onSkip} className="onb-btn-skip" disabled={saving}>
                Pular e configurar depois
              </button>
            )}
          </div>
          <div className="onb-footer-right">
            {step < TOTAL_STEPS ? (
              <button type="submit" className="onb-btn-next">
                Continuar
                <ArrowRight className="onb-btn-icon" />
              </button>
            ) : (
              <button type="submit" disabled={saving} className="onb-btn-finish">
                {saving ? (
                  <>
                    <Loader2 className="onb-btn-icon animate-spin" />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Check className="onb-btn-icon" />
                    Concluir configuração
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

/* ─── Step 1: Area de Atuação ─── */
function Step1AreaAtuacao({
  form,
  setForm,
  set,
}: {
  form: OnboardingFormData
  setForm: React.Dispatch<React.SetStateAction<OnboardingFormData>>
  set: (field: keyof OnboardingFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [showCustom, setShowCustom] = useState(
    form.areaAtuacao !== '' && !AREA_ATUACAO_SUGGESTIONS.includes(form.areaAtuacao)
  )

  const Icon = Building
  return (
    <div className="onb-step-inner">
      <div className="onb-step-header">
        <span className="onb-step-icon">
          <Icon className="h-8 w-8" />
        </span>
        <h2 className="onb-step-title">Em qual área sua empresa atua?</h2>
        <p className="onb-step-desc">
          Selecione sua área de atuação para personalizarmos sua experiência
        </p>
      </div>
      <div className="onb-area-grid">
        {AREA_ATUACAO_SUGGESTIONS.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => {
              if (area === 'Outro') {
                setShowCustom(true)
                setForm((p) => ({ ...p, areaAtuacao: '' }))
              } else {
                setShowCustom(false)
                setForm((p) => ({ ...p, areaAtuacao: area }))
              }
            }}
            className={`onb-area-chip ${form.areaAtuacao === area && !showCustom ? 'selected' : ''}`}
          >
            {area}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="onb-custom-field">
          <input
            type="text"
            value={form.areaAtuacao}
            onChange={set('areaAtuacao')}
            placeholder="Digite sua área de atuação…"
            className="onb-input"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

/* ─── Step 2: Tipo de Público ─── */
function Step2TipoPublico({
  form,
  setForm,
}: {
  form: OnboardingFormData
  setForm: React.Dispatch<React.SetStateAction<OnboardingFormData>>
}) {
  const Icon = Target
  return (
    <div className="onb-step-inner">
      <div className="onb-step-header">
        <span className="onb-step-icon">
          <Icon className="h-8 w-8" />
        </span>
        <h2 className="onb-step-title">Quem são seus clientes?</h2>
        <p className="onb-step-desc">
          Isso nos ajuda a configurar campos e etapas relevantes para o seu negócio
        </p>
      </div>
      <div className="onb-publico-grid">
        {TIPO_PUBLICO_OPTIONS.map((opt) => {
          const OptIcon = opt.icon
          return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setForm((p) => ({ ...p, tipoPublico: opt.value }))}
            className={`onb-publico-card ${form.tipoPublico === opt.value ? 'selected' : ''}`}
          >
            <span className="onb-publico-icon">
              <OptIcon className="h-7 w-7" />
            </span>
            <span className="onb-publico-label">{opt.label}</span>
            <span className="onb-publico-desc">{opt.description}</span>
            {form.tipoPublico === opt.value && (
              <span className="onb-publico-check">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step 3: Dados para PDF ─── */
function Step3DadosPdf({
  form,
  set,
  setForm,
}: {
  form: OnboardingFormData
  set: (field: keyof OnboardingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  setForm: React.Dispatch<React.SetStateAction<OnboardingFormData>>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoError, setLogoError] = useState('')

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    if (file.size > LOGO_LIMIT_KB * 1024) {
      setLogoError(`A imagem deve ter no máximo ${LOGO_LIMIT_KB}KB. Arquivo: ${Math.round(file.size / 1024)}KB.`)
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setForm((prev) => ({ ...prev, logoBase64: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setForm((prev) => ({ ...prev, logoBase64: '' }))
    setLogoError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const Icon = FileText
  return (
    <div className="onb-step-inner">
      <div className="onb-step-header">
        <span className="onb-step-icon">
          <Icon className="h-8 w-8" />
        </span>
        <h2 className="onb-step-title">Dados para seus documentos</h2>
        <p className="onb-step-desc">
          Essas informações aparecerão em orçamentos e pedidos gerados em PDF
        </p>
      </div>
      <div className="onb-pdf-grid">
        <div className="onb-field onb-logo-field">
          <label className="onb-label">Logo PDF</label>
          <div className="onb-logo-upload onb-logo-upload--compact">
            {form.logoBase64 ? (
              <div className="onb-logo-preview">
                <img src={form.logoBase64} alt="Logo" className="onb-logo-img" />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="onb-logo-remove"
                  title="Remover logo"
                  aria-label="Remover logo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="onb-logo-dropzone">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
                <Upload className="h-4 w-4" />
                <span>Imagem (até 450KB)</span>
              </label>
            )}
          </div>
          {logoError && <p className="onb-logo-error">{logoError}</p>}
        </div>
        <div className="onb-field">
          <label className="onb-label">Posição do logo</label>
          <select
            value={form.logoPosicao}
            onChange={(e) => setForm((p) => ({ ...p, logoPosicao: e.target.value as 'topo' | 'rodape' }))}
            className="onb-input"
          >
            <option value="topo">Topo</option>
            <option value="rodape">Rodapé</option>
          </select>
        </div>
        <div className="onb-field">
          <label className="onb-label">Cor principal do PDF</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.corPrimaria || DEFAULT_PDF_COLOR}
              onChange={set('corPrimaria')}
              className="h-9 w-10 cursor-pointer rounded-md border border-gray-200 dark:border-gray-600 bg-transparent p-0.5"
              title="Selecionar cor"
            />
            <input
              type="text"
              value={form.corPrimaria || DEFAULT_PDF_COLOR}
              onChange={set('corPrimaria')}
              placeholder="#122d8c"
              className="onb-input h-9 w-24 font-mono text-xs"
              maxLength={7}
            />
          </div>
          <span className="onb-label-opt mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
            Cabeçalho e tabelas dos orçamentos
          </span>
        </div>
        <div className="onb-field">
          <label className="onb-label">Nome da empresa</label>
          <input
            type="text"
            value={form.nomeEmpresa}
            onChange={set('nomeEmpresa')}
            placeholder="Ex: Minha Empresa Ltda"
            className="onb-input"
          />
        </div>
        <div className="onb-field">
          <label className="onb-label">Vendedor / Emitente</label>
          <input
            type="text"
            value={form.nomeVendedor}
            onChange={set('nomeVendedor')}
            placeholder="Seu nome ou do responsável"
            className="onb-input"
          />
        </div>
        <div className="onb-field">
          <label className="onb-label">Telefone</label>
          <input
            type="text"
            value={form.telefone}
            onChange={set('telefone')}
            placeholder="(11) 99999-9999"
            className="onb-input"
          />
        </div>
        <div className="onb-field">
          <label className="onb-label">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="contato@empresa.com"
            className="onb-input"
          />
        </div>
        <div className="onb-field">
          <label className="onb-label">Site</label>
          <input
            type="text"
            value={form.site}
            onChange={set('site')}
            placeholder="www.empresa.com"
            className="onb-input"
          />
        </div>
        <div className="onb-field onb-field-full">
          <label className="onb-label">
            Rodapé do PDF <span className="onb-label-opt">(opcional)</span>
          </label>
          <textarea
            value={form.rodape}
            onChange={set('rodape')}
            rows={1}
            placeholder="Ex: Validade sujeita a disponibilidade. Condições negociáveis."
            className="onb-input onb-textarea"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Step 4: Preferências (tema + menu) ─── */
function Step4Preferencias({
  form,
  setForm,
}: {
  form: OnboardingFormData
  setForm: React.Dispatch<React.SetStateAction<OnboardingFormData>>
}) {
  useEffect(() => {
    setThemePreference(form.temaPreferencia)
    setMenuLayout(form.menuLayout)
  }, [form.temaPreferencia, form.menuLayout])

  const handleTema = (tema: 'light' | 'dark') => {
    setForm((p) => ({ ...p, temaPreferencia: tema }))
    setThemePreference(tema)
  }

  const handleMenu = (layout: 'sidebar' | 'header') => {
    setForm((p) => ({ ...p, menuLayout: layout }))
    setMenuLayout(layout)
  }

  return (
    <div className="onb-step-inner">
      <div className="onb-step-header">
        <span className="onb-step-icon">
          <Settings className="h-8 w-8" />
        </span>
        <h2 className="onb-step-title">Preferências de interface</h2>
        <p className="onb-step-desc">
          Escolha o tema e a posição do menu. Veja o CRM ao fundo para comparar.
        </p>
      </div>
      <div className="onb-prefs-grid">
        <div className="onb-prefs-card">
          <label className="onb-label">Tema</label>
          <div className="onb-prefs-options">
            <button
              type="button"
              onClick={() => handleTema('dark')}
              className={`onb-prefs-btn ${form.temaPreferencia === 'dark' ? 'selected' : ''}`}
            >
              <Moon className="h-5 w-5" />
              <span>Escuro</span>
            </button>
            <button
              type="button"
              onClick={() => handleTema('light')}
              className={`onb-prefs-btn ${form.temaPreferencia === 'light' ? 'selected' : ''}`}
            >
              <Sun className="h-5 w-5" />
              <span>Claro</span>
            </button>
          </div>
        </div>
        <div className="onb-prefs-card">
          <label className="onb-label">Posição do menu</label>
          <div className="onb-prefs-options">
            <button
              type="button"
              onClick={() => handleMenu('sidebar')}
              className={`onb-prefs-btn ${form.menuLayout === 'sidebar' ? 'selected' : ''}`}
            >
              <PanelLeft className="h-5 w-5" />
              <span>Lateral</span>
            </button>
            <button
              type="button"
              onClick={() => handleMenu('header')}
              className={`onb-prefs-btn ${form.menuLayout === 'header' ? 'selected' : ''}`}
            >
              <Menu className="h-5 w-5" />
              <span>Topo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
