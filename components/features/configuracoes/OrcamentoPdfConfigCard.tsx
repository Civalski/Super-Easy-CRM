/**
 * Configurações do PDF de orçamento (empresa, logo, vendedor, cores, validade, rodapé)
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Save, Loader2, Upload, X } from '@/lib/icons'

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

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 transition-colors hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:hover:border-gray-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25'

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
      <div className="crm-card p-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        Carregando configurações do PDF…
      </div>
    )
  }

  return (
    <div className="crm-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200/80 px-4 py-3 dark:border-gray-700/60">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">PDF de orçamento</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Identidade visual e dados exibidos nos orçamentos</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Identidade visual */}
        <section>
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Identidade visual
          </h4>
          <div className="flex flex-wrap items-start gap-6">
            {/* Logo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Logo</label>
              {config.logoBase64 ? (
                <div className="relative group">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.logoBase64}
                      alt="Logo"
                      className="h-14 max-w-[120px] object-contain"
                    />
                  </div>
                  <button
                    onClick={removeLogo}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    title="Remover logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-[72px] w-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/50 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-[10px] text-gray-500">PNG/JPG · max {LOGO_LIMIT_KB}KB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
              {logoError && <p className="text-[11px] text-red-500">{logoError}</p>}
            </div>

            {/* Cor e posição */}
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Cor principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.corPrimaria || DEFAULT_COLOR}
                    onChange={set('corPrimaria')}
                    className="h-9 w-10 cursor-pointer rounded-md border border-gray-200 dark:border-gray-600 bg-transparent p-0.5"
                    title="Selecionar cor"
                  />
                  <input
                    type="text"
                    value={config.corPrimaria || DEFAULT_COLOR}
                    onChange={set('corPrimaria')}
                    placeholder="#122d8c"
                    className={`${INPUT_CLASS} h-9 w-24 font-mono text-xs`}
                    maxLength={7}
                  />
                </div>
                <span className="text-[11px] text-gray-400">Cabeçalho e tabelas</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Posição do logo</label>
                <select
                  value={config.logoPosicao || 'topo'}
                  onChange={(e) => setConfig((prev) => ({ ...prev, logoPosicao: e.target.value as 'topo' | 'rodape' }))}
                  className={`${INPUT_CLASS} h-9 min-w-[140px] text-xs`}
                >
                  <option value="topo">Cabeçalho</option>
                  <option value="rodape">Rodapé</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Dados da empresa */}
        <section>
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Dados da empresa
          </h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field label="Nome da empresa" value={config.nomeEmpresa ?? ''} onChange={set('nomeEmpresa')} placeholder="Ex: Empresa S.A." />
            <Field label="Vendedor / Emitente" value={config.nomeVendedor ?? ''} onChange={set('nomeVendedor')} placeholder="Ex: João Silva" />
            <Field label="Telefone" value={config.telefone ?? ''} onChange={set('telefone')} placeholder="(11) 99999-9999" />
            <Field label="E-mail" value={config.email ?? ''} onChange={set('email')} placeholder="contato@empresa.com" />
            <Field label="Site" value={config.site ?? ''} onChange={set('site')} placeholder="www.empresa.com" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Validade padrão (dias)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={config.validadeDias ?? ''}
                onChange={set('validadeDias')}
                placeholder="Ex: 30"
                className={`${INPUT_CLASS} h-9 text-xs`}
              />
              <span className="text-[11px] text-gray-400">A partir da emissão</span>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <section>
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Rodapé do PDF
          </h4>
          <textarea
            value={config.rodape ?? ''}
            onChange={set('rodape')}
            rows={2}
            placeholder="Ex: Validade sujeita a disponibilidade de estoque. Condições comerciais negociáveis."
            className={`${INPUT_CLASS} resize-none text-xs`}
          />
        </section>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200/80 pt-3 dark:border-gray-700/60">
          {saved && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Salvo com sucesso!</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${INPUT_CLASS} h-9 text-xs`}
      />
    </div>
  )
}
