/**
 * Card para geração de dados mockados
 */
'use client'

import { useState } from 'react'
import { Database, Loader2 } from 'lucide-react'
import { Button } from '@/components/common'
import { SeedResultCard } from './SeedResultCard'
import type { SeedResult } from './ConfiguracoesTypes'

export function MockDataCard() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SeedResult | null>(null)

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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Dados de Teste
                </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Gere dados mockados de clientes, oportunidades, contatos, tarefas e ambientes
                para testar as funcionalidades do CRM.
            </p>

            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Dados que serão criados:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• 4 ambientes (Vendas, Marketing, Suporte, Parcerias)</li>
                    <li>• 10 clientes com informações completas</li>
                    <li>• 7 contatos relacionados aos clientes</li>
                    <li>• 20 oportunidades em diferentes status do pipeline</li>
                    <li>• 25 tarefas com diferentes prioridades e status</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                    <strong>Nota:</strong> Se os dados já existirem (mesmo email para clientes, mesmo nome
                    para ambientes), eles não serão duplicados.
                </p>
            </div>

            <Button
                onClick={handleGenerateMockData}
                disabled={loading}
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
                        Gerar Dados Mockados
                    </>
                )}
            </Button>

            {result && <SeedResultCard result={result} />}
        </div>
    )
}
