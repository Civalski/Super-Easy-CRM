'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Wrench,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Search,
  X,
  FilterX,
  MoreVertical,
} from '@/lib/icons'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import { SideCreateDrawer } from '@/components/common'
import { formatCurrency } from '@/lib/format'

interface ProdutoServico {
  id: string
  codigo: string | null
  nome: string
  categoria: string | null
  marca: string | null
  codigoBarras: string | null
  tipo: 'produto' | 'servico'
  unidade: string
  descricao: string | null
  observacoesInternas: string | null
  precoPadrao: number
  custoPadrao: number
  controlaEstoque: boolean
  estoqueAtual: number
  estoqueMinimo: number
  tempoPadraoMinutos: number | null
  garantiaDias: number | null
  prazoEntregaDias: number | null
  ativo: boolean
}

interface FormState {
  nome: string
  categoria: string
  marca: string
  codigoBarras: string
  tipo: 'produto' | 'servico'
  unidade: string
  descricao: string
  observacoesInternas: string
  precoPadrao: string
  custoPadrao: string
  margemLucroPercentual: string
  controlaEstoque: boolean
  estoqueAtual: string
  estoqueMinimo: string
  tempoPadraoMinutos: string
  garantiaDias: string
  prazoEntregaDias: string
  prazoEntregaUnidade: 'dias' | 'horas' | 'mes'
  ativo: boolean
}

interface FilterState {
  busca: string
  tipo: 'todos' | 'produto' | 'servico'
  status: 'todos' | 'ativos' | 'inativos'
  categoria: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

interface ProdutoStats {
  total: number
  ativos: number
  produtos: number
  servicos: number
  estoqueBaixo: number
}

const PRODUTOS_PAGE_SIZE = 20

const UNIT_OPTIONS = ['UN', 'CX', 'KG', 'M', 'M2', 'M3', 'L', 'HORA', 'DIARIA', 'MES']

const parseLocaleNumber = (value: string) => {
  const raw = value.trim().replace(/\s/g, '')
  if (!raw) return null

  let normalized = raw
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }

  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : null
}

const parseMoney = (value: string) => {
  const numeric = parseLocaleNumber(value)
  if (numeric === null) return value.trim() ? null : 0
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null
}

const parseOptionalNumber = (value: string) => {
  return parseLocaleNumber(value)
}

const formatInputNumber = (value: number) => {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

const formatMoneyInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const cents = Number(digits)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatMoneyValue = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const calculateMarginPercent = (custo: number, preco: number) => {
  if (custo <= 0) return 0
  return ((preco - custo) / custo) * 100
}

const convertPrazoToDias = (valor: number, unidade: FormState['prazoEntregaUnidade']) => {
  if (unidade === 'horas') return Math.ceil(valor / 24)
  if (unidade === 'mes') return valor * 30
  return valor
}

const buildDefaultForm = (): FormState => ({
  nome: '',
  categoria: '',
  marca: '',
  codigoBarras: '',
  tipo: 'produto',
  unidade: 'UN',
  descricao: '',
  observacoesInternas: '',
  precoPadrao: '',
  custoPadrao: '',
  margemLucroPercentual: '',
  controlaEstoque: true,
  estoqueAtual: '',
  estoqueMinimo: '',
  tempoPadraoMinutos: '',
  garantiaDias: '',
  prazoEntregaDias: '',
  prazoEntregaUnidade: 'dias',
  ativo: true,
})

export default function ProdutosPage() {
  const { confirm } = useConfirm()
  const [items, setItems] = useState<ProdutoServico[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PRODUTOS_PAGE_SIZE,
    pages: 1,
  })
  const [stats, setStats] = useState<ProdutoStats>({
    total: 0,
    ativos: 0,
    produtos: 0,
    servicos: 0,
    estoqueBaixo: 0,
  })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [codigoPreview, setCodigoPreview] = useState('')
  const [loadingCodigoPreview, setLoadingCodigoPreview] = useState(false)
  const [form, setForm] = useState<FormState>(buildDefaultForm)
  const [filters, setFilters] = useState<FilterState>({
    busca: '',
    tipo: 'todos',
    status: 'todos',
    categoria: '',
  })
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    busca: '',
    tipo: 'todos',
    status: 'todos',
    categoria: '',
  })
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const filtrosKey = `${appliedFilters.busca}|${appliedFilters.tipo}|${appliedFilters.status}|${appliedFilters.categoria}`
  const lastFiltrosKeyRef = useRef(filtrosKey)

  const fetchItems = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        paginated: 'true',
        page: String(targetPage),
        limit: String(PRODUTOS_PAGE_SIZE),
      })

      if (appliedFilters.busca.trim()) {
        params.set('busca', appliedFilters.busca.trim())
      }
      if (appliedFilters.tipo !== 'todos') {
        params.set('tipo', appliedFilters.tipo)
      }
      if (appliedFilters.status === 'ativos') {
        params.set('ativo', 'true')
      } else if (appliedFilters.status === 'inativos') {
        params.set('ativo', 'false')
      }
      if (appliedFilters.categoria.trim()) {
        params.set('categoria', appliedFilters.categoria.trim())
      }

      const res = await fetch(`/api/produtos-servicos?${params.toString()}`)
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error || 'Erro ao carregar produtos')
      }

      const nextItems = Array.isArray(payload?.data) ? payload.data : []
      const nextMeta: PaginationMeta = {
        total: Number(payload?.meta?.total || 0),
        page: Number(payload?.meta?.page || targetPage),
        limit: Number(payload?.meta?.limit || PRODUTOS_PAGE_SIZE),
        pages: Number(payload?.meta?.pages || 1),
      }

      if (nextItems.length === 0 && targetPage > 1 && nextMeta.total > 0) {
        setPage((prev) => Math.max(1, prev - 1))
        return
      }

      setItems(nextItems)
      setMeta(nextMeta)
      setStats({
        total: Number(payload?.stats?.total || 0),
        ativos: Number(payload?.stats?.ativos || 0),
        produtos: Number(payload?.stats?.produtos || 0),
        servicos: Number(payload?.stats?.servicos || 0),
        estoqueBaixo: Number(payload?.stats?.estoqueBaixo || 0),
      })
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setItems([])
      setMeta((prev) => ({ ...prev, total: 0, page: targetPage, pages: 1 }))
      setStats({
        total: 0,
        ativos: 0,
        produtos: 0,
        servicos: 0,
        estoqueBaixo: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  const fetchNextCode = useCallback(async () => {
    try {
      setLoadingCodigoPreview(true)
      const response = await fetch('/api/produtos-servicos?proximoCodigo=true')
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao gerar codigo')
      setCodigoPreview(typeof data?.codigo === 'string' ? data.codigo : '')
    } catch (error) {
      console.error('Erro ao carregar proximo codigo:', error)
      setCodigoPreview('')
    } finally {
      setLoadingCodigoPreview(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedFilters((prev) => {
        if (
          prev.busca === filters.busca &&
          prev.tipo === filters.tipo &&
          prev.status === filters.status &&
          prev.categoria === filters.categoria
        ) {
          return prev
        }
        return filters
      })
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [filters])

  useEffect(() => {
    if (lastFiltrosKeyRef.current !== filtrosKey) {
      lastFiltrosKeyRef.current = filtrosKey
      if (page !== 1) {
        setPage(1)
        return
      }
    }

    fetchItems(page)
  }, [fetchItems, filtrosKey, page])

  useEffect(() => {
    if (!showForm || editingId) return
    fetchNextCode()
  }, [showForm, editingId, fetchNextCode])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = () => setOpenMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

  const categories = useMemo(() => {
    const uniq = new Set(
      items
        .map((item) => item.categoria?.trim())
        .filter((value): value is string => Boolean(value))
    )
    return Array.from(uniq).sort((a, b) => a.localeCompare(b))
  }, [items])

  const filteredItems = items

  const resetForm = (close = false) => {
    setEditingId(null)
    setEditingCode(null)
    setCodigoPreview('')
    setForm(buildDefaultForm())
    if (close) setShowForm(false)
  }

  const handleTypeChange = (tipo: 'produto' | 'servico') => {
    setForm((prev) => {
      const unidadePadrao = tipo === 'servico' ? 'HORA' : 'UN'
      const unidadeAtualValida = UNIT_OPTIONS.includes(prev.unidade)

      return {
        ...prev,
        tipo,
        unidade: unidadeAtualValida ? prev.unidade : unidadePadrao,
        controlaEstoque:
          tipo === 'servico' ? false : prev.tipo === 'servico' ? true : prev.controlaEstoque,
        estoqueAtual: tipo === 'servico' ? '' : prev.estoqueAtual,
        estoqueMinimo: tipo === 'servico' ? '' : prev.estoqueMinimo,
        tempoPadraoMinutos: tipo === 'servico' ? prev.tempoPadraoMinutos : '',
      }
    })
  }

  const handleCustoPadraoChange = (value: string) => {
    setForm((prev) => {
      const custoFormatado = formatMoneyInput(value)
      const next = { ...prev, custoPadrao: custoFormatado }
      const custo = parseOptionalNumber(custoFormatado)
      const preco = parseOptionalNumber(prev.precoPadrao)

      if (preco !== null && custo !== null && custo > 0) {
        next.margemLucroPercentual = formatInputNumber(calculateMarginPercent(custo, preco))
      } else if (prev.precoPadrao.trim()) {
        next.margemLucroPercentual = ''
      }

      return next
    })
  }

  const handlePrecoPadraoChange = (value: string) => {
    setForm((prev) => {
      const precoFormatado = formatMoneyInput(value)
      const next = { ...prev, precoPadrao: precoFormatado }
      const custo = parseOptionalNumber(prev.custoPadrao)
      const preco = parseOptionalNumber(precoFormatado)

      if (preco !== null && custo !== null && custo > 0) {
        next.margemLucroPercentual = formatInputNumber(calculateMarginPercent(custo, preco))
      } else if (!precoFormatado.trim()) {
        next.margemLucroPercentual = ''
      }

      return next
    })
  }

  const handleMargemLucroChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, margemLucroPercentual: value }
      const custo = parseOptionalNumber(prev.custoPadrao)
      const margem = parseOptionalNumber(value)

      if (custo !== null && margem !== null) {
        next.precoPadrao = formatMoneyValue(custo * (1 + margem / 100))
      }

      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.nome.trim()) {
      toast.warning('Nome obrigatorio')
      return
    }

    const precoPadrao = parseMoney(form.precoPadrao)
    const custoPadrao = parseMoney(form.custoPadrao)
    const estoqueAtual = parseMoney(form.estoqueAtual)
    const estoqueMinimo = parseMoney(form.estoqueMinimo)
    const tempoPadraoMinutos =
      form.tipo === 'servico' && form.tempoPadraoMinutos.trim()
        ? Number(form.tempoPadraoMinutos)
        : null
    const garantiaDias = form.garantiaDias.trim() ? Number(form.garantiaDias) : null
    const prazoEntregaValor = form.prazoEntregaDias.trim() ? Number(form.prazoEntregaDias) : null
    const prazoEntregaDias =
      prazoEntregaValor === null
        ? null
        : convertPrazoToDias(prazoEntregaValor, form.prazoEntregaUnidade)

    if (precoPadrao === null) {
      toast.warning('Preco padrao invalido')
      return
    }

    if (custoPadrao === null) {
      toast.warning('Custo padrao invalido')
      return
    }

    if (form.tipo === 'produto' && form.controlaEstoque) {
      if (estoqueAtual === null || estoqueMinimo === null) {
        toast.warning('Estoque invalido')
        return
      }
    }

    if (
      tempoPadraoMinutos !== null &&
      (!Number.isInteger(tempoPadraoMinutos) || tempoPadraoMinutos < 0)
    ) {
      toast.warning('Tempo padrao invalido')
      return
    }

    if (garantiaDias !== null && (!Number.isInteger(garantiaDias) || garantiaDias < 0)) {
      toast.warning('Garantia invalida')
      return
    }

    if (
      prazoEntregaValor !== null &&
      (!Number.isInteger(prazoEntregaValor) || prazoEntregaValor < 0)
    ) {
      toast.warning('Prazo de entrega invalido')
      return
    }

    try {
      setSaving(true)

      const payload = {
        ...(editingId ? { id: editingId } : {}),
        nome: form.nome.trim(),
        categoria: form.categoria,
        marca: form.marca,
        codigoBarras: form.codigoBarras,
        tipo: form.tipo,
        unidade: form.unidade,
        descricao: form.descricao,
        observacoesInternas: form.observacoesInternas,
        precoPadrao,
        custoPadrao,
        controlaEstoque: form.tipo === 'servico' ? false : form.controlaEstoque,
        estoqueAtual:
          form.tipo === 'produto' && form.controlaEstoque ? (estoqueAtual ?? 0) : 0,
        estoqueMinimo:
          form.tipo === 'produto' && form.controlaEstoque ? (estoqueMinimo ?? 0) : 0,
        tempoPadraoMinutos: form.tipo === 'servico' ? tempoPadraoMinutos : null,
        garantiaDias,
        prazoEntregaDias,
        ativo: form.ativo,
      }

      const response = await fetch('/api/produtos-servicos', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao salvar produto')
      }

      if (editingId) {
        await fetchItems(page)
      } else {
        setPage(1)
        await fetchItems(1)
      }
      resetForm(true)
    } catch (error: unknown) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao salvar produto.' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: ProdutoServico) => {
    const margemLucroPercentual =
      item.custoPadrao > 0
        ? formatInputNumber(calculateMarginPercent(item.custoPadrao, item.precoPadrao))
        : ''

    setShowForm(true)
    setEditingId(item.id)
    setEditingCode(item.codigo)
    setCodigoPreview('')
    setForm({
      nome: item.nome,
      categoria: item.categoria || '',
      marca: item.marca || '',
      codigoBarras: item.codigoBarras || '',
      tipo: item.tipo,
      unidade: item.unidade || (item.tipo === 'servico' ? 'HORA' : 'UN'),
      descricao: item.descricao || '',
      observacoesInternas: item.observacoesInternas || '',
      precoPadrao: formatMoneyValue(item.precoPadrao ?? 0),
      custoPadrao: formatMoneyValue(item.custoPadrao ?? 0),
      margemLucroPercentual,
      controlaEstoque: Boolean(item.controlaEstoque),
      estoqueAtual: String(item.estoqueAtual ?? 0),
      estoqueMinimo: String(item.estoqueMinimo ?? 0),
      tempoPadraoMinutos: item.tempoPadraoMinutos == null ? '' : String(item.tempoPadraoMinutos),
      garantiaDias: item.garantiaDias == null ? '' : String(item.garantiaDias),
      prazoEntregaDias: item.prazoEntregaDias == null ? '' : String(item.prazoEntregaDias),
      prazoEntregaUnidade: 'dias',
      ativo: item.ativo,
    })
  }

  const handleToggleAtivo = async (item: ProdutoServico) => {
    try {
      const response = await fetch('/api/produtos-servicos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ativo: !item.ativo }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao atualizar')
      await fetchItems(page)
    } catch (error: unknown) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Nao foi possivel atualizar o item.' })
    }
  }

  const handleDelete = async (item: ProdutoServico) => {
    const ok = await confirm({
      title: 'Excluir item?',
      description: `Deseja excluir "${item.nome}"?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })

    if (!ok) return

    try {
      const response = await fetch(`/api/produtos-servicos?id=${item.id}`, {
        method: 'DELETE',
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao excluir')
      await fetchItems(page)
      if (editingId === item.id) resetForm(true)
    } catch (error: unknown) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao excluir item.' })
    }
  }

  const showLucroField = true
  const lucroPercentualAtual = parseOptionalNumber(form.margemLucroPercentual)
  const lucroInputClass =
    lucroPercentualAtual == null
      ? 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-100'
      : lucroPercentualAtual > 0
        ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300'
        : lucroPercentualAtual < 0
          ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-300'
          : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-100'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 p-2.5 shadow-lg shadow-cyan-500/25">
          <Box className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produtos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cadastro unico de produtos e servicos para pedidos
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null)
            setEditingCode(null)
            setCodigoPreview('')
            setForm(buildDefaultForm())
            setShowForm(true)
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800"
        >
          <Plus className="h-4 w-4" />
          Novo produto/servico
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} valueClass="text-gray-900 dark:text-white" />
        <StatCard label="Ativos" value={stats.ativos} valueClass="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Produtos" value={stats.produtos} valueClass="text-cyan-600 dark:text-cyan-400" />
        <StatCard label="Servicos" value={stats.servicos} valueClass="text-indigo-600 dark:text-indigo-400" />
        <StatCard label="Estoque baixo" value={stats.estoqueBaixo} valueClass="text-amber-600 dark:text-amber-400" />
      </div>

      {showForm && (
      <SideCreateDrawer
        open={showForm}
        onClose={() => resetForm(true)}
        maxWidthClass="max-w-3xl"
      >
        <div className="h-full overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar produto/servico' : 'Novo produto/servico'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Preencha os dados para cadastrar no catalogo
              </p>
            </div>
            <button
              type="button"
              onClick={() => resetForm(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-3.5 w-3.5" />
              Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-4">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Identificacao
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
              <div className="inline-flex items-center rounded-lg border border-dashed border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700 xl:col-span-4 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                {editingId
                  ? `Codigo: ${editingCode || 'Nao definido'}`
                  : loadingCodigoPreview
                    ? 'Gerando proximo codigo...'
                    : `Proximo codigo: ${codigoPreview || '-'}`}
              </div>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-4 dark:border-gray-600 dark:bg-gray-800"
                required
              />
              <select
                value={form.tipo}
                onChange={(e) => handleTypeChange(e.target.value as 'produto' | 'servico')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-2 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="produto">Produto</option>
                <option value="servico">Servico (como produto)</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 xl:col-span-2 dark:border-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((prev) => ({ ...prev, ativo: e.target.checked }))}
                  className="h-4 w-4 rounded-sm border-gray-300 text-cyan-600"
                />
                Ativo
              </label>

              <input
                type="text"
                value={form.categoria}
                onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                placeholder="Categoria"
                list="produto-categorias"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-3 dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
                placeholder="Marca"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-3 dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="text"
                value={form.codigoBarras}
                onChange={(e) => setForm((prev) => ({ ...prev, codigoBarras: e.target.value }))}
                placeholder="Codigo de barras"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-4 dark:border-gray-600 dark:bg-gray-800"
              />
              <select
                value={form.unidade}
                onChange={(e) => setForm((prev) => ({ ...prev, unidade: e.target.value }))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-2 dark:border-gray-600 dark:bg-gray-800"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <textarea
                value={form.descricao}
                onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descricao"
                rows={2}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-12 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Comercial
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
              <input
                type="text"
                value={form.custoPadrao}
                onChange={(e) => handleCustoPadraoChange(e.target.value)}
                placeholder="Valor comprado"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-3 dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="text"
                value={form.precoPadrao}
                onChange={(e) => handlePrecoPadraoChange(e.target.value)}
                placeholder="Valor a ser vendido"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-3 dark:border-gray-600 dark:bg-gray-800"
              />
              {showLucroField && (
                <div className="xl:col-span-2">
                  <input
                    type="text"
                    value={form.margemLucroPercentual}
                    onChange={(e) => handleMargemLucroChange(e.target.value)}
                    placeholder="Lucro %"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-gray-800 ${lucroInputClass}`}
                  />
                </div>
              )}
              <input
                type="number"
                min={0}
                step={1}
                value={form.garantiaDias}
                onChange={(e) => setForm((prev) => ({ ...prev, garantiaDias: e.target.value }))}
                placeholder="Garantia (dias)"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-3 dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="number"
                min={0}
                step={1}
                value={form.prazoEntregaDias}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, prazoEntregaDias: e.target.value }))
                }
                placeholder="Prazo de entrega"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-1 dark:border-gray-600 dark:bg-gray-800"
              />
              <select
                value={form.prazoEntregaUnidade}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    prazoEntregaUnidade: e.target.value as FormState['prazoEntregaUnidade'],
                  }))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-2 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="dias">Dias</option>
                <option value="horas">Horas</option>
                <option value="mes">Mes</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Operacional
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
              {form.tipo === 'produto' && (
                <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 xl:col-span-4 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.controlaEstoque}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, controlaEstoque: e.target.checked }))
                    }
                    className="h-4 w-4 rounded-sm border-gray-300 text-cyan-600"
                  />
                  Controla estoque
                </label>
              )}
              {form.tipo === 'produto' && form.controlaEstoque && (
                <>
                  <input
                    type="text"
                    value={form.estoqueAtual}
                    onChange={(e) => setForm((prev) => ({ ...prev, estoqueAtual: e.target.value }))}
                    placeholder="Estoque atual"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-4 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <input
                    type="text"
                    value={form.estoqueMinimo}
                    onChange={(e) => setForm((prev) => ({ ...prev, estoqueMinimo: e.target.value }))}
                    placeholder="Estoque minimo"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-4 dark:border-gray-600 dark:bg-gray-800"
                  />
                </>
              )}
              {form.tipo === 'servico' && (
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.tempoPadraoMinutos}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, tempoPadraoMinutos: e.target.value }))
                  }
                  placeholder="Tempo padrao (min)"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-4 dark:border-gray-600 dark:bg-gray-800"
                />
              )}
              <textarea
                value={form.observacoesInternas}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, observacoesInternas: e.target.value }))
                }
                placeholder="Observacoes internas"
                rows={2}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm xl:col-span-12 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>

          <datalist id="produto-categorias">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-36 items-center justify-center gap-1 rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
          </form>
        </div>
      </SideCreateDrawer>
      )}

      <div className="crm-card p-5">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.busca}
              onChange={(e) => setFilters((prev) => ({ ...prev, busca: e.target.value }))}
              placeholder="Buscar por nome, codigo, marca ou descricao"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <select
            value={filters.tipo}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, tipo: e.target.value as FilterState['tipo'] }))
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="todos">Todos os tipos</option>
            <option value="produto">Produtos</option>
            <option value="servico">Servicos</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value as FilterState['status'] }))
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <input
            type="text"
            value={filters.categoria}
            onChange={(e) => setFilters((prev) => ({ ...prev, categoria: e.target.value }))}
            placeholder="Filtrar categoria"
            list="produto-categorias"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm md:col-span-3 dark:border-gray-600 dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={() =>
              setFilters({
                busca: '',
                tipo: 'todos',
                status: 'todos',
                categoria: '',
              })
            }
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 md:col-span-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FilterX className="h-3.5 w-3.5" />
            Limpar
          </button>
        </div>

        {loading && (
          <div className="flex min-h-[140px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>
        )}

        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredItems.map((item) => {
              const margem = item.precoPadrao - (item.custoPadrao || 0)
              const margemPerc = item.custoPadrao > 0 ? (margem / item.custoPadrao) * 100 : 0

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.tipo === 'produto' ? (
                        <Box className="h-4 w-4 text-cyan-500" />
                      ) : (
                        <Wrench className="h-4 w-4 text-indigo-500" />
                      )}
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.nome}
                      </p>
                      {item.codigo && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {item.codigo}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.ativo
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.tipo === 'servico' ? 'Servico' : 'Produto'} | Unidade: {item.unidade}
                      {item.categoria ? ` | Categoria: ${item.categoria}` : ''}
                      {item.marca ? ` | Marca: ${item.marca}` : ''}
                    </p>
                    {item.codigoBarras && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Codigo de barras: {item.codigoBarras}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Valor vendido: {formatCurrency(item.precoPadrao)} | Valor comprado: {formatCurrency(item.custoPadrao || 0)}
                      {item.precoPadrao > 0 && (
                        <>
                          {' '}
                          | Margem: {formatCurrency(margem)} ({margemPerc.toFixed(1)}%)
                        </>
                      )}
                    </p>
                    {(item.garantiaDias != null || item.prazoEntregaDias != null) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.garantiaDias != null ? `Garantia: ${item.garantiaDias} dias` : ''}
                        {item.garantiaDias != null && item.prazoEntregaDias != null ? ' | ' : ''}
                        {item.prazoEntregaDias != null ? `Prazo: ${item.prazoEntregaDias} dias` : ''}
                      </p>
                    )}
                    {item.tipo === 'produto' && item.controlaEstoque && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Estoque: {item.estoqueAtual} | Minimo: {item.estoqueMinimo}
                      </p>
                    )}
                    {item.tipo === 'servico' && item.tempoPadraoMinutos != null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tempo padrao: {item.tempoPadraoMinutos} min
                      </p>
                    )}
                    {item.descricao && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.descricao}</p>
                    )}
                    {item.observacoesInternas && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Obs: {item.observacoesInternas}
                      </p>
                    )}
                  </div>

                  <div className="relative flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === item.id ? null : item.id)
                      }}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Acoes"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === item.id && (
                      <div
                        className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleEdit(item)
                            setOpenMenuId(null)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleAtivo(item)
                            setOpenMenuId(null)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          {item.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDelete(item)
                            setOpenMenuId(null)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && meta.pages > 1 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="text-gray-600 dark:text-gray-300">
              Pagina {meta.page} de {meta.pages} ({meta.total} itens)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={meta.page >= meta.pages}
                onClick={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                Proxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string
  value: number
  valueClass: string
}) {
  return (
    <div className="crm-card p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
