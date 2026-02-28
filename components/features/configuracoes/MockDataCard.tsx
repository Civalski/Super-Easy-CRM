/**
 * Card para geração de dados mockados
 */
'use client'

import { useState } from 'react'
import { Database, Loader2, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { Button } from '@/components/common'
import { SeedResultCard } from './SeedResultCard'
import type { SeedResult } from './ConfiguracoesTypes'

export function MockDataCard() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SeedResult | null>(null)
    const [clearing, setClearing] = useState(false)

    const handleGenerateMockData = async () => {
        setLoading(true)
        setResult(null)

        try {
            const response = await fetch('/api/seed', {
                method: 'POST',
            })

            const data = await response.json()
            setResult(data)
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClearData = async () => {
        const isDark = document.documentElement.classList.contains('dark')
        const confirmacao = await Swal.fire({
            title: 'Excluir todos os dados?',
            text: 'Esta acao remove clientes, contatos, oportunidades, tarefas, prospectos e metas da sua conta. Usuarios nao serao apagados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f3f4f6' : '#111827',
        })

        if (!confirmacao.isConfirmed) return

        setClearing(true)
        try {
            const response = await fetch('/api/users/me/data', {
                method: 'DELETE',
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir dados')
            }

            setResult(null)

            await Swal.fire({
                title: 'Dados excluidos!',
                text: data.message || 'Os dados da sua conta foram excluidos com sucesso.',
                icon: 'success',
                confirmButtonColor: '#10b981',
                background: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
            })
        } catch (error) {
            await Swal.fire({
                title: 'Erro ao excluir',
                text: error instanceof Error ? error.message : 'Erro desconhecido',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                background: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#f3f4f6' : '#111827',
            })
        } finally {
            setClearing(false)
        }
    }

    const isBusy = loading || clearing

    return (
        <div className="crm-card p-6">
            <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Dados de Teste
                </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Gere dados mockados atualizados de clientes, oportunidades, contatos e tarefas
                para testar as funcionalidades do CRM.
            </p>

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Dados que serão criados:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• 10 clientes com informações completas</li>
                    <li>• 7 contatos relacionados aos clientes</li>
                    <li>• 20 oportunidades em diferentes status do pipeline</li>
                    <li>• 25 tarefas com diferentes prioridades e status</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                    <strong>Nota:</strong> Se os dados já existirem (mesmo email para clientes), eles não serão duplicados.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={handleGenerateMockData}
                    disabled={isBusy}
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando dados...
                        </>
                    ) : (
                        <>
                            <Database className="w-5 h-5 mr-2" />
                            Gerar Dados Mockados Atualizados
                        </>
                    )}
                </Button>

                <Button
                    onClick={handleClearData}
                    disabled={isBusy}
                    variant="danger"
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    {clearing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Excluindo dados...
                        </>
                    ) : (
                        <>
                            <Trash2 className="w-5 h-5 mr-2" />
                            Excluir Dados da Conta
                        </>
                    )}
                </Button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                A exclusao remove apenas os dados da sua conta. Outros usuarios nao sao afetados.
            </p>

            {result && <SeedResultCard result={result} />}
        </div>
    )
}
