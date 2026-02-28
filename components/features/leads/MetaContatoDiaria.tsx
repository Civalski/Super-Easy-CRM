'use client'

import { useState, useEffect, useCallback } from 'react'
import { Target, AlertTriangle, CheckCircle2, X, Flame, Pencil, Save, Phone } from 'lucide-react'
import Swal from 'sweetalert2'

interface DebitDay {
    data: string
    meta: number
    feitos: number
    faltam: number
}

interface MetaContatoData {
    ativo: boolean
    metaDiaria: number
    contatosHoje: number
    progressoHoje: number
    debito: DebitDay[]
    debitoTotal: number
    hoje: string
}

function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
}

export default function MetaContatoDiaria() {
    const [data, setData] = useState<MetaContatoData | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)

    const fetchMeta = useCallback(async () => {
        try {
            const response = await fetch('/api/metas/contatos-diarios')
            if (response.ok) {
                const result = await response.json()
                setData(result)
                setEditValue(String(result.metaDiaria))
            }
        } catch (error) {
            console.error('Erro ao buscar meta de contatos:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMeta()
    }, [fetchMeta])

    const handleSaveMeta = async () => {
        const newValue = parseInt(editValue)
        if (!newValue || newValue < 1) {
            await Swal.fire({
                icon: 'error',
                title: 'Valor inválido',
                text: 'A meta deve ser um número maior que zero.',
                confirmButtonColor: '#6366f1',
                background: '#1f2937',
                color: '#f3f4f6',
            })
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/metas/contatos-diarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'atualizar_meta', metaDiaria: newValue }),
            })

            if (response.ok) {
                setEditing(false)
                await fetchMeta()
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Meta atualizada para ${newValue} contatos/dia`,
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: '#1f2937',
                    color: '#f3f4f6',
                })
            }
        } catch (error) {
            console.error('Erro ao atualizar meta:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDismissDay = async (dateStr: string) => {
        const result = await Swal.fire({
            title: 'Esquecer meta deste dia?',
            html: `<p style="color: #e5e7eb;">A meta do dia <strong>${formatDate(dateStr)}</strong> será ignorada.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Sim, esquecer',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f3f4f6',
        })

        if (result.isConfirmed) {
            try {
                await fetch('/api/metas/contatos-diarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'esquecer', data: dateStr }),
                })
                await fetchMeta()
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Meta do dia esquecida!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: '#1f2937',
                    color: '#f3f4f6',
                })
            } catch (error) {
                console.error('Erro ao esquecer meta:', error)
            }
        }
    }

    const handleDismissAll = async () => {
        const result = await Swal.fire({
            title: 'Esquecer todas as metas pendentes?',
            html: `<p style="color: #e5e7eb;">Todas as metas acumuladas dos dias anteriores serão ignoradas.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Sim, esquecer tudo',
            cancelButtonText: 'Cancelar',
            background: '#1f2937',
            color: '#f3f4f6',
        })

        if (result.isConfirmed) {
            try {
                await fetch('/api/metas/contatos-diarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'esquecer_todos' }),
                })
                await fetchMeta()
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Metas pendentes esquecidas!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: '#1f2937',
                    color: '#f3f4f6',
                })
            } catch (error) {
                console.error('Erro ao esquecer metas:', error)
            }
        }
    }

    if (loading) {
        return (
            <div className="crm-card p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
            </div>
        )
    }

    if (!data || !data.ativo) return null

    const metaHoje = data.metaDiaria
    const contatosHoje = data.contatosHoje
    const progressoHoje = data.progressoHoje
    const metaBatida = contatosHoje >= metaHoje
    const hasDebt = data.debito.length > 0

    // Progress bar color
    const progressColor = metaBatida
        ? 'bg-green-500'
        : progressoHoje >= 60
            ? 'bg-yellow-500'
            : 'bg-red-500'

    return (
        <div className="space-y-4">
            {/* Today's Progress Card */}
            <div className={`rounded-xl border p-5 shadow-sm transition-all ${metaBatida
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${metaBatida
                            ? 'bg-green-100 dark:bg-green-900/50'
                            : 'bg-purple-100 dark:bg-purple-900/50'
                            }`}>
                            {metaBatida ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Meta Diária de Contatos
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Contatos via &quot;Iniciar Contato&quot; na aba Leads
                            </p>
                        </div>
                    </div>

                    {/* Edit / Display target */}
                    <div className="flex items-center gap-3">
                        {editing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveMeta()
                                        if (e.key === 'Escape') {
                                            setEditing(false)
                                            setEditValue(String(metaHoje))
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSaveMeta}
                                    disabled={saving}
                                    className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50"
                                    title="Salvar meta"
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        setEditing(false)
                                        setEditValue(String(metaHoje))
                                    }}
                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Cancelar"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold ${metaBatida ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                        {contatosHoje}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ {metaHoje}</span>
                                </div>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Editar meta diária"
                                >
                                    <Pencil size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ease-out ${progressColor}`}
                        style={{ width: `${Math.min(100, progressoHoje)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {contatosHoje < metaHoje
                            ? `Faltam ${metaHoje - contatosHoje} contatos para bater a meta`
                            : `🎉 ${contatosHoje - metaHoje} contatos a mais que a meta!`
                        }
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{progressoHoje}%</span>
                </div>

                {metaBatida && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800">
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                            ✓ Meta batida! Parabéns pelo esforço! 🎯
                        </span>
                    </div>
                )}
            </div>

            {/* Debt Warning */}
            {hasDebt && (
                <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                    Metas pendentes de dias anteriores
                                </h3>
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Você tem <strong>{data.debitoTotal}</strong> contatos acumulados de {data.debito.length} dia{data.debito.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-3">
                        {data.debito.map((day) => (
                            <div
                                key={day.data}
                                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 border border-amber-200 dark:border-amber-800"
                            >
                                <div className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formatDate(day.data)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        ({day.feitos}/{day.meta} feitos)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        -{day.faltam} pendentes
                                    </span>
                                    <button
                                        onClick={() => handleDismissDay(day.data)}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                                    >
                                        Esquecer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleDismissAll}
                        className="w-full text-xs py-2.5 px-3 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors font-semibold"
                    >
                        Esquecer todas as metas pendentes
                    </button>
                </div>
            )}
        </div>
    )
}
