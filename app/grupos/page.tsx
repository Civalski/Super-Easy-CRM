'use client'

import { useState, useEffect, useCallback } from 'react'
import { readExcelToObjects } from '@/lib/excel'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import { Loader2, ChevronLeft, ChevronRight, Layers, Eye, ChevronDown, X, User, Mail, Phone, Building2, MapPin, FileText, Calendar, Star, Hash, Briefcase, Tag, DollarSign, Scale, Target, MessageCircle, Upload, Plus, PhoneCall } from '@/lib/icons'
import { MotivoPerdaModal } from '@/components/features/oportunidades'
import { SideCreateDrawer } from '@/components/common'
import { formatCurrency } from '@/lib/format'

interface Oportunidade {
    id: string
    titulo: string
    valor: number | null
    status: string
    createdAt: string
    cliente: {
        nome: string
        email: string | null
        telefone: string | null
        empresa: string | null
        cnpj?: string | null
    }
    type?: 'prospecto' | 'oportunidade'
    subStatus?: string
}

interface Meta {
    total: number
    page: number
    limit: number
    pages: number
}

const TABS = [
    { label: 'Sem contato', value: 'sem_contato', icon: Target },
    { label: 'Contatado', value: 'contatado', icon: MessageCircle },
    { label: 'Em potencial', value: 'em_potencial', icon: Layers },
    { label: 'Orçamento', value: 'orcamento', icon: Briefcase },
]

const WHATSAPP_MESSAGES_STORAGE_KEY = 'grupos_whatsapp_messages_v1'
/** Limite para o link wa.me suportar o parâmetro text (URL segura) */
const MAX_WHATSAPP_MESSAGE_LENGTH = 1500
/** Mensagem padrão: usuário deve substituir o espaço entre aspas pela profissão */
const DEFAULT_WHATSAPP_MESSAGE = 'Olá, você trabalha com " "?'
/** Mensagem padrão antiga: migrar para a nova ao carregar */
const LEGACY_DEFAULT_MESSAGE = 'ola {nome} como vai?'

export default function GruposPage() {
    const { prompt } = useConfirm()
    const [activeTab, setActiveTab] = useState('sem_contato')
    const [page, setPage] = useState(1)
    const [data, setData] = useState<Oportunidade[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [motivoModalOpen, setMotivoModalOpen] = useState(false)
    const [motivoOportunidadeId, setMotivoOportunidadeId] = useState<string | null>(null)
    const [motivoItemType, setMotivoItemType] = useState<'prospecto' | 'oportunidade'>('oportunidade')
    const [motivoLoading, setMotivoLoading] = useState(false)

    // Detail modal state
    const [detailModal, setDetailModal] = useState<any | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [showMessageConfig, setShowMessageConfig] = useState(false)
    const [whatsAppMessages, setWhatsAppMessages] = useState<string[]>([DEFAULT_WHATSAPP_MESSAGE])
    const [draftWhatsAppMessages, setDraftWhatsAppMessages] = useState<string[]>([DEFAULT_WHATSAPP_MESSAGE])
    const [contatosIniciadosHoje, setContatosIniciadosHoje] = useState<number | null>(null)
    const [metaContatosHoje, setMetaContatosHoje] = useState<number | null>(null)

    const handleViewDetails = useCallback(async (item: Oportunidade) => {
        if (item.type === 'prospecto') {
            setDetailLoading(true)
            setDetailModal({ loading: true })
            try {
                const res = await fetch(`/api/prospectos/${item.id}`)
                if (res.ok) {
                    const prospecto = await res.json()
                    setDetailModal(prospecto)
                } else {
                    setDetailModal({
                        razaoSocial: item.cliente.nome,
                        email: item.cliente.email,
                        telefone: item.cliente.telefone,
                        nomeFantasia: item.cliente.empresa,
                        _fallback: true,
                    })
                }
            } catch {
                setDetailModal({
                    razaoSocial: item.cliente.nome,
                    email: item.cliente.email,
                    telefone: item.cliente.telefone,
                    nomeFantasia: item.cliente.empresa,
                    _fallback: true,
                })
            } finally {
                setDetailLoading(false)
            }
        } else {
            // Oportunidades: redirecionar para edição
            window.location.href = `/oportunidades/${item.id}/editar`
        }
    }, [])

    const fetchGrupos = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/grupos?status=${activeTab}&page=${page}&limit=10`)
            const result = await response.json()
            if (response.ok) {
                setData(result.data)
                setMeta(result.meta)
            } else {
                console.error('Erro ao buscar dados:', result)
            }
        } catch (error) {
            console.error('Erro na requisição:', error)
        } finally {
            setLoading(false)
        }
    }, [activeTab, page])

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/metas/contatos-diarios')
            if (res.ok) {
                const json = await res.json()
                setContatosIniciadosHoje(json.contatosHoje ?? 0)
                setMetaContatosHoje(json.metaDiaria ?? null)
            }
        } catch (error) {
            console.error('Erro ao buscar stats do funil:', error)
        }
    }, [])

    useEffect(() => {
        fetchGrupos()
    }, [fetchGrupos])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(WHATSAPP_MESSAGES_STORAGE_KEY)
            if (!raw) return

            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) return

            const normalized = parsed
                .filter((v: unknown) => typeof v === 'string')
                .map((v: string) => v.trim())
            const trimmed: string[] = []
            for (let i = 0; i < normalized.length; i++) {
                trimmed.push(normalized[i])
            }
            while (trimmed.length > 1 && trimmed[trimmed.length - 1] === '') {
                trimmed.pop()
            }
            if (trimmed.length === 0) trimmed.push(DEFAULT_WHATSAPP_MESSAGE)

            const isLegacyDefault = trimmed.length === 1 && trimmed[0].toLowerCase() === LEGACY_DEFAULT_MESSAGE.toLowerCase()
            if (isLegacyDefault) {
                const migrated = [DEFAULT_WHATSAPP_MESSAGE]
                setWhatsAppMessages(migrated)
                setDraftWhatsAppMessages(migrated)
                window.localStorage.setItem(WHATSAPP_MESSAGES_STORAGE_KEY, JSON.stringify(migrated))
                return
            }

            const hasContent = trimmed.some((m) => m.length > 0)
            if (hasContent) {
                setWhatsAppMessages(trimmed)
                setDraftWhatsAppMessages(trimmed)
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens de WhatsApp:', error)
        }
    }, [])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setPage(1) // Reset page on tab change
    }

    const handleImport = async (file: File) => {
        let loadingToastId: string | number | undefined = toast.loading('Lendo arquivo...')
        let importToastId: string | number | undefined

        try {
            const fileName = typeof file?.name === 'string' ? file.name : ''
            const lowerName = fileName.toLowerCase()
            if (!lowerName.endsWith('.xlsx')) {
                throw new Error('Formato nao suportado. Use apenas arquivo .xlsx')
            }

            console.info('[grupos/importacao] iniciando leitura de arquivo', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
            })

            const data = await file.arrayBuffer()
            const jsonData = await readExcelToObjects(data)

            if (jsonData.length === 0) {
                throw new Error('O arquivo esta vazio')
            }

            toast.dismiss(loadingToastId)

            const batchSize = await prompt({
                title: 'Dividir em Lotes',
                label: 'Defina quantos contatos frios devem ficar em cada lote',
                placeholder: '30',
                defaultValue: '30',
                confirmLabel: 'Importar',
                cancelLabel: 'Cancelar',
            })

            if (!batchSize) return

            const batchNum = Number.parseInt(batchSize, 10)
            if (!batchNum || batchNum <= 0) {
                toast.error('Valor invalido', { description: 'Informe um numero maior que 0' })
                return
            }

            importToastId = toast.loading(`Importando ${jsonData.length} registros...`)

            const response = await fetch('/api/prospectos/importar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresas: jsonData,
                    batchSize: batchNum,
                    fileName,
                }),
            })

            const result = await response.json()
            toast.dismiss(importToastId)

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao importar dados')
            }

            toast.success('Importacao concluida!', {
                description: `${result.importados ?? 0} novos, ${result.duplicados ?? 0} duplicados`,
            })

            if (activeTab === 'sem_contato' && page === 1) {
                await fetchGrupos()
            } else {
                setActiveTab('sem_contato')
                setPage(1)
            }
        } catch (err) {
            console.error('[grupos/importacao] falha ao importar', err)
            toast.dismiss(loadingToastId)
            toast.dismiss(importToastId)
            toast.error('Erro na importacao', { description: err instanceof Error ? err.message : 'Nao foi possivel processar o arquivo.' })
        }
    }

    const getRandomWhatsappMessage = (item: Oportunidade) => {
        const activeMessages = whatsAppMessages
            .map((message) => message.trim())
            .filter((message) => message.length > 0)

        if (activeMessages.length === 0) return ''

        const selected = activeMessages[Math.floor(Math.random() * activeMessages.length)]
        const nome = item.cliente.nome || ''
        const empresa = item.cliente.empresa || item.cliente.nome || ''
        const email = item.cliente.email || ''
        const telefone = item.cliente.telefone || ''
        const cnpj = item.cliente.cnpj || ''

        let result = selected
            .replace(/\{nome\}/gi, nome)
            .replace(/\{empresa\}/gi, empresa)
            .replace(/\{email\}/gi, email)
            .replace(/\{telefone\}/gi, telefone)
            .replace(/\{cnpj\}/gi, cnpj)

        if (result.length > MAX_WHATSAPP_MESSAGE_LENGTH) {
            result = result.slice(0, MAX_WHATSAPP_MESSAGE_LENGTH)
        }
        return result
    }

    const handleOpenMessageConfig = () => {
        setDraftWhatsAppMessages([...whatsAppMessages].length ? [...whatsAppMessages] : [''])
        setShowMessageConfig(true)
    }

    const handleCancelMessageConfig = () => {
        setDraftWhatsAppMessages([...whatsAppMessages])
        setShowMessageConfig(false)
    }

    const handleSaveMessageConfig = () => {
        const trimmed = draftWhatsAppMessages.map((m) => m.trim().slice(0, MAX_WHATSAPP_MESSAGE_LENGTH))
        let normalized = trimmed
        while (normalized.length > 1 && normalized[normalized.length - 1] === '') {
            normalized = normalized.slice(0, -1)
        }
        if (normalized.length === 0) normalized = ['']

        setWhatsAppMessages(normalized)
        setDraftWhatsAppMessages(normalized)

        const hasAnyMessage = normalized.some((message) => message.length > 0)
        if (hasAnyMessage) {
            window.localStorage.setItem(WHATSAPP_MESSAGES_STORAGE_KEY, JSON.stringify(normalized))
        } else {
            window.localStorage.removeItem(WHATSAPP_MESSAGES_STORAGE_KEY)
        }

        setShowMessageConfig(false)
    }

    const handleAddAnotherMessage = () => {
        setDraftWhatsAppMessages([...draftWhatsAppMessages, ''])
    }

    const handleRemoveDraftMessage = (index: number) => {
        if (draftWhatsAppMessages.length <= 1) return
        const next = draftWhatsAppMessages.filter((_, i) => i !== index)
        setDraftWhatsAppMessages(next)
    }

    const handleStartContact = async (item: Oportunidade) => {
        if (!item.cliente.telefone) return

        const message = getRandomWhatsappMessage(item)
        const profissaoEmBranco = /"\s+"/.test(message)

        if (profissaoEmBranco) {
            toast.warning('Personalize a mensagem', {
                description: 'A mensagem contém a profissão em branco (aspas vazias). Substitua o espaço entre aspas pela profissão do lead em Personalizar mensagem.',
            })
            setShowMessageConfig(true)
            return
        }

        const cleanPhone = item.cliente.telefone.replace(/\D/g, '')
        const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
        const messageQuery = message ? `?text=${encodeURIComponent(message)}` : ''
        window.open(`https://wa.me/${phoneWithCountry}${messageQuery}`, '_blank')

        if (activeTab !== 'sem_contato' || item.type !== 'prospecto') return

        setUpdatingId(item.id)
        try {
            const response = await fetch(`/api/prospectos/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'em_contato',
                    ultimoContato: new Date().toISOString(),
                }),
            })

            if (response.ok) {
                await fetchGrupos()
                await fetchStats()
            } else {
                alert('Erro ao iniciar contato')
            }
        } catch (error) {
            console.error('Erro ao iniciar contato:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const updateOportunidadeStatus = async (id: string, payload: Record<string, unknown>) => {
        setUpdatingId(id)
        try {
            const response = await fetch(`/api/oportunidades/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null)
                throw new Error(errorPayload?.error || 'Erro ao atualizar status')
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            throw error
        } finally {
            setUpdatingId(null)
        }
    }

    const handleStatusChange = async (item: Oportunidade, newStatus: string) => {
        if (newStatus === 'perdida') {
            setMotivoOportunidadeId(item.id)
            setMotivoItemType(item.type || 'oportunidade')
            setMotivoModalOpen(true)
            return
        }

        setUpdatingId(item.id)
        try {
            if (item.type === 'prospecto') {
                if (newStatus === 'em_potencial') {
                    const response = await fetch(`/api/prospectos/${item.id}/qualificar`, { method: 'POST' })
                    if (!response.ok) {
                        const errorPayload = await response.json().catch(() => null)
                        throw new Error(errorPayload?.error || 'Erro ao qualificar prospecto')
                    }
                } else if (['orcamento', 'fechada'].includes(newStatus)) {
                    const response = await fetch(`/api/prospectos/${item.id}/promover`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    })
                    if (!response.ok) {
                        const errorPayload = await response.json().catch(() => null)
                        throw new Error(errorPayload?.error || 'Erro ao promover prospecto')
                    }
                }
                await fetchGrupos()
            } else {
                await updateOportunidadeStatus(item.id, { status: newStatus })
                await fetchGrupos()
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            alert(error instanceof Error ? error.message : 'Erro ao atualizar status')
        } finally {
            setUpdatingId(null)
        }
    }

    const handleConfirmMotivo = async (motivo: string) => {
        if (!motivoOportunidadeId) return
        setMotivoLoading(true)

        try {
            if (motivoItemType === 'prospecto') {
                const response = await fetch(`/api/prospectos/${motivoOportunidadeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'descartado',
                        observacoes: `Motivo da perda: ${motivo}`
                    })
                })
                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => null)
                    throw new Error(errorPayload?.error || 'Erro ao atualizar prospecto')
                }
                await fetchGrupos()
            } else {
                await updateOportunidadeStatus(motivoOportunidadeId, {
                    status: 'perdida',
                    motivoPerda: motivo,
                })
                await fetchGrupos()
            }
        } catch (error) {
            console.error('Error updating status', error)
        } finally {
            setMotivoLoading(false)
            setMotivoModalOpen(false)
            setMotivoOportunidadeId(null)
        }
    }

    const handleCancelMotivo = () => {
        if (motivoLoading) return
        setMotivoModalOpen(false)
        setMotivoOportunidadeId(null)
    }

    const getAvailableActions = (currentStatus: string) => {
        const tabActions = TABS.filter((tab) => tab.value !== currentStatus).map((tab) => ({
            label: tab.label,
            value: tab.value,
        }))
        // Add final statuses (managed in Orçamentos page) as dropdown options
        const extraActions = [
            { label: 'Vendas', value: 'fechada' },
            { label: 'Perdida', value: 'perdida' },
        ].filter((a) => a.value !== currentStatus)
        return [...tabActions, ...extraActions]
    }

    const activeMessageCount = whatsAppMessages.filter((message) => message.trim().length > 0).length

    const handleDefinirMetaContatos = async () => {
        const value = await prompt({
            title: 'Meta de contatos hoje',
            label: 'Quantos contatos você deseja fazer hoje?',
            placeholder: '10',
            defaultValue: String(metaContatosHoje ?? 10),
            confirmLabel: 'Definir',
            cancelLabel: 'Cancelar',
        })
        if (!value) return
        const num = Number(value)
        if (!Number.isInteger(num) || num < 1) {
            toast.warning('Valor inválido', { description: 'Informe um número inteiro maior que zero.' })
            return
        }
        try {
            const res = await fetch('/api/metas/contatos-diarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'atualizar_meta', metaDiaria: num }),
            })
            if (res.ok) {
                setMetaContatosHoje(num)
                await fetchStats()
            } else {
                const err = await res.json().catch(() => ({}))
                toast.error('Erro', { description: err.error || 'Não foi possível salvar a meta.' })
            }
        } catch (error) {
            console.error('Erro ao definir meta:', error)
            toast.error('Erro', { description: 'Não foi possível salvar a meta.' })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-linear-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
                        <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Funil de Vendas
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gerencie contatos frios e oportunidades
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDefinirMetaContatos}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors cursor-pointer"
                        title={metaContatosHoje != null ? 'Alterar meta de contatos hoje' : 'Definir quantos contatos fazer hoje'}
                    >
                        <PhoneCall size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Contatos hoje:</span>
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            {contatosIniciadosHoje ?? '—'}
                            {metaContatosHoje != null ? ` / ${metaContatosHoje}` : ''}
                        </span>
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 shadow-xs hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-800">
                        <Upload size={16} />
                        Importar XLSX
                        <input
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) {
                                    void handleImport(file)
                                }
                                event.target.value = ''
                            }}
                        />
                    </label>
                    <button
                        onClick={handleOpenMessageConfig}
                        className="inline-flex items-center px-3 py-2 border border-purple-300 dark:border-purple-600 shadow-xs text-sm font-medium rounded-lg text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800"
                    >
                        Personalizar mensagem
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activeMessageCount === 0
                            ? 'Sem mensagem personalizada'
                            : activeMessageCount === 1
                                ? '1 mensagem ativa'
                                : `${activeMessageCount} mensagens ativas (aleatório)`}
                    </span>
                </div>
            </div>

            {showMessageConfig && (
                <SideCreateDrawer open onClose={handleCancelMessageConfig} maxWidthClass="max-w-lg">
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Personalizar mensagem WhatsApp
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    Use no &quot;Iniciar Contato&quot;. Máx. {MAX_WHATSAPP_MESSAGE_LENGTH} caracteres por mensagem (limite do link).
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancelMessageConfig}
                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                aria-label="Fechar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Dica: use {'{nome}'}, {'{empresa}'}, {'{email}'}, {'{telefone}'} e {'{cnpj}'} para personalizar.
                            </p>

                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Substitua o espaço entre aspas pela profissão do lead. Se deixar em branco, o sistema pedirá para alterar antes de iniciar contato.
                            </p>

                            {draftWhatsAppMessages.map((text, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                            Mensagem {index + 1}
                                        </label>
                                        {draftWhatsAppMessages.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDraftMessage(index)}
                                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                            >
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={text}
                                        maxLength={MAX_WHATSAPP_MESSAGE_LENGTH}
                                        onChange={(e) => {
                                            const next = [...draftWhatsAppMessages]
                                            next[index] = e.target.value
                                            setDraftWhatsAppMessages(next)
                                        }}
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Digite a mensagem para o WhatsApp..."
                                    />
                                    <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                                        {text.length} / {MAX_WHATSAPP_MESSAGE_LENGTH}
                                    </p>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddAnotherMessage}
                                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <Plus size={16} />
                                Acrescentar outra mensagem (enviar aleatoriamente)
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-4">
                            <button
                                type="button"
                                onClick={handleCancelMessageConfig}
                                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveMessageConfig}
                                className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800"
                            >
                                Salvar mensagens
                            </button>
                        </div>
                    </div>
                </SideCreateDrawer>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.value
                                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
              `}
                        >
                            <div className="flex items-center gap-2">
                                {tab.icon && <tab.icon size={18} />}
                                <span>{tab.label}</span>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 shadow-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={32} />
                            <p className="text-gray-600 dark:text-gray-400">Carregando leads...</p>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Nenhum lead encontrado neste grupo.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Cliente / Empresa
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Orçamento
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.cliente.nome}
                                                </span>
                                                {item.cliente.empresa && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.cliente.empresa}
                                                    </span>
                                                )}

                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{item.titulo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                                                {formatCurrency(item.valor)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(item)}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-xs text-xs font-medium rounded-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                >
                                                    <Eye className="w-3 h-3 mr-1.5" />
                                                    Ver mais
                                                </button>
                                                {item.type === 'prospecto' && activeTab === 'sem_contato' && item.cliente.telefone && (
                                                    <button
                                                        onClick={() => handleStartContact(item)}
                                                        disabled={updatingId === item.id}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-purple-300 dark:border-purple-600 shadow-xs text-xs font-medium rounded-sm text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                                                    >
                                                        Iniciar Contato
                                                    </button>
                                                )}
                                                <div className="relative inline-block">
                                                    <select
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Reset select value visually (handled by value="" prop, but good to be safe)
                                                            e.target.value = "";
                                                            handleStatusChange(item, val);
                                                        }}
                                                        value=""
                                                        disabled={updatingId === item.id}
                                                        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded-sm text-xs font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="" disabled>Mover para...</option>
                                                        {getAvailableActions(item.status).map((action) => (
                                                            <option key={action.value} value={action.value} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
                                                                {action.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando página <span className="font-medium">{meta.page}</span> de <span className="font-medium">{meta.pages}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                                disabled={page === meta.pages}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>


            <MotivoPerdaModal
                open={motivoModalOpen}
                onConfirm={handleConfirmMotivo}
                onCancel={handleCancelMotivo}
                loading={motivoLoading}
            />

            {/* Detail Modal */}
            {detailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
                    <div className="crm-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do Lead</h2>
                            <button
                                onClick={() => setDetailModal(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        {detailModal.loading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="animate-spin text-purple-600" size={32} />
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Avatar + Nome */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                                        <span className="text-xl font-semibold text-purple-600 dark:text-purple-300">
                                            {(detailModal.razaoSocial || detailModal.nome || '?').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {detailModal.razaoSocial || detailModal.nome || '-'}
                                        </h3>
                                        {detailModal.nomeFantasia && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{detailModal.nomeFantasia}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contato rápido */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                        <Mail size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Email</p>
                                            <p className="text-sm text-gray-900 dark:text-white break-all">{detailModal.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                        <Phone size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Telefone</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{detailModal.telefone1 || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                        <Building2 size={18} className="text-gray-400" />
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Município / UF</p>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {detailModal.municipio ? `${detailModal.municipio}${detailModal.uf ? ` - ${detailModal.uf}` : ''}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dados Empresariais */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Building2 size={18} className="text-purple-500" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Dados Empresariais</h4>
                                        <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                            Dados da Receita Federal
                                        </span>
                                    </div>

                                    {/* CNPJ / Razão / Fantasia */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <FileText size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">CNPJ</p>
                                                <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                                                    {detailModal.cnpj || `${detailModal.cnpjBasico || ''}/${detailModal.cnpjOrdem || ''}-${detailModal.cnpjDv || ''}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <Building2 size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Razão Social</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{detailModal.razaoSocial || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <Tag size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Nome Fantasia</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{detailModal.nomeFantasia || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Capital / Porte / Natureza */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <DollarSign size={18} className="text-green-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Capital Social</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {(() => {
                                                        if (!detailModal.capitalSocial) return '-';
                                                        const valorStr = String(detailModal.capitalSocial);
                                                        const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.');
                                                        const valor = Number(valorLimpo);
                                                        if (isNaN(valor)) return `R$ ${valorStr}`;
                                                        return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <Briefcase size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Porte da Empresa</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{detailModal.porte || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <Scale size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Natureza Jurídica</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{detailModal.naturezaJuridica || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CNAE e Matriz */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">CNAE Principal</p>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {detailModal.cnaePrincipal && (
                                                    <span className="font-mono mr-2 px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                                        {detailModal.cnaePrincipal}
                                                    </span>
                                                )}
                                                {detailModal.cnaePrincipalDesc || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Matriz/Filial</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{detailModal.matrizFilial || '-'}</p>
                                        </div>
                                    </div>

                                    {/* Situação / Abertura / Lote */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Situação Cadastral</p>
                                            <p className="text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${detailModal.situacaoCadastral?.toLowerCase().includes('ativa')
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                    {detailModal.situacaoCadastral || '-'}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Data de Abertura</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{detailModal.dataAbertura || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Lote de Importação</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{detailModal.lote || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Endereço */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin size={18} className="text-gray-400" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Endereço</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Endereço</p>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {`${detailModal.tipoLogradouro || ''} ${detailModal.logradouro || ''}`.trim() || '-'}
                                                {detailModal.numero ? `, ${detailModal.numero}` : ''}
                                                {detailModal.complemento ? ` - ${detailModal.complemento}` : ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Bairro</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{detailModal.bairro || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Cidade / UF</p>
                                            <p className="text-sm text-gray-900 dark:text-white">
                                                {detailModal.municipio ? `${detailModal.municipio}${detailModal.uf ? ` - ${detailModal.uf}` : ''}` : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">CEP</p>
                                            <p className="text-sm text-gray-900 dark:text-white">{detailModal.cep || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Outros Contatos */}
                                {(detailModal.telefone2 || detailModal.fax) && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Phone size={18} className="text-gray-400" />
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Outros Contatos</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {detailModal.telefone2 && (
                                                <div>
                                                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Telefone 2</p>
                                                    <p className="text-sm text-gray-900 dark:text-white">{detailModal.telefone2}</p>
                                                </div>
                                            )}
                                            {detailModal.fax && (
                                                <div>
                                                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Fax</p>
                                                    <p className="text-sm text-gray-900 dark:text-white">{detailModal.fax}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* CNAEs Secundários */}
                                {detailModal.cnaesSecundarios && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">CNAEs Secundários</p>
                                        <p className="text-sm text-gray-900 dark:text-white wrap-break-word">{detailModal.cnaesSecundarios}</p>
                                    </div>
                                )}

                                {/* Metadados */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar size={18} className="text-gray-400" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Metadados</h4>
                                    </div>
                                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-gray-400" />
                                            <div>
                                                <p className="text-xs uppercase">Importado em</p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {detailModal.dataImportacao ? new Date(detailModal.dataImportacao).toLocaleDateString('pt-BR') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                        {detailModal.ultimoContato && (
                                            <div className="flex items-center gap-3">
                                                <Calendar size={18} className="text-gray-400" />
                                                <div>
                                                    <p className="text-xs uppercase">?ltimo Contato</p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {new Date(detailModal.ultimoContato).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Layers size={18} className="text-gray-400" />
                                            <div>
                                                <p className="text-xs uppercase">Status</p>
                                                <p className="text-gray-900 dark:text-white capitalize">{detailModal.status?.replace('_', ' ') || '-'}</p>
                                            </div>
                                        </div>
                                        {detailModal.prioridade != null && detailModal.prioridade > 0 && (
                                            <div className="flex items-center gap-3">
                                                <Star size={18} className="text-gray-400" />
                                                <div>
                                                    <p className="text-xs uppercase">Prioridade</p>
                                                    <div className="flex items-center gap-0.5 mt-0.5">
                                                        {[1, 2, 3, 4, 5].map((i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={i <= detailModal.prioridade ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Observações */}
                                {detailModal.observacoes && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Observações</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailModal.observacoes}</p>
                                    </div>
                                )}

                                {detailModal._fallback && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                        Exibindo dados parciais. Não foi possível carregar todos os detalhes.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}






