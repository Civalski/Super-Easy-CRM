'use client'

import { useState } from 'react'
import { Button } from '@/components/common'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function SeedPage() {
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

  const handleSeed = async () => {
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Popular Banco de Dados com Dados Fake
          </h1>

          <p className="text-gray-600 mb-6">
            Esta ferramenta cria dados fake de clientes, oportunidades, contatos, tarefas e ambientes
            para você testar as funcionalidades do CRM.
          </p>

          <Button
            onClick={handleSeed}
            disabled={loading}
            className="w-full mb-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando dados...
              </>
            ) : (
              'Criar Dados Fake'
            )}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg ${result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
                }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'
                      }`}
                  >
                    {result.success ? 'Sucesso!' : 'Erro'}
                  </h3>
                  {result.success ? (
                    <>
                      <p className="text-green-800 mb-3">{result.message}</p>
                      {result.resumo && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-green-900">Resumo:</h4>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• {result.resumo.ambientes} ambientes</li>
                            <li>• {result.resumo.clientes} clientes</li>
                            <li>• {result.resumo.contatos} contatos</li>
                            <li>• {result.resumo.oportunidades} oportunidades</li>
                            <li>• {result.resumo.tarefas} tarefas</li>
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-800">{result.error || 'Erro ao criar dados'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Dados que serão criados:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 4 ambientes (Vendas, Marketing, Suporte, Parcerias)</li>
              <li>• 10 clientes com informações completas</li>
              <li>• 7 contatos relacionados aos clientes</li>
              <li>• 20 oportunidades em diferentes status do pipeline</li>
              <li>• 25 tarefas com diferentes prioridades e status</li>
            </ul>
            <p className="text-xs text-blue-700 mt-3">
              <strong>Nota:</strong> Se os dados já existirem (mesmo email para clientes, mesmo nome
              para ambientes), eles não serão duplicados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

