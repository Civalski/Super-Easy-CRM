/**
 * Configurações do PDF de orçamento (empresa, logo, vendedor, cores, validade, rodapé)
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Save, Loader2, Upload, X } from 'lucide-react'

interface PdfConfig {
  nomeEmpresa?: string
  nomeVendedor?: string
  telefone?: string
  email?: string
  site?: string
  rodape?: string
  corPrimaria?: string
  validadeDias?: number | string
  logoBase64?: string
  logoPosicao?: 'topo' | 'rodape'
}

const DEFAULT_COLOR = '#122d8c'
const LOGO_LIMIT_KB = 450

export function OrcamentoPdfConfigCard() {
  const [config, setConfig] = useState<PdfConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/configuracoes/pdf')
      .then((r) => r.json())
      .then((data) => { setConfig(data ?? {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const payload = {
        ...config,
        validadeDias: config.validadeDias ? Number(config.validadeDias) : null,
        logoPosicao: config.logoPosicao || 'topo',
      }
      const res = await fetch('/api/configuracoes/pdf', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof PdfConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setConfig((prev) => ({ ...prev, [field]: e.target.value }))

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
      setConfig((prev) => ({ ...prev, logoBase64: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setConfig((prev) => ({ ...prev, logoBase64: '' }))
    setLogoError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) {
    return (
      <div className="crm-card p-3 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando configurações do PDF…
      </div>
    )
  }

  return (
    <div className="crm-card p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">PDF de orçamento</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Identidade visual e dados exibidos nos orçamentos em PDF</p>
        </div>
      </div>

      {/* Logo + Cor */}
      <div className="flex flex-wrap gap-4 mb-3">
        {/* Logo upload */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Logo da empresa</label>
          {config.logoBase64 ? (
            <div className="relative group inline-flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.logoBase64}
                alt="Logo"
                className="h-16 max-w-[140px] object-contain rounded border border-gray-200 dark:border-gray-600 bg-white p-1"
              />
              <button
                onClick={removeLogo}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                title="Remover logo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-[140px] h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800">
              <Upload className="h-5 w-5 text-gray-400 mb-0.5" />
              <span className="text-xs text-gray-500">PNG ou JPG · max {LOGO_LIMIT_KB}KB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
          {logoError && <p className="text-xs text-red-500 max-w-[160px]">{logoError}</p>}
        </div>

        {/* Cor principal */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Cor principal</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.corPrimaria || DEFAULT_COLOR}
              onChange={set('corPrimaria')}
              className="h-10 w-12 cursor-pointer rounded border border-gray-200 dark:border-gray-600 bg-transparent p-0.5"
              title="Selecionar cor"
            />
            <input
              type="text"
              value={config.corPrimaria || DEFAULT_COLOR}
              onChange={set('corPrimaria')}
              placeholder="#122d8c"
              className="crm-input w-24 text-xs font-mono"
              maxLength={7}
            />
          </div>
          <p className="text-xs text-gray-400">Usada no cabeçalho e tabelas</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Posição do logo</label>
          <select
            value={config.logoPosicao || 'topo'}
            onChange={(e) => setConfig((prev) => ({ ...prev, logoPosicao: e.target.value as 'topo' | 'rodape' }))}
            className="crm-input text-xs"
          >
            <option value="topo">Em cima (cabeçalho)</option>
            <option value="rodape">Em baixo (rodapé)</option>
          </select>
          <p className="text-xs text-gray-400">Define onde o logo será exibido no PDF</p>
        </div>
      </div>

      {/* Dados da empresa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <Field label="Nome da empresa" value={config.nomeEmpresa ?? ''} onChange={set('nomeEmpresa')} placeholder="Ex: Empresa S.A." />
        <Field label="Vendedor / Emitente" value={config.nomeVendedor ?? ''} onChange={set('nomeVendedor')} placeholder="Ex: João Silva" />
        <Field label="Telefone" value={config.telefone ?? ''} onChange={set('telefone')} placeholder="(11) 99999-9999" />
        <Field label="E-mail" value={config.email ?? ''} onChange={set('email')} placeholder="contato@empresa.com" />
        <Field label="Site" value={config.site ?? ''} onChange={set('site')} placeholder="www.empresa.com" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Validade padrão (dias)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={config.validadeDias ?? ''}
            onChange={set('validadeDias')}
            placeholder="Ex: 30"
            className="crm-input text-xs"
          />
          <p className="text-xs text-gray-400">Calculada a partir da data de emissão</p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Texto do rodapé</label>
        <textarea
          value={config.rodape ?? ''}
          onChange={set('rodape')}
          rows={2}
          placeholder="Ex: Validade sujeita a disponibilidade de estoque. Condições comerciais negociáveis."
          className="crm-input resize-none text-xs"
        />
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-2">
        {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Salvo com sucesso!</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="crm-input text-xs" />
    </div>
  )
}
