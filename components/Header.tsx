'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Menu, User, Briefcase, X } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

interface BuscaResultado {
  clientes: Array<{
    id: string
    nome: string
    email: string | null
    empresa: string | null
  }>
  oportunidades: Array<{
    id: string
    titulo: string
    cliente: {
      nome: string
    }
  }>
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<BuscaResultado | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const buscaRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(event.target as Node)) {
        setMostrarResultados(false)
      }
    }

    document.addEventListener('mousedown', handleClickFora)
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
    }
  }, [])

  useEffect(() => {
    const buscar = async () => {
      if (busca.trim().length < 2) {
        setResultados(null)
        setMostrarResultados(false)
        return
      }

      setCarregando(true)
      try {
        const response = await fetch(`/api/busca?q=${encodeURIComponent(busca)}`)
        const data = await response.json()

        // Garantir que clientes e oportunidades sejam sempre arrays
        const resultadosValidados: BuscaResultado = {
          clientes: Array.isArray(data.clientes) ? data.clientes : [],
          oportunidades: Array.isArray(data.oportunidades) ? data.oportunidades : [],
        }

        setResultados(resultadosValidados)
        setMostrarResultados(true)
      } catch (error) {
        console.error('Erro ao buscar:', error)
        setResultados({ clientes: [], oportunidades: [] })
      } finally {
        setCarregando(false)
      }
    }

    const timeoutId = setTimeout(buscar, 300)
    return () => clearTimeout(timeoutId)
  }, [busca])

  const handleClienteClick = (id: string) => {
    router.push(`/clientes/${id}`)
    setBusca('')
    setMostrarResultados(false)
  }

  const handleOportunidadeClick = (id: string) => {
    router.push('/oportunidades')
    setBusca('')
    setMostrarResultados(false)
  }

  const totalResultados = (resultados?.clientes.length || 0) + (resultados?.oportunidades.length || 0)

  return (
    <header className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 gap-4 min-h-[var(--top-bar-height)]">
        {/* Seção Esquerda - Menu Mobile */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Seção Central - Barra de Pesquisa */}
        <div className="flex-1 flex justify-center px-4">
          <div ref={buscaRef} className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar clientes, oportunidades..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => {
                if (resultados && totalResultados > 0) {
                  setMostrarResultados(true)
                }
              }}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {busca && (
              <button
                onClick={() => {
                  setBusca('')
                  setResultados(null)
                  setMostrarResultados(false)
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            )}

            {mostrarResultados && busca.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {carregando ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Buscando...
                  </div>
                ) : totalResultados === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum resultado encontrado
                  </div>
                ) : (
                  <>
                    {resultados?.clientes && resultados.clientes.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            Clientes ({resultados.clientes.length})
                          </h3>
                        </div>
                        {resultados.clientes.map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => handleClienteClick(cliente.id)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                <User size={16} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {cliente.nome}
                                </div>
                                {cliente.empresa && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {cliente.empresa}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {resultados?.oportunidades && resultados.oportunidades.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            Oportunidades ({resultados.oportunidades.length})
                          </h3>
                        </div>
                        {resultados.oportunidades.map((oportunidade) => (
                          <button
                            key={oportunidade.id}
                            onClick={() => handleOportunidadeClick(oportunidade.id)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                                <Briefcase size={16} className="text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {oportunidade.titulo}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {oportunidade.cliente.nome}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seção Direita - Notificações e Usuário */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
            <span className="text-sm font-semibold text-white">U</span>
          </div>
        </div>
      </div>
    </header>
  )
}

