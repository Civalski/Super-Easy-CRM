'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { readCsvToObjects } from '@/lib/csv'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import { Loader2, ChevronLeft, ChevronRight, Layers, Eye, X, User, Mail, Phone, Building2, MapPin, FileText, Calendar, Star, Hash, Briefcase, Tag, DollarSign, Scale, MessageCircle, Plus, PhoneCall, LayoutList, ShoppingCart, MoreVertical, Edit2, Trash2, UserPlus, QuestionMarkCircle } from '@/lib/icons'
import {
    FunilKanban,
    CadastrarLeadDrawer,
    EditarLeadDrawer,
    ComprarLeadDrawer,
    FUNIL_GUIDE_LOCK_MESSAGE,
    FUNIL_TABS,
    useFunilGuide,
    type FunilTabValue,
} from '@/components/features/grupos'
import CreateOrcamentoDrawer from '@/components/features/oportunidades/CreateOrcamentoDrawer'
import { CreatePedidoDiretoModal } from '@/components/features/pedidos/CreatePedidoDiretoModal'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { MotivoPerdaModal } from '@/components/features/oportunidades'
import { SideCreateDrawer } from '@/components/common'
import { getEmailComposeUrl } from '@/lib/emailCompose'
import { MetaBatidaModal } from '@/components/features/metas/MetaBatidaModal'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'
import { useTipoPublico } from '@/lib/hooks/useTipoPublico'
import { useGuideTour } from '@/components/layout/GuideTourProvider'
import type { MenuItem } from '@/lib/menuItems'

let lastMetaBatidaAt = 0
const META_BATIDA_DEBOUNCE_MS = 10000

async function checkMetaDiariaCompletada(onMetaBatida?: () => void) {
  try {
    const res = await fetch('/api/metas/contatos-diarios')
    if (!res.ok) return
    const data = await res.json()
    if (!data.ativo || typeof data.metaDiaria !== 'number') return
    if ((data.contatosHoje ?? 0) < data.metaDiaria) return
    if (Date.now() - lastMetaBatidaAt < META_BATIDA_DEBOUNCE_MS) return
    lastMetaBatidaAt = Date.now()
    onMetaBatida?.()
  } catch {
    /* ignore */
  }
}

interface Oportunidade {
    id: string
    titulo: string
    valor: number | null
    status: string
    createdAt: string
    clienteId?: string
    cliente: {
        nome: string
        email: string | null
        telefone: string | null
        empresa: string | null
        cnpj?: string | null
        capitalSocial?: string | null
        atividadePrincipal?: string | null
        municipio?: string | null
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

function getNextStatus(status: string): string | null {
    const idx = FUNIL_TABS.findIndex((t) => t.value === status)
    if (idx < 0 || idx >= FUNIL_TABS.length - 1) return null
    return FUNIL_TABS[idx + 1].value
}

function getPrevStatus(status: string): string | null {
    const idx = FUNIL_TABS.findIndex((t) => t.value === status)
    if (idx <= 0) return null
    return FUNIL_TABS[idx - 1].value
}

function formatCapitalSocial(value: string | null | undefined): string {
    if (!value) return '-'
    const valorLimpo = String(value).replace(/\./g, '').replace(',', '.')
    const numero = Number(valorLimpo)
    if (Number.isNaN(numero)) return `R$ ${value}`
    return `R$ ${numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

const WHATSAPP_MESSAGES_STORAGE_KEY = 'grupos_whatsapp_messages_v1'
const WHATSAPP_MESSAGE_GUIDE_SEEN_STORAGE_KEY = 'grupos_whatsapp_message_guide_seen_v1'
/** Limite para o link wa.me suportar o parâmetro text (URL segura) */
const MAX_WHATSAPP_MESSAGE_LENGTH = 1500
/** Mensagem padrão: usuário deve substituir o espaço entre aspas pela profissão */
const DEFAULT_WHATSAPP_MESSAGE = 'Olá, você trabalha com " "?'
/** Mensagem padrão antiga: migrar para a nova ao carregar */
const LEGACY_DEFAULT_MESSAGE = 'ola {nome} como vai?'
const DEFAULT_WHATSAPP_TEMPLATE_TITLE = 'Mensagem principal'

const WHATSAPP_MESSAGE_GUIDE_ITEM: MenuItem = {
    name: 'Guia: Mensagens WhatsApp',
    href: '/grupos',
    icon: MessageCircle,
    guideSteps: [
        {
            title: 'Passo 1: Defina o título',
            description:
                'No campo "Título da mensagem", coloque um nome curto para identificar o contexto.\n\n' +
                '- Esse título aparece no botão "WhatsApp" ao escolher a mensagem.\n' +
                '- Exemplos bons: Restaurante, Academia, Loja de Roupas.',
            meta: { messageGuideField: 'title' },
        },
        {
            title: 'Passo 2: Escreva a mensagem',
            description:
                'No campo de descrição, monte o texto que será enviado.\n\n' +
                '- Evite mensagens longas; curto e direto costuma converter melhor.\n' +
                '- Se possível, chame o cliente pelo nome usando {nome}.',
            meta: { messageGuideField: 'description' },
        },
        {
            title: 'Passo 3: Personalize com contexto',
            description:
                'Use contexto do lead para soar natural e aumentar resposta.\n\n' +
                '- Pergunte sobre a atividade principal da empresa quando fizer sentido.\n' +
                '- Exemplo: "Bom dia, (nome do cliente). Esse número é do restaurante (nome do restaurante)?"',
            meta: { messageGuideField: 'description' },
        },
    ],
}

interface WhatsAppMessageTemplate {
    id: string
    title: string
    message: string
}

interface WhatsAppTemplateOption {
    id: string
    title: string
}

function createWhatsAppTemplate(index: number, overrides?: Partial<WhatsAppMessageTemplate>): WhatsAppMessageTemplate {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: `Mensagem ${index + 1}`,
        message: '',
        ...overrides,
    }
}

function ListaItemActions({
    item,
    updatingId,
    whatsAppTemplates,
    onViewDetails,
    onStartContact,
    onSendEmail,
    onEdit,
    onDelete,
    onStatusChange,
    onTransformarCliente,
    onCreateOrcamento,
    onCreatePedido,
}: {
    item: Oportunidade
    updatingId: string | null
    whatsAppTemplates: WhatsAppTemplateOption[]
    onViewDetails: (item: Oportunidade) => void
    onStartContact?: (item: Oportunidade, templateId?: string) => void
    onSendEmail?: (item: Oportunidade) => void
    onEdit?: (item: Oportunidade) => void
    onDelete?: (item: Oportunidade) => void
    onStatusChange: (item: Oportunidade, newStatus: string) => Promise<void>
    onTransformarCliente?: (item: Oportunidade) => void
    onCreateOrcamento?: (item: Oportunidade) => void
    onCreatePedido?: (item: Oportunidade) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
    const [whatsAppMenuOpen, setWhatsAppMenuOpen] = useState(false)
    const [whatsAppMenuPos, setWhatsAppMenuPos] = useState({ top: 0, left: 0 })
    const menuRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const whatsAppMenuRef = useRef<HTMLDivElement>(null)
    const whatsAppTriggerRef = useRef<HTMLButtonElement>(null)

    const hasValidPhone = item.cliente.telefone && item.cliente.telefone.replace(/\D/g, '').length > 0
    const showWhatsApp = hasValidPhone && onStartContact
    const showEmail =
        item.cliente.email && onSendEmail
    const nextStatus = getNextStatus(item.status)
    const prevStatus = getPrevStatus(item.status)

    useEffect(() => {
        if (menuOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const menuW = 176
            const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8))
            const top = Math.min(rect.bottom + 4, window.innerHeight - 200)
            setMenuPos({ top, left })
        }
    }, [menuOpen])

    useEffect(() => {
        if (whatsAppMenuOpen && whatsAppTriggerRef.current) {
            const rect = whatsAppTriggerRef.current.getBoundingClientRect()
            const menuW = 220
            const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8))
            const top = Math.min(rect.bottom + 4, window.innerHeight - 200)
            setWhatsAppMenuPos({ top, left })
        }
    }, [whatsAppMenuOpen])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (menuRef.current && !menuRef.current.contains(target) && triggerRef.current && !triggerRef.current.contains(target)) {
                setMenuOpen(false)
            }
            if (whatsAppMenuRef.current && !whatsAppMenuRef.current.contains(target) && whatsAppTriggerRef.current && !whatsAppTriggerRef.current.contains(target)) {
                setWhatsAppMenuOpen(false)
            }
        }
        if (menuOpen || whatsAppMenuOpen) document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [menuOpen, whatsAppMenuOpen])

    return (
        <div className="flex items-center gap-2">
            {showWhatsApp && (
                <div className="relative inline-block">
                    <button
                        ref={whatsAppTriggerRef}
                        type="button"
                        onClick={() => {
                            setWhatsAppMenuOpen((o) => !o)
                            setMenuOpen(false)
                        }}
                        disabled={updatingId === item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-600 shadow-xs text-xs font-medium rounded-sm text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                        title="Enviar WhatsApp"
                    >
                        <MessageCircle size={12} />
                        WhatsApp
                    </button>
                    {whatsAppMenuOpen && typeof document !== 'undefined' && createPortal(
                        <div
                            ref={whatsAppMenuRef}
                            className="fixed z-[9999] w-56 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
                            style={{ top: whatsAppMenuPos.top, left: whatsAppMenuPos.left }}
                        >
                            {whatsAppTemplates.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                    Nenhuma mensagem ativa.
                                </p>
                            ) : (
                                whatsAppTemplates.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => {
                                            onStartContact?.(item, template.id)
                                            setWhatsAppMenuOpen(false)
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <MessageCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
                                        {template.title}
                                    </button>
                                ))
                            )}
                        </div>,
                        document.body
                    )}
                </div>
            )}
            {showEmail && (
                <button
                    onClick={() => onSendEmail?.(item)}
                    disabled={updatingId === item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-sky-300 dark:border-sky-600 shadow-xs text-xs font-medium rounded-sm text-sky-700 dark:text-sky-200 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                    title="Enviar email"
                >
                    <Mail size={12} />
                    Email
                </button>
            )}
            <div className="relative inline-block">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => {
                        setMenuOpen((o) => !o)
                        setWhatsAppMenuOpen(false)
                    }}
                    className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-700"
                    title="Ações"
                >
                    <MoreVertical size={16} />
                </button>
                {menuOpen && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[9999] w-52 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
                        style={{ top: menuPos.top, left: menuPos.left }}
                    >
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => { onDelete(item); setMenuOpen(false) }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                                <Trash2 size={12} />
                                Excluir
                            </button>
                        )}
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => { onEdit(item); setMenuOpen(false) }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Edit2 size={12} />
                                Editar
                            </button>
                        )}
                        {item.type === 'prospecto' && onTransformarCliente && (
                            <button
                                type="button"
                                onClick={() => { onTransformarCliente(item); setMenuOpen(false) }}
                                disabled={updatingId === item.id}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                <UserPlus size={12} />
                                Transformar em cliente
                            </button>
                        )}
                        {onCreatePedido && (
                            <button
                                type="button"
                                onClick={() => { onCreatePedido(item); setMenuOpen(false) }}
                                disabled={updatingId === item.id}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ShoppingCart size={12} />
                                Criar pedido
                            </button>
                        )}
                        {item.type === 'prospecto' && onCreateOrcamento && (
                            <button
                                type="button"
                                onClick={() => { onCreateOrcamento(item); setMenuOpen(false) }}
                                disabled={updatingId === item.id}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                <FileText size={12} />
                                Criar orçamento
                            </button>
                        )}
                        {prevStatus && (
                            <button
                                type="button"
                                onClick={() => { void onStatusChange(item, prevStatus); setMenuOpen(false) }}
                                disabled={updatingId === item.id}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ChevronLeft size={12} />
                                Voltar etapa
                            </button>
                        )}
                        {nextStatus && (
                            <button
                                type="button"
                                onClick={() => { void onStatusChange(item, nextStatus); setMenuOpen(false) }}
                                disabled={updatingId === item.id}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                <ChevronRight size={12} />
                                Avançar etapa
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { onViewDetails(item); setMenuOpen(false) }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Eye size={12} />
                            Ver detalhes
                        </button>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}

export default function GruposPage() {
    const router = useRouter()
    const minimal = usePageHeaderMinimal()
    const { prompt, confirm } = useConfirm()
    const { openGuide, guideActive, currentGuideStep } = useGuideTour()
    const [activeTab, setActiveTab] = useState<FunilTabValue>('sem_contato')
    const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista')
    const [kanbanRefreshTrigger, setKanbanRefreshTrigger] = useState(0)
    const [page, setPage] = useState(1)
    const [data, setData] = useState<Oportunidade[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [motivoModalOpen, setMotivoModalOpen] = useState(false)
    const [motivoOportunidadeId, setMotivoOportunidadeId] = useState<string | null>(null)
    const [motivoItemType, setMotivoItemType] = useState<'prospecto' | 'oportunidade'>('oportunidade')
    const [motivoLoading, setMotivoLoading] = useState(false)
    const [showCadastrarLead, setShowCadastrarLead] = useState(false)
    const [showEditarLead, setShowEditarLead] = useState(false)
    const [editarLeadId, setEditarLeadId] = useState<string | null>(null)
    const [showCreateOrcamento, setShowCreateOrcamento] = useState(false)
    const [createOrcamentoInitialPerson, setCreateOrcamentoInitialPerson] = useState<AsyncSelectOption | null>(null)
    const [showCreatePedido, setShowCreatePedido] = useState(false)
    const [createPedidoInitialPerson, setCreatePedidoInitialPerson] = useState<AsyncSelectOption | null>(null)
    const [showComprarLead, setShowComprarLead] = useState(false)
    const { tipoPublico } = useTipoPublico()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Detail modal state
    const [detailModal, setDetailModal] = useState<any | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [showMessageConfig, setShowMessageConfig] = useState(false)
    const [whatsAppMessages, setWhatsAppMessages] = useState<WhatsAppMessageTemplate[]>([
        createWhatsAppTemplate(0, { title: DEFAULT_WHATSAPP_TEMPLATE_TITLE, message: DEFAULT_WHATSAPP_MESSAGE }),
    ])
    const [draftWhatsAppMessages, setDraftWhatsAppMessages] = useState<WhatsAppMessageTemplate[]>([
        createWhatsAppTemplate(0, { title: DEFAULT_WHATSAPP_TEMPLATE_TITLE, message: DEFAULT_WHATSAPP_MESSAGE }),
    ])
    const [contatosIniciadosHoje, setContatosIniciadosHoje] = useState<number | null>(null)
    const [metaContatosHoje, setMetaContatosHoje] = useState<number | null>(null)
    const [showMetaBatidaModal, setShowMetaBatidaModal] = useState(false)

    const notifyGuideLock = useCallback(() => {
        toast.info('Apresentação em andamento', {
            description: FUNIL_GUIDE_LOCK_MESSAGE,
        })
    }, [])

    const {
        currentFunilGuideTab,
        isFunilGuideActive,
        tabsLocked,
        viewModeLocked,
        handleTabChange: handleFunilGuideTabChange,
        handleViewModeChange,
    } = useFunilGuide({
        activeTab,
        setActiveTab,
        setPage,
        viewMode,
        setViewMode,
        onLockedInteraction: notifyGuideLock,
    })

    const onMetaBatida = useCallback(() => setShowMetaBatidaModal(true), [])

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

    const handleEdit = useCallback((item: Oportunidade) => {
        if (item.type === 'oportunidade') {
            window.location.href = `/oportunidades/${item.id}/editar`
        } else {
            setEditarLeadId(item.id)
            setShowEditarLead(true)
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

    const handleTransformarCliente = useCallback(async (item: Oportunidade) => {
        if (item.type !== 'prospecto') return
        setUpdatingId(item.id)
        try {
            const res = await fetch(`/api/prospectos/${item.id}/converter`, { method: 'POST' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Erro ao converter')
            toast.success('Lead convertido em cliente!', {
                description: data.cliente?.numero ? `Código do cliente: ${data.cliente.numero}` : undefined,
                action: {
                    label: 'Ver clientes',
                    onClick: () => router.push('/clientes'),
                },
            })
            await fetchGrupos()
            if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
        } catch (e) {
            toast.error('Erro', { description: e instanceof Error ? e.message : 'Não foi possível converter.' })
        } finally {
            setUpdatingId(null)
        }
    }, [fetchGrupos, viewMode, router])

    const handleCreateOrcamento = useCallback((item: Oportunidade) => {
        if (item.type !== 'prospecto') return
        setCreateOrcamentoInitialPerson({
            id: item.id,
            nome: item.cliente.nome,
            tipo: 'prospecto',
        })
        setShowCreateOrcamento(true)
    }, [])

    const handleCreatePedido = useCallback((item: Oportunidade) => {
        if (item.type === 'prospecto') {
            setCreatePedidoInitialPerson({
                id: item.id,
                nome: item.cliente.nome,
                tipo: 'prospecto',
            })
        } else if (item.type === 'oportunidade' && item.clienteId) {
            setCreatePedidoInitialPerson({
                id: item.clienteId,
                nome: item.cliente.nome,
                tipo: 'cliente',
            })
        } else return
        setShowCreatePedido(true)
    }, [])

    const handleDelete = useCallback(async (item: Oportunidade) => {
        const ok = await confirm({
            title: 'Excluir lead',
            description: `Deseja realmente excluir ${item.cliente.nome}? Esta ação não pode ser desfeita.`,
            confirmLabel: 'Sim, excluir',
            cancelLabel: 'Cancelar',
        })
        if (!ok) return
        setUpdatingId(item.id)
        try {
            if (item.type === 'prospecto') {
                const res = await fetch(`/api/prospectos/${item.id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error('Erro ao excluir')
            } else {
                const res = await fetch(`/api/oportunidades/${item.id}`, { method: 'DELETE' })
                if (!res.ok) throw new Error('Erro ao excluir')
            }
            toast.success('Excluído com sucesso')
            await fetchGrupos()
            if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
        } catch (e) {
            toast.error('Erro ao excluir', { description: e instanceof Error ? e.message : 'Tente novamente.' })
        } finally {
            setUpdatingId(null)
        }
    }, [fetchGrupos, viewMode, confirm])

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
                .map((entry, index): WhatsAppMessageTemplate | null => {
                    if (typeof entry === 'string') {
                        return createWhatsAppTemplate(index, {
                            title: index === 0 ? DEFAULT_WHATSAPP_TEMPLATE_TITLE : `Mensagem ${index + 1}`,
                            message: entry.trim(),
                        })
                    }
                    if (!entry || typeof entry !== 'object') return null
                    const rawTitle = 'title' in entry && typeof entry.title === 'string' ? entry.title.trim() : ''
                    const rawMessage = 'message' in entry && typeof entry.message === 'string' ? entry.message.trim() : ''
                    const rawId = 'id' in entry && typeof entry.id === 'string' ? entry.id.trim() : ''
                    return createWhatsAppTemplate(index, {
                        id: rawId || undefined,
                        title: rawTitle || `Mensagem ${index + 1}`,
                        message: rawMessage,
                    })
                })
                .filter((entry): entry is WhatsAppMessageTemplate => entry !== null)

            while (
                normalized.length > 1 &&
                normalized[normalized.length - 1].message.trim() === ''
            ) {
                normalized.pop()
            }

            if (
                normalized.length === 1 &&
                normalized[0].message.toLowerCase() === LEGACY_DEFAULT_MESSAGE.toLowerCase()
            ) {
                const migrated = [
                    createWhatsAppTemplate(0, {
                        title: DEFAULT_WHATSAPP_TEMPLATE_TITLE,
                        message: DEFAULT_WHATSAPP_MESSAGE,
                    }),
                ]
                setWhatsAppMessages(migrated)
                setDraftWhatsAppMessages(migrated)
                window.localStorage.setItem(WHATSAPP_MESSAGES_STORAGE_KEY, JSON.stringify(migrated))
                return
            }

            if (normalized.length > 0) {
                setWhatsAppMessages(normalized)
                setDraftWhatsAppMessages(normalized)
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens de WhatsApp:', error)
        }
    }, [])

    const handleTabChange = (value: FunilTabValue) => {
        handleFunilGuideTabChange(value)
    }

    const handleImport = async (file: File) => {
        let loadingToastId: string | number | undefined = toast.loading('Lendo arquivo...')
        let importToastId: string | number | undefined

        try {
            const fileName = typeof file?.name === 'string' ? file.name : ''
            const lowerName = fileName.toLowerCase()
            if (!lowerName.endsWith('.csv')) {
                throw new Error('Formato nao suportado. Use apenas arquivo .csv')
            }

            console.info('[grupos/importacao] iniciando leitura de arquivo', {
                fileName,
                fileSize: file.size,
                fileType: file.type,
            })

            const text = await file.text()
            const jsonData = await readCsvToObjects(text)

            if (jsonData.length === 0) {
                throw new Error('O arquivo esta vazio')
            }

            toast.dismiss(loadingToastId)

            importToastId = toast.loading(`Importando ${jsonData.length} registros...`)

            const response = await fetch('/api/prospectos/importar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresas: jsonData,
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

    const getWhatsappMessage = (item: Oportunidade, templateId?: string) => {
        const activeTemplates = whatsAppMessages.filter((template) => template.message.trim().length > 0)
        if (activeTemplates.length === 0) return ''

        const selected = templateId
            ? activeTemplates.find((template) => template.id === templateId) ?? activeTemplates[0]
            : activeTemplates[0]
        const nome = item.cliente.nome || ''
        const empresa = item.cliente.empresa || item.cliente.nome || ''
        const email = item.cliente.email || ''
        const telefone = item.cliente.telefone || ''
        const cnpj = item.cliente.cnpj || ''

        let result = selected.message
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
        setDraftWhatsAppMessages(
            whatsAppMessages.length
                ? whatsAppMessages.map((template) => ({ ...template }))
                : [createWhatsAppTemplate(0, { title: DEFAULT_WHATSAPP_TEMPLATE_TITLE, message: DEFAULT_WHATSAPP_MESSAGE })]
        )

        let hasSeenGuide = false
        try {
            hasSeenGuide = window.localStorage.getItem(WHATSAPP_MESSAGE_GUIDE_SEEN_STORAGE_KEY) === '1'
        } catch {
            hasSeenGuide = false
        }
        if (!hasSeenGuide) {
            try {
                window.localStorage.setItem(WHATSAPP_MESSAGE_GUIDE_SEEN_STORAGE_KEY, '1')
            } catch {
                // ignore
            }
            if (!guideActive) {
                openGuide([WHATSAPP_MESSAGE_GUIDE_ITEM])
            }
        }
        setShowMessageConfig(true)
    }

    const handleCancelMessageConfig = () => {
        setDraftWhatsAppMessages(whatsAppMessages.map((template) => ({ ...template })))
        setShowMessageConfig(false)
    }

    const handleReplayMessageGuide = () => {
        try {
            window.localStorage.setItem(WHATSAPP_MESSAGE_GUIDE_SEEN_STORAGE_KEY, '1')
        } catch {
            // ignore
        }
        openGuide([WHATSAPP_MESSAGE_GUIDE_ITEM])
    }

    const handleSaveMessageConfig = () => {
        const normalized = draftWhatsAppMessages.map((template, index) => ({
            id: template.id || createWhatsAppTemplate(index).id,
            title: (template.title || `Mensagem ${index + 1}`).trim() || `Mensagem ${index + 1}`,
            message: (template.message || '').trim().slice(0, MAX_WHATSAPP_MESSAGE_LENGTH),
        }))

        while (
            normalized.length > 1 &&
            normalized[normalized.length - 1].message.trim() === ''
        ) {
            normalized.pop()
        }
        if (normalized.length === 0) {
            normalized.push(
                createWhatsAppTemplate(0, {
                    title: DEFAULT_WHATSAPP_TEMPLATE_TITLE,
                    message: '',
                })
            )
        }

        setWhatsAppMessages(normalized)
        setDraftWhatsAppMessages(normalized.map((template) => ({ ...template })))

        const hasAnyMessage = normalized.some((template) => template.message.length > 0)
        if (hasAnyMessage) {
            window.localStorage.setItem(WHATSAPP_MESSAGES_STORAGE_KEY, JSON.stringify(normalized))
        } else {
            window.localStorage.removeItem(WHATSAPP_MESSAGES_STORAGE_KEY)
        }

        setShowMessageConfig(false)
    }

    const handleAddAnotherMessage = () => {
        setDraftWhatsAppMessages([
            ...draftWhatsAppMessages,
            createWhatsAppTemplate(draftWhatsAppMessages.length),
        ])
    }

    const handleRemoveDraftMessage = (index: number) => {
        if (draftWhatsAppMessages.length <= 1) return
        const next = draftWhatsAppMessages.filter((_, i) => i !== index)
        setDraftWhatsAppMessages(next)
    }

    const handleStartContact = async (item: Oportunidade, templateId?: string) => {
        if (!item.cliente.telefone) return

        const message = getWhatsappMessage(item, templateId)
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

        if (item.status !== 'sem_contato' || item.type !== 'prospecto') return

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
                if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
                checkMetaDiariaCompletada(onMetaBatida)
            } else {
                alert('Erro ao iniciar contato')
            }
        } catch (error) {
            console.error('Erro ao iniciar contato:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleSendEmail = async (item: Oportunidade) => {
        if (!item.cliente.email) return

        const url = getEmailComposeUrl(item.cliente.email)
        window.open(url, '_blank')

        if (item.status !== 'sem_contato' || item.type !== 'prospecto') return

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
                if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
                checkMetaDiariaCompletada(onMetaBatida)
            } else {
                alert('Erro ao atualizar status')
            }
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error)
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
                } else if (['sem_contato', 'contatado'].includes(newStatus)) {
                    const prospectoStatus = newStatus === 'sem_contato' ? 'novo' : 'em_contato'
                    const response = await fetch(`/api/prospectos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: prospectoStatus,
                            ...(prospectoStatus === 'em_contato' && { ultimoContato: new Date().toISOString() }),
                        })
                    })
                    if (!response.ok) {
                        const errorPayload = await response.json().catch(() => null)
                        throw new Error(errorPayload?.error || 'Erro ao atualizar status')
                    }
                    if (prospectoStatus === 'em_contato') checkMetaDiariaCompletada(onMetaBatida)
                } else if (['em_potencial', 'aguardando_orcamento'].includes(newStatus)) {
                    const prospectoStatus = newStatus === 'em_potencial' ? 'qualificado' : 'aguardando_orcamento'
                    const response = await fetch(`/api/prospectos/${item.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: prospectoStatus })
                    })
                    if (!response.ok) {
                        const errorPayload = await response.json().catch(() => null)
                        throw new Error(errorPayload?.error || 'Erro ao atualizar status')
                    }
                }
                await fetchGrupos()
                if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
            } else {
                await updateOportunidadeStatus(item.id, { status: newStatus })
                await fetchGrupos()
                if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
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
                if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
            } else {
                await updateOportunidadeStatus(motivoOportunidadeId, {
                    status: 'perdida',
                    motivoPerda: motivo,
                })
                await fetchGrupos()
                if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
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
        const tabActions = FUNIL_TABS.filter((tab) => tab.value !== currentStatus).map((tab) => ({
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

    const activeTemplates = whatsAppMessages.filter((template) => template.message.trim().length > 0)
    const activeMessageCount = activeTemplates.length
    const whatsAppTemplateOptions: WhatsAppTemplateOption[] = activeTemplates.map((template, index) => ({
        id: template.id,
        title: template.title.trim() || `Mensagem ${index + 1}`,
    }))
    const isMessageGuideActive = showMessageConfig && guideActive && currentGuideStep?.href === '/grupos'
    const guideFieldHighlight = isMessageGuideActive ? currentGuideStep?.meta?.messageGuideField : undefined
    const highlightTitleField = guideFieldHighlight === 'title'
    const highlightDescriptionField = guideFieldHighlight === 'description'

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
            <MetaBatidaModal
                open={showMetaBatidaModal}
                onClose={() => setShowMetaBatidaModal(false)}
                isMetaDiaria
                onCreateNewMeta={() => {
                    setShowMetaBatidaModal(false)
                    router.push('/metas?new=1')
                }}
            />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {!minimal && (
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
                )}
                <div className={`flex flex-wrap items-center gap-3 ${minimal ? 'md:ml-auto' : ''}`}>
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
                    <button
                        type="button"
                        onClick={() => setShowCadastrarLead(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 shadow-xs hover:bg-purple-100 dark:hover:bg-purple-800"
                    >
                        <Plus size={16} />
                        Cadastrar lead
                    </button>
                    {tipoPublico !== 'B2C' && (
                        <button
                            type="button"
                            onClick={() => setShowComprarLead(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 shadow-xs hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-800"
                        >
                            <ShoppingCart size={16} />
                            Importar leads
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                                void handleImport(file)
                            }
                            event.target.value = ''
                        }}
                    />
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
                                ? '1 mensagem ativa com título'
                                : `${activeMessageCount} mensagens ativas com título`}
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
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleReplayMessageGuide}
                                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                    aria-label="Refazer guia de personalização de mensagem"
                                    title="Ver guia novamente"
                                >
                                    <QuestionMarkCircle size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelMessageConfig}
                                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                    aria-label="Fechar"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Dica: use {'{nome}'}, {'{empresa}'}, {'{email}'}, {'{telefone}'} e {'{cnpj}'} para personalizar.
                            </p>

                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Substitua o espaço entre aspas pela profissão do lead. Se deixar em branco, o sistema pedirá para alterar antes de iniciar contato.
                            </p>

                            {draftWhatsAppMessages.map((template, index) => (
                                <div key={template.id}>
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
                                    <p className="mb-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                        Título que aparece no menu do botão WhatsApp
                                    </p>
                                    <input
                                        type="text"
                                        value={template.title}
                                        maxLength={60}
                                        onChange={(e) => {
                                            const next = [...draftWhatsAppMessages]
                                            next[index] = { ...next[index], title: e.target.value }
                                            setDraftWhatsAppMessages(next)
                                        }}
                                        className={`mb-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            highlightTitleField ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-400/10' : ''
                                        }`}
                                        placeholder="Título da mensagem (ex.: Academia)"
                                    />
                                    <p className="mb-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                        Descrição da mensagem que será enviada
                                    </p>
                                    <textarea
                                        value={template.message}
                                        maxLength={MAX_WHATSAPP_MESSAGE_LENGTH}
                                        onChange={(e) => {
                                            const next = [...draftWhatsAppMessages]
                                            next[index] = { ...next[index], message: e.target.value }
                                            setDraftWhatsAppMessages(next)
                                        }}
                                        rows={4}
                                        className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            highlightDescriptionField ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-400/10' : ''
                                        }`}
                                        placeholder="Digite a mensagem para o WhatsApp..."
                                    />
                                    <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                                        {template.message.length} / {MAX_WHATSAPP_MESSAGE_LENGTH}
                                    </p>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddAnotherMessage}
                                className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <Plus size={16} />
                                Acrescentar outra mensagem
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

            {/* Tabs (só na lista) + View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                {viewMode === 'lista' ? (
                    <div className="min-w-0">
                        {isFunilGuideActive && currentFunilGuideTab && (
                            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                                <span className="font-semibold">Apresentação guiada:</span> acompanhe esta etapa e avance pelos botões da caixa de onboarding.
                            </div>
                        )}
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {FUNIL_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab.value)}
                                disabled={tabsLocked && currentFunilGuideTab !== tab.value}
                                className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.value
                                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
                ${tabsLocked && currentFunilGuideTab !== tab.value ? 'cursor-not-allowed opacity-45' : ''}
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
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                        Arraste os cards entre as colunas para alterar a etapa do lead no funil.
                    </p>
                )}
                <div className={`flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-900/50 ${viewMode === 'kanban' ? 'ml-auto' : ''}`}>
                    <button
                        type="button"
                        onClick={() => handleViewModeChange('lista')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'lista'
                                ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Visualização em lista"
                    >
                        <LayoutList size={16} />
                        Lista
                    </button>
                    <button
                        type="button"
                        onClick={() => handleViewModeChange('kanban')}
                        disabled={viewModeLocked}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'kanban'
                                ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        } ${viewModeLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Visualização em Kanban"
                    >
                        <Layers size={16} />
                        Kanban
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 shadow-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {viewMode === 'kanban' ? (
                    <div className="p-4">
                        <FunilKanban
                            onViewDetails={handleViewDetails}
                            onStatusChange={handleStatusChange}
                            getAvailableActions={getAvailableActions}
                            whatsAppTemplates={whatsAppTemplateOptions}
                            onStartContact={handleStartContact}
                            onSendEmail={handleSendEmail}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onTransformarCliente={handleTransformarCliente}
                            onCreateOrcamento={handleCreateOrcamento}
                            onCreatePedido={handleCreatePedido}
                            updatingId={updatingId}
                            refreshTrigger={kanbanRefreshTrigger}
                        />
                    </div>
                ) : loading ? (
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
                                        Empresa
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Capital Social
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Atividade Principal
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Municipio
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
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {item.cliente.empresa || item.cliente.nome}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {formatCapitalSocial(item.cliente.capitalSocial)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white max-w-[320px] truncate" title={item.cliente.atividadePrincipal || '-'}>
                                                {item.cliente.atividadePrincipal || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {item.cliente.municipio || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ListaItemActions
                                                item={item}
                                                updatingId={updatingId}
                                                whatsAppTemplates={whatsAppTemplateOptions}
                                                onViewDetails={handleViewDetails}
                                                onStartContact={handleStartContact}
                                                onSendEmail={handleSendEmail}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onStatusChange={handleStatusChange}
                                                onTransformarCliente={handleTransformarCliente}
                                                onCreateOrcamento={handleCreateOrcamento}
                                                onCreatePedido={handleCreatePedido}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination - apenas no modo lista */}
                {viewMode === 'lista' && meta && meta.pages > 1 && (
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


            <CadastrarLeadDrawer
                open={showCadastrarLead}
                onClose={() => setShowCadastrarLead(false)}
                onCreated={async () => {
                    setActiveTab('sem_contato')
                    setPage(1)
                    await fetchGrupos()
                    if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
                }}
            />

            <EditarLeadDrawer
                open={showEditarLead}
                prospectoId={editarLeadId}
                onClose={() => {
                    setShowEditarLead(false)
                    setEditarLeadId(null)
                }}
                onSaved={async () => {
                    await fetchGrupos()
                    if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
                }}
            />

            {showCreateOrcamento && (
                <CreateOrcamentoDrawer
                    onClose={() => {
                        setShowCreateOrcamento(false)
                        setCreateOrcamentoInitialPerson(null)
                    }}
                    onCreated={async () => {
                        setShowCreateOrcamento(false)
                        setCreateOrcamentoInitialPerson(null)
                        await fetchGrupos()
                        if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
                    }}
                    initialPerson={createOrcamentoInitialPerson}
                />
            )}

            {showCreatePedido && (
                <CreatePedidoDiretoModal
                    onClose={() => {
                        setShowCreatePedido(false)
                        setCreatePedidoInitialPerson(null)
                    }}
                    onCreated={async () => {
                        setShowCreatePedido(false)
                        setCreatePedidoInitialPerson(null)
                        await fetchGrupos()
                        if (viewMode === 'kanban') setKanbanRefreshTrigger((t) => t + 1)
                    }}
                    initialPerson={createPedidoInitialPerson}
                />
            )}

            <ComprarLeadDrawer
                open={showComprarLead}
                onClose={() => setShowComprarLead(false)}
                onImportClick={() => fileInputRef.current?.click()}
            />

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






