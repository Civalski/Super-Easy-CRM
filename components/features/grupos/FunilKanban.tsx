'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Loader2, Target, MessageCircle, Mail, Layers, Menu, MoreVertical, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, UserPlus, FileText, ShoppingCart, AlertTriangle } from '@/lib/icons'
import { formatCurrency } from '@/lib/format'
import Button from '@/components/common/Button'

export interface OportunidadeKanban {
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
    avisoDescartar?: boolean
}

const TABS = [
    { label: 'Sem contato', value: 'sem_contato', icon: Target },
    { label: 'Contatado', value: 'contatado', icon: MessageCircle },
    { label: 'Em potencial', value: 'em_potencial', icon: Layers },
    { label: 'Aguardando orçamento', value: 'aguardando_orcamento', icon: FileText },
]

function getNextStatus(status: string): string | null {
    const idx = TABS.findIndex((t) => t.value === status)
    if (idx < 0 || idx >= TABS.length - 1) return null
    return TABS[idx + 1].value
}

function getPrevStatus(status: string): string | null {
    const idx = TABS.findIndex((t) => t.value === status)
    if (idx <= 0) return null
    return TABS[idx - 1].value
}

const KANBAN_PAGE_SIZE = 25

const CARD_ID_PREFIX = 'card-'
const COLUMN_ID_PREFIX = 'column-'

const KANBAN_LABELS_STORAGE_KEY = 'arkan-crm-kanban-column-labels'

function cloneKanbanData(data: Record<string, OportunidadeKanban[]>) {
    return Object.fromEntries(
        Object.entries(data).map(([status, items]) => [status, [...items]])
    ) as Record<string, OportunidadeKanban[]>
}

function cloneKanbanMeta(meta: Record<string, { total: number; page: number; pages: number }>) {
    return Object.fromEntries(
        Object.entries(meta).map(([status, value]) => [status, { ...value }])
    ) as Record<string, { total: number; page: number; pages: number }>
}

function loadCustomLabels(): Record<string, string> {
    if (typeof window === 'undefined') return {}
    try {
        const raw = localStorage.getItem(KANBAN_LABELS_STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as Record<string, string>
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
        return {}
    }
}

function saveCustomLabels(labels: Record<string, string>) {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(KANBAN_LABELS_STORAGE_KEY, JSON.stringify(labels))
    } catch {
        // ignore
    }
}

export interface FunilKanbanProps {
    onViewDetails: (item: OportunidadeKanban) => void
    onStatusChange: (item: OportunidadeKanban, newStatus: string) => Promise<void>
    getAvailableActions: (currentStatus: string) => { label: string; value: string }[]
    onStartContact?: (item: OportunidadeKanban) => void
    onSendEmail?: (item: OportunidadeKanban) => void
    onEdit?: (item: OportunidadeKanban) => void
    onDelete?: (item: OportunidadeKanban) => void
    onTransformarCliente?: (item: OportunidadeKanban) => void
    onCreatePedido?: (item: OportunidadeKanban) => void
    updatingId: string | null
    refreshTrigger?: number
}

export function FunilKanban({
    onViewDetails,
    onStatusChange,
    getAvailableActions,
    onStartContact,
    onSendEmail,
    onEdit,
    onDelete,
    onTransformarCliente,
    onCreatePedido,
    updatingId,
    refreshTrigger = 0,
}: FunilKanbanProps) {
    const [dataByStatus, setDataByStatus] = useState<Record<string, OportunidadeKanban[]>>({
        sem_contato: [],
        contatado: [],
        em_potencial: [],
        aguardando_orcamento: [],
    })
    const [pageByStatus, setPageByStatus] = useState<Record<string, number>>({
        sem_contato: 1,
        contatado: 1,
        em_potencial: 1,
        aguardando_orcamento: 1,
    })
    const [metaByStatus, setMetaByStatus] = useState<Record<string, { total: number; page: number; pages: number }>>({
        sem_contato: { total: 0, page: 1, pages: 1 },
        contatado: { total: 0, page: 1, pages: 1 },
        em_potencial: { total: 0, page: 1, pages: 1 },
        aguardando_orcamento: { total: 0, page: 1, pages: 1 },
    })
    const [loading, setLoading] = useState(true)
    const [loadingColumn, setLoadingColumn] = useState<string | null>(null)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [avisoDescartarOpen, setAvisoDescartarOpen] = useState(false)
    const [avisoDescartarCount, setAvisoDescartarCount] = useState(0)
    const [customLabels, setCustomLabels] = useState<Record<string, string>>(() => loadCustomLabels())
    const dataByStatusRef = useRef(dataByStatus)
    const metaByStatusRef = useRef(metaByStatus)

    useEffect(() => {
        dataByStatusRef.current = dataByStatus
    }, [dataByStatus])

    useEffect(() => {
        metaByStatusRef.current = metaByStatus
    }, [metaByStatus])

    const handleLabelChange = useCallback((status: string, newLabel: string) => {
        const trimmed = newLabel.trim()
        setCustomLabels((prev) => {
            const next = trimmed ? { ...prev, [status]: trimmed } : { ...prev }
            if (!trimmed) delete next[status]
            saveCustomLabels(next)
            return next
        })
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    )

    const fetchColumn = useCallback(async (status: string, page: number, silent = false) => {
        if (!silent) setLoadingColumn(status)
        try {
            const res = await fetch(`/api/grupos?status=${status}&page=${page}&limit=${KANBAN_PAGE_SIZE}`)
            const json = await res.json()
            const data = json?.data ?? []
            const meta = json?.meta ?? { total: 0, page: 1, pages: 1 }
            setDataByStatus((prev) => ({ ...prev, [status]: data }))
            setMetaByStatus((prev) => ({ ...prev, [status]: { total: meta.total, page: meta.page, pages: meta.pages } }))
            setPageByStatus((prev) => ({ ...prev, [status]: page }))

            if (status === 'contatado') {
                const comAviso = data.filter((c: OportunidadeKanban) => c.avisoDescartar).length
                if (comAviso > 0) {
                    setAvisoDescartarCount(comAviso)
                    setAvisoDescartarOpen(true)
                }
            }
        } catch (error) {
            console.error('Erro ao buscar coluna do Kanban:', error)
        } finally {
            if (!silent) setLoadingColumn(null)
        }
    }, [])

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const results = await Promise.all(
                TABS.map((tab) =>
                    fetch(`/api/grupos?status=${tab.value}&page=1&limit=${KANBAN_PAGE_SIZE}`).then((r) => r.json())
                )
            )
            const next: Record<string, OportunidadeKanban[]> = {
                sem_contato: [],
                contatado: [],
                em_potencial: [],
                aguardando_orcamento: [],
            }
            const nextMeta: Record<string, { total: number; page: number; pages: number }> = {
                sem_contato: { total: 0, page: 1, pages: 1 },
                contatado: { total: 0, page: 1, pages: 1 },
                em_potencial: { total: 0, page: 1, pages: 1 },
                aguardando_orcamento: { total: 0, page: 1, pages: 1 },
            }
            TABS.forEach((tab, i) => {
                next[tab.value] = results[i]?.data ?? []
                const m = results[i]?.meta ?? { total: 0, page: 1, pages: 1 }
                nextMeta[tab.value] = { total: m.total, page: m.page, pages: m.pages }
            })
            setDataByStatus(next)
            setMetaByStatus(nextMeta)
            setPageByStatus({ sem_contato: 1, contatado: 1, em_potencial: 1, aguardando_orcamento: 1 })

            const contatados = next.contatado ?? []
            const comAviso = contatados.filter((c) => c.avisoDescartar).length
            if (comAviso > 0) {
                setAvisoDescartarCount(comAviso)
                setAvisoDescartarOpen(true)
            }
        } catch (error) {
            console.error('Erro ao buscar dados do Kanban:', error)
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    const isInitialMount = useRef(true)
    useEffect(() => {
        const silent = isInitialMount.current ? false : true
        if (isInitialMount.current) isInitialMount.current = false
        fetchAll(silent)
    }, [fetchAll, refreshTrigger])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }, [])

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            setActiveId(null)
            const { active, over } = event

            const activeStr = typeof active.id === 'string' ? active.id : ''
            if (!activeStr.startsWith(CARD_ID_PREFIX)) return

            const itemId = activeStr.slice(CARD_ID_PREFIX.length)
            const currentData = dataByStatusRef.current
            const item = Object.values(currentData)
                .flat()
                .find((i) => i.id === itemId)
            if (!item) return

            // Soltou fora de qualquer quadro: descartar lead (onDelete exibe confirmação)
            if (!over?.id || typeof over.id !== 'string') {
                if (onDelete) {
                    await onDelete(item)
                }
                return
            }

            const overStr = String(over.id)
            if (!overStr.startsWith(COLUMN_ID_PREFIX)) return

            const newStatus = overStr.slice(COLUMN_ID_PREFIX.length)
            if (!TABS.some((t) => t.value === newStatus)) return
            if (item.status === newStatus) return

            const oldStatus = item.status
            const prevData = cloneKanbanData(dataByStatusRef.current)
            const prevMeta = cloneKanbanMeta(metaByStatusRef.current)

            // Atualização otimista: move o card imediatamente na UI
            setDataByStatus(() => {
                const next = cloneKanbanData(prevData)
                next[oldStatus] = (next[oldStatus] ?? []).filter((i) => i.id !== itemId)
                next[newStatus] = [...(next[newStatus] ?? []), { ...item, status: newStatus }]
                dataByStatusRef.current = next
                return next
            })
            setMetaByStatus(() => {
                const next = cloneKanbanMeta(prevMeta)
                const oldTotal = Math.max(0, (next[oldStatus]?.total ?? 0) - 1)
                const newTotal = (next[newStatus]?.total ?? 0) + 1
                next[oldStatus] = {
                    ...next[oldStatus],
                    total: oldTotal,
                    pages: Math.max(1, Math.ceil(oldTotal / KANBAN_PAGE_SIZE)),
                }
                next[newStatus] = {
                    ...next[newStatus],
                    total: newTotal,
                    pages: Math.max(1, Math.ceil(newTotal / KANBAN_PAGE_SIZE)),
                }
                metaByStatusRef.current = next
                return next
            })
            try {
                await onStatusChange(item, newStatus)
            } catch (error) {
                console.error('Erro ao mover card:', error)
                // Reverte em caso de erro
                setDataByStatus(() => {
                    dataByStatusRef.current = prevData
                    return prevData
                })
                setMetaByStatus(() => {
                    metaByStatusRef.current = prevMeta
                    return prevMeta
                })
            }
        },
        [onStatusChange, onDelete]
    )

    const activeItem = activeId?.startsWith(CARD_ID_PREFIX)
        ? Object.values(dataByStatus)
              .flat()
              .find((i) => CARD_ID_PREFIX + i.id === activeId)
        : null

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={32} />
                    <p className="text-gray-600 dark:text-gray-400">Carregando funil...</p>
                </div>
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {TABS.map((tab) => (
                    <KanbanColumn
                        key={tab.value}
                        status={tab.value}
                        label={customLabels[tab.value] ?? tab.label}
                        defaultLabel={tab.label}
                        onLabelChange={(newLabel) => handleLabelChange(tab.value, newLabel)}
                        icon={tab.icon}
                        items={dataByStatus[tab.value] ?? []}
                        page={metaByStatus[tab.value]?.page ?? 1}
                        total={metaByStatus[tab.value]?.total ?? 0}
                        pages={metaByStatus[tab.value]?.pages ?? 1}
                        onPageChange={(p) => fetchColumn(tab.value, p)}
                        loading={loadingColumn === tab.value}
                        onViewDetails={onViewDetails}
                        onStatusChange={onStatusChange}
                        getAvailableActions={getAvailableActions}
                        onStartContact={onStartContact}
                        onSendEmail={onSendEmail}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onTransformarCliente={onTransformarCliente}
                        onCreatePedido={onCreatePedido}
                        updatingId={updatingId}
                        isDragging={!!activeId}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem ? (
                    <KanbanCardContent item={activeItem} />
                ) : null}
            </DragOverlay>

            {avisoDescartarOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={24} className="flex-shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Aviso: leads sem resposta
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {avisoDescartarCount === 1
                                        ? '1 lead passou 7 dias em contatado sem resposta e deve ser descartado.'
                                        : `${avisoDescartarCount} leads passaram 7 dias em contatado sem resposta e devem ser descartados.`}{' '}
                                    Caso não queira descartar, você tem mais um dia para classificá-los (em potencial, aguardando orçamento ou virar cliente) ou serão descartados automaticamente.
                                </p>
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => setAvisoDescartarOpen(false)}
                                    >
                                        Entendi
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DndContext>
    )
}

interface KanbanColumnHeaderProps {
    status: string
    label: string
    defaultLabel: string
    onLabelChange: (newLabel: string) => void
    Icon: React.ComponentType<{ size?: number; className?: string }>
    total: number
    from: number
    to: number
    showPagination: boolean
}

function KanbanColumnHeader({
    status,
    label,
    defaultLabel,
    onLabelChange,
    Icon,
    total,
    from,
    to,
    showPagination,
}: KanbanColumnHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(label)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing) {
            setEditValue(label)
            inputRef.current?.focus()
            inputRef.current?.select()
        }
    }, [isEditing, label])

    const handleSave = () => {
        setIsEditing(false)
        const trimmed = editValue.trim()
        onLabelChange(trimmed || '')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setIsEditing(false)
            setEditValue(label)
        }
    }

    return (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {Icon && <Icon size={18} className="text-purple-600 dark:text-purple-400" />}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 font-medium text-sm text-gray-900 dark:text-white bg-transparent border-b border-purple-500 focus:outline-none focus:ring-0"
                    placeholder={defaultLabel}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-left group"
                    title="Clique para editar o nome do quadro"
                >
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{label}</span>
                    <Edit2 size={14} className="flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            )}
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full" title={total > 0 ? `${from}-${to} de ${total}` : '0'}>
                {total > 0 ? (showPagination ? `${from}-${to}/${total}` : `${total}`) : '0'}
            </span>
        </div>
    )
}

interface KanbanColumnProps {
    status: string
    label: string
    defaultLabel: string
    onLabelChange: (newLabel: string) => void
    icon: React.ComponentType<{ size?: number; className?: string }>
    items: OportunidadeKanban[]
    page: number
    total: number
    pages: number
    onPageChange: (page: number) => void
    loading?: boolean
    onViewDetails: (item: OportunidadeKanban) => void
    onStatusChange: (item: OportunidadeKanban, newStatus: string) => Promise<void>
    getAvailableActions: (currentStatus: string) => { label: string; value: string }[]
    onStartContact?: (item: OportunidadeKanban) => void
    onSendEmail?: (item: OportunidadeKanban) => void
    onEdit?: (item: OportunidadeKanban) => void
    onDelete?: (item: OportunidadeKanban) => void
    onTransformarCliente?: (item: OportunidadeKanban) => void
    onCreatePedido?: (item: OportunidadeKanban) => void
    updatingId: string | null
    isDragging?: boolean
}

function KanbanColumn({
    status,
    label,
    defaultLabel,
    onLabelChange,
    icon: Icon,
    items,
    page,
    total,
    pages,
    onPageChange,
    loading = false,
    onViewDetails,
    onStatusChange,
    getAvailableActions,
    onStartContact,
    onSendEmail,
    onEdit,
    onDelete,
    onTransformarCliente,
    onCreatePedido,
    updatingId,
    isDragging = false,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: COLUMN_ID_PREFIX + status,
        data: { status },
    })

    const from = total === 0 ? 0 : (page - 1) * KANBAN_PAGE_SIZE + 1
    const to = Math.min(page * KANBAN_PAGE_SIZE, total)
    const showPagination = pages > 1

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col min-w-[260px] rounded-lg border transition-colors ${
                isOver
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
            }`}
        >
            <KanbanColumnHeader
                status={status}
                label={label}
                defaultLabel={defaultLabel}
                onLabelChange={onLabelChange}
                Icon={Icon}
                total={total}
                from={from}
                to={to}
                showPagination={showPagination}
            />
            <div
                className={`flex-1 max-h-[calc(100vh-320px)] p-2 space-y-1.5 overscroll-contain ${
                    isDragging ? 'overflow-hidden' : 'overflow-y-auto'
                } ${items.length === 0 && !loading ? 'min-h-[280px] flex items-center justify-center' : ''}`}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-purple-600" size={24} />
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center px-2">
                        Arraste leads aqui
                    </p>
                ) : (
                    items.map((item) => (
                        <DraggableCard
                            key={item.id}
                            item={item}
                            onViewDetails={onViewDetails}
                            onStatusChange={onStatusChange}
                            getAvailableActions={getAvailableActions}
                            onStartContact={onStartContact}
                            onSendEmail={onSendEmail}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onTransformarCliente={onTransformarCliente}
                            onCreatePedido={onCreatePedido}
                            updatingId={updatingId}
                        />
                    ))
                )}
            </div>
            {showPagination && !loading && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    <button
                        type="button"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Página anterior"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Pág. {page} de {pages}
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= pages}
                        className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Próxima página"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    )
}

interface DraggableCardProps {
    item: OportunidadeKanban
    onViewDetails: (item: OportunidadeKanban) => void
    onStatusChange: (item: OportunidadeKanban, newStatus: string) => Promise<void>
    getAvailableActions: (currentStatus: string) => { label: string; value: string }[]
    onStartContact?: (item: OportunidadeKanban) => void
    onSendEmail?: (item: OportunidadeKanban) => void
    onEdit?: (item: OportunidadeKanban) => void
    onDelete?: (item: OportunidadeKanban) => void
    onTransformarCliente?: (item: OportunidadeKanban) => void
    onCreatePedido?: (item: OportunidadeKanban) => void
    updatingId: string | null
}

function DraggableCard({
    item,
    onViewDetails,
    onStatusChange,
    getAvailableActions,
    onStartContact,
    onSendEmail,
    onEdit,
    onDelete,
    onTransformarCliente,
    onCreatePedido,
    updatingId,
}: DraggableCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: CARD_ID_PREFIX + item.id,
        data: { item, status: item.status },
    })

    const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'opacity-50' : ''}
        >
            <KanbanCard
                item={item}
                onViewDetails={onViewDetails}
                onStatusChange={onStatusChange}
                getAvailableActions={getAvailableActions}
                onStartContact={onStartContact}
                onSendEmail={onSendEmail}
                onEdit={onEdit}
                onDelete={onDelete}
                onTransformarCliente={onTransformarCliente}
                onCreatePedido={onCreatePedido}
                updatingId={updatingId}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    )
}

interface KanbanCardProps {
    item: OportunidadeKanban
    onViewDetails: (item: OportunidadeKanban) => void
    onStatusChange: (item: OportunidadeKanban, newStatus: string) => Promise<void>
    getAvailableActions: (currentStatus: string) => { label: string; value: string }[]
    onStartContact?: (item: OportunidadeKanban) => void
    onSendEmail?: (item: OportunidadeKanban) => void
    onEdit?: (item: OportunidadeKanban) => void
    onDelete?: (item: OportunidadeKanban) => void
    onTransformarCliente?: (item: OportunidadeKanban) => void
    onCreatePedido?: (item: OportunidadeKanban) => void
    updatingId: string | null
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

function KanbanCard({
    item,
    onViewDetails,
    onStatusChange,
    getAvailableActions,
    onStartContact,
    onSendEmail,
    onEdit,
    onDelete,
    onTransformarCliente,
    onCreatePedido,
    updatingId,
    dragHandleProps,
}: KanbanCardProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
    const menuRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const hasValidPhone = item.cliente.telefone && item.cliente.telefone.replace(/\D/g, '').length > 0
    const showWhatsApp = hasValidPhone && onStartContact

    const showEmail =
        item.cliente.email && onSendEmail

    const nextStatus = getNextStatus(item.status)
    const prevStatus = getPrevStatus(item.status)

    useEffect(() => {
        if (menuOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const menuW = 200
            const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8))
            const top = Math.min(rect.bottom + 4, window.innerHeight - 200)
            setMenuPos({ top, left })
        }
    }, [menuOpen])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (menuRef.current && !menuRef.current.contains(target) && triggerRef.current && !triggerRef.current.contains(target)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [menuOpen])

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 shadow-xs hover:shadow-sm transition-shadow ${dragHandleProps ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
            {...(dragHandleProps ?? {})}
        >
            <div className="flex items-center gap-1.5 min-h-0">
                {dragHandleProps && (
                    <div className="flex-shrink-0 p-0.5 rounded text-gray-400" title="Arrastar para mover">
                        <Menu size={14} />
                    </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden" title={`${item.cliente.nome}${item.cliente.empresa ? ` · ${item.cliente.empresa}` : ''}${item.titulo ? ` · ${item.titulo}` : ''}${item.valor != null && item.valor > 0 ? ` · ${formatCurrency(item.valor)}` : ''}`}>
                    <p className="text-sm truncate">
                        <span className="font-medium text-gray-900 dark:text-white">{item.cliente.nome}</span>
                        {item.cliente.empresa && (
                            <span className="text-gray-500 dark:text-gray-400"> · {item.cliente.empresa}</span>
                        )}
                        {item.titulo && (
                            <span className="text-gray-500 dark:text-gray-400"> · {item.titulo}</span>
                        )}
                        {item.valor != null && item.valor > 0 && (
                            <span className="font-semibold text-purple-600 dark:text-purple-400"> · {formatCurrency(item.valor)}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                        {showWhatsApp && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onStartContact?.(item)
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                disabled={updatingId === item.id}
                                className="inline-flex items-center px-2 py-1 border border-emerald-300 dark:border-emerald-600 text-xs font-medium rounded text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800 disabled:opacity-50"
                                title="Enviar WhatsApp"
                            >
                                <MessageCircle size={12} className="mr-0.5" />
                                WhatsApp
                            </button>
                        )}
                        {showEmail && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSendEmail?.(item)
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                disabled={updatingId === item.id}
                                className="inline-flex items-center px-2 py-1 border border-sky-300 dark:border-sky-600 text-xs font-medium rounded text-sky-700 dark:text-sky-200 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-800 disabled:opacity-50"
                                title="Enviar email"
                            >
                                <Mail size={12} className="mr-0.5" />
                                Email
                            </button>
                        )}
                        <div className="relative inline-block">
                            <button
                                ref={triggerRef}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen((o) => !o)
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                                title="Ações"
                                aria-label="Ações"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {menuOpen && typeof document !== 'undefined' && createPortal(
                                <div
                                    ref={menuRef}
                                    className="fixed z-[9999] w-52 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
                                    style={{ top: menuPos.top, left: menuPos.left }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onDelete(item)
                                                setMenuOpen(false)
                                            }}
                                            className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 active:bg-red-100 dark:active:bg-red-900/40"
                                        >
                                            <Trash2 size={12} />
                                            Excluir
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onEdit(item)
                                                setMenuOpen(false)
                                            }}
                                            className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                                        >
                                            <Edit2 size={12} />
                                            Editar
                                        </button>
                                    )}
                                    {item.type === 'prospecto' && onTransformarCliente && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onTransformarCliente(item)
                                                setMenuOpen(false)
                                            }}
                                            disabled={updatingId === item.id}
                                            className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 disabled:opacity-50"
                                        >
                                            <UserPlus size={12} />
                                            Transformar em cliente
                                        </button>
                                    )}
                                    {onCreatePedido && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCreatePedido(item)
                                                setMenuOpen(false)
                                            }}
                                            disabled={updatingId === item.id}
                                            className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 disabled:opacity-50"
                                        >
                                            <ShoppingCart size={12} />
                                            Criar pedido
                                        </button>
                                    )}
                                    {prevStatus && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void onStatusChange(item, prevStatus)
                                                setMenuOpen(false)
                                            }}
                                            disabled={updatingId === item.id}
                                            className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 disabled:opacity-50"
                                        >
                                            <ChevronLeft size={12} />
                                            Voltar etapa
                                        </button>
                                    )}
                                    {nextStatus && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void onStatusChange(item, nextStatus)
                                                setMenuOpen(false)
                                            }}
                                            disabled={updatingId === item.id}
                                            className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 disabled:opacity-50"
                                        >
                                            <ChevronRight size={12} />
                                            Avançar etapa
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onViewDetails(item)
                                            setMenuOpen(false)
                                        }}
                                        className="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
                                    >
                                        <Eye size={12} />
                                        Ver detalhes
                                    </button>
                                </div>,
                                document.body
                            )}
                        </div>
                </div>
            </div>
        </div>
    )
}

function KanbanCardContent({
    item,
}: {
    item: OportunidadeKanban
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-300 dark:border-purple-600 px-3 py-2.5 shadow-lg cursor-grabbing opacity-95 min-w-[220px]">
            <div className="flex items-center gap-1.5">
                <div className="flex-shrink-0 p-0.5 rounded text-gray-400">
                    <Menu size={14} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm truncate">
                        <span className="font-medium text-gray-900 dark:text-white">{item.cliente.nome}</span>
                        {item.cliente.empresa && (
                            <span className="text-gray-500 dark:text-gray-400"> · {item.cliente.empresa}</span>
                        )}
                        {item.titulo && (
                            <span className="text-gray-500 dark:text-gray-400"> · {item.titulo}</span>
                        )}
                        {item.valor != null && item.valor > 0 && (
                            <span className="font-semibold text-purple-600 dark:text-purple-400"> · {formatCurrency(item.valor)}</span>
                        )}
                    </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Solte para mover</span>
            </div>
        </div>
    )
}
