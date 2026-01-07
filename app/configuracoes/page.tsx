'use client'

import { useState } from 'react'
import { Settings, Database, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/Button'

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    resumo?: {
      ambientes: number
      clientes: number
      contatos: number
      oportunidades: number
      tarefas: number
    }
    error?: string
  } | null>(null)

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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure as preferências do sistema
        </p>
      </div>

      <div className="space-y-6">
        {/* Seção de Dados Mockados */}
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

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-2 ${
                      result.success
                        ? 'text-green-900 dark:text-green-300'
                        : 'text-red-900 dark:text-red-300'
                    }`}
                  >
                    {result.success ? 'Sucesso!' : 'Erro'}
                  </h3>
                  {result.success ? (
                    <>
                      <p className="text-green-800 dark:text-green-200 mb-3">
                        {result.message}
                      </p>
                      {result.resumo && (
                        <div className="mt-4">
                          <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
                            Resumo dos dados criados:
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                              <div className="font-semibold text-green-900 dark:text-green-300">
                                {result.resumo.ambientes}
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-400">
                                Ambientes
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                              <div className="font-semibold text-green-900 dark:text-green-300">
                                {result.resumo.clientes}
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-400">
                                Clientes
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                              <div className="font-semibold text-green-900 dark:text-green-300">
                                {result.resumo.contatos}
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-400">
                                Contatos
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                              <div className="font-semibold text-green-900 dark:text-green-300">
                                {result.resumo.oportunidades}
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-400">
                                Oportunidades
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded">
                              <div className="font-semibold text-green-900 dark:text-green-300">
                                {result.resumo.tarefas}
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-400">
                                Tarefas
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-800 dark:text-red-200">
                      {result.error || 'Erro ao criar dados'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção de outras configurações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Outras configurações em desenvolvimento
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Mais funcionalidades de configuração estarão disponíveis em breve.
          </p>
        </div>
      </div>
    </div>
  )
}

