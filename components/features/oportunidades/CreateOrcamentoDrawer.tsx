'use client'

import { useCallback, useEffect, useState } from 'react'
import { Save, X } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button, SideCreateDrawer } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { getProbabilityValueFromLevel, type ProbabilityLevel } from '@/lib/domain/probabilidade'
import { getTodayLocalISO } from '@/lib/date'
import type { OrcamentoFormData } from './types'
import { formatCurrencyInput, getProximaAcaoDate, parseCurrencyInput } from './utils'
import { useOrcamentoCarrinho } from './hooks/useOrcamentoCarrinho'
import CarrinhoDrawer from './CarrinhoDrawer'
import CreateOrcamentoMainForm from './CreateOrcamentoMainForm'

interface CreateOrcamentoDrawerProps {
  onClose: () => void
  onCreated: () => void
  initialPerson?: AsyncSelectOption | null
}

const today = () => getTodayLocalISO()

export default function CreateOrcamentoDrawer({ onClose, onCreated, initialPerson }: CreateOrcamentoDrawerProps) {
  const carrinho = useOrcamentoCarrinho()
  const { hasCartItems, totalCarrinho, itens, showCarrinhoDrawer, setShowCarrinhoDrawer } = carrinho

  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(initialPerson ?? null)
  const [nomeClienteAvulso, setNomeClienteAvulso] = useState('')
  const [statusInfo, setStatusInfo] = useState('')
  const [saving, setSaving] = useState(false)
  const [proximaAcaoNumero, setProximaAcaoNumero] = useState(15)
  const [proximaAcaoUnidade, setProximaAcaoUnidade] = useState<'dias' | 'semanas' | 'meses'>('dias')

  const [formData, setFormData] = useState<OrcamentoFormData>({
    titulo: '',
    descricao: '',
    valor: '',
    formaPagamento: '',
    parcelas: '',
    desconto: '',
    probabilidade: 'media',
    dataFechamento: today(),
    proximaAcaoEm: getProximaAcaoDate(15, 'dias'),
    canalProximaAcao: '',
    responsavelProximaAcao: '',
    lembreteProximaAcao: true,
  })

  useEffect(() => {
    setFormData((prev) => ({ ...prev, proximaAcaoEm: getProximaAcaoDate(proximaAcaoNumero, proximaAcaoUnidade) }))
  }, [proximaAcaoNumero, proximaAcaoUnidade])

  const handleChange = (field: keyof OrcamentoFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePersonChange = useCallback((option: AsyncSelectOption | null) => {
    setSelectedPerson(option)
    if (option) setNomeClienteAvulso('')
    if (option && option.tipo === 'prospecto') {
      setStatusInfo('Este lead sera convertido em cliente automaticamente.')
      return
    }
    setStatusInfo('')
  }, [])

  const handleNomeClienteAvulsoChange = useCallback((value: string) => {
    setNomeClienteAvulso(value)
    if (value.trim()) {
      setSelectedPerson(null)
      setStatusInfo('')
    }
  }, [])

  const resolveClienteId = useCallback(async (): Promise<string> => {
    if (selectedPerson) {
      if (selectedPerson.tipo !== 'prospecto') return selectedPerson.id

      const convRes = await fetch(`/api/prospectos/${selectedPerson.id}/converter`, { method: 'POST' })
      if (!convRes.ok) throw new Error('Falha ao converter prospecto')
      const convData = await convRes.json()
      const prospectClienteId = convData.clienteId ?? convData.id
      if (!prospectClienteId) throw new Error('Falha ao identificar cliente convertido')
      return prospectClienteId
    }

    const nome = nomeClienteAvulso.trim()
    if (!nome) throw new Error('Selecione um cliente ou informe um nome')

    const createClientRes = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const createClientData = await createClientRes.json().catch(() => null)
    if (!createClientRes.ok || !createClientData?.id) {
      throw new Error(createClientData?.error || 'Falha ao criar cliente avulso')
    }

    return createClientData.id as string
  }, [selectedPerson, nomeClienteAvulso])

  const handleSubmit = async () => {
    if (!selectedPerson && !nomeClienteAvulso.trim()) return
    setSaving(true)

    try {
      const clienteId = await resolveClienteId()
      const valor = hasCartItems ? totalCarrinho : (parseCurrencyInput(formData.valor) ?? 0)
      const body: Record<string, unknown> = {
        clienteId,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        valor,
        formaPagamento: formData.formaPagamento || null,
        parcelas: formData.parcelas ? Number(formData.parcelas) : null,
        desconto: parseCurrencyInput(formData.desconto) ?? 0,
        probabilidade: getProbabilityValueFromLevel(formData.probabilidade as ProbabilityLevel),
        dataFechamento: formData.dataFechamento || null,
        proximaAcaoEm: formData.proximaAcaoEm || null,
        canalProximaAcao: formData.canalProximaAcao || null,
        responsavelProximaAcao: formData.responsavelProximaAcao || null,
        lembreteProximaAcao: formData.lembreteProximaAcao,
        status: 'orcamento',
      }
      if (itens.length > 0) {
        body.itens = itens.map(({ produtoServicoId, descricao, quantidade, precoUnitario, desconto }) => ({
          produtoServicoId,
          descricao,
          quantidade,
          precoUnitario,
          desconto,
        }))
      }

      const res = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Falha ao criar orcamento')

      toast.success('Orcamento criado!')
      onCreated()
    } catch (err: unknown) {
      toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao criar orcamento' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Orcamento</h2>
          <button type="button" onClick={onClose} className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <CreateOrcamentoMainForm
          selectedPerson={selectedPerson}
          nomeClienteAvulso={nomeClienteAvulso}
          statusInfo={statusInfo}
          formData={formData}
          hasCartItems={hasCartItems}
          totalCarrinho={totalCarrinho}
          itensLength={itens.length}
          proximaAcaoNumero={proximaAcaoNumero}
          proximaAcaoUnidade={proximaAcaoUnidade}
          onPersonChange={handlePersonChange}
          onNomeClienteAvulsoChange={handleNomeClienteAvulsoChange}
          onChange={handleChange}
          onCurrencyChange={(raw) => handleChange('valor', formatCurrencyInput(raw))}
          onDiscountCurrencyChange={(raw) => handleChange('desconto', formatCurrencyInput(raw))}
          onProximaAcaoNumeroChange={setProximaAcaoNumero}
          onProximaAcaoUnidadeChange={setProximaAcaoUnidade}
        />

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <Button variant="outline" size="sm" onClick={() => setShowCarrinhoDrawer(true)}>
            Carrinho {hasCartItems && `(${itens.length})`}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || (!selectedPerson && !nomeClienteAvulso.trim())}>
            <Save size={14} className="mr-1.5" />
            {saving ? 'Salvando...' : 'Criar Orcamento'}
          </Button>
        </div>
      </div>

      <CarrinhoDrawer
        open={showCarrinhoDrawer}
        onClose={() => setShowCarrinhoDrawer(false)}
        itens={carrinho.itens}
        itemForm={carrinho.itemForm}
        selectedProdutoLabel={carrinho.selectedProdutoLabel}
        cartSummary={carrinho.cartSummary}
        totalCarrinho={carrinho.totalCarrinho}
        draftSubtotal={carrinho.draftSubtotal}
        onItemForm={carrinho.handleItemForm}
        onSelectProduto={carrinho.handleSelectProduto}
        onAddDraftItem={carrinho.handleAddDraftItem}
        onRemoveDraftItem={carrinho.handleRemoveDraftItem}
        onDraftItemField={carrinho.handleDraftItemField}
        onStepQuantity={carrinho.handleStepQuantity}
        footer={<Button size="sm" onClick={() => setShowCarrinhoDrawer(false)}>Concluir carrinho</Button>}
      />
    </SideCreateDrawer>
  )
}
