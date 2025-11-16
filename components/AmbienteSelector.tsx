'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import Button from './Button'

interface Ambiente {
  id: string
  nome: string
  descricao: string | null
}

interface AmbienteSelectorProps {
  ambienteSelecionado: string | null
  onAmbienteChange: (ambienteId: string | null) => void
}

export default function AmbienteSelector({
  ambienteSelecionado,
  onAmbienteChange,
}: AmbienteSelectorProps) {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [novoAmbienteNome, setNovoAmbienteNome] = useState('')
  const [novoAmbienteDescricao, setNovoAmbienteDescricao] = useState('')
  const [creating, setCreating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAmbientes()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const fetchAmbientes = async () => {
    try {
      const response = await fetch('/api/ambientes')
      const data = await response.json()
      setAmbientes(data)
      
      // Se não há ambiente selecionado e existem ambientes, seleciona o primeiro
      if (!ambienteSelecionado && data.length > 0) {
        onAmbienteChange(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar ambientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const ambienteAtual = ambientes.find((a) => a.id === ambienteSelecionado)

  const handleCreateAmbiente = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/ambientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: novoAmbienteNome,
          descricao: novoAmbienteDescricao || null,
        }),
      })

      if (response.ok) {
        const novoAmbiente = await response.json()
        setAmbientes([...ambientes, novoAmbiente])
        setNovoAmbienteNome('')
        setNovoAmbienteDescricao('')
        setShowCreateModal(false)
        setIsOpen(false)
        // Seleciona o novo ambiente automaticamente
        onAmbienteChange(novoAmbiente.id)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar ambiente')
      }
    } catch (error) {
      console.error('Erro ao criar ambiente:', error)
      alert('Erro ao criar ambiente. Tente novamente.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-w-[200px] justify-between"
        >
          <span className="truncate">
            {ambienteAtual ? ambienteAtual.nome : 'Selecione um ambiente'}
          </span>
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {ambientes.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Nenhum ambiente encontrado
              </div>
            ) : (
              <>
                {ambientes.map((ambiente) => (
                  <button
                    key={ambiente.id}
                    onClick={() => {
                      onAmbienteChange(ambiente.id)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      ambienteSelecionado === ambiente.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {ambiente.nome}
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setShowCreateModal(true)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Criar Novo Ambiente
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Criar Novo Ambiente
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNovoAmbienteNome('')
                  setNovoAmbienteDescricao('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAmbiente} className="space-y-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nome"
                  required
                  value={novoAmbienteNome}
                  onChange={(e) => setNovoAmbienteNome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Clientes de Produto X"
                />
              </div>

              <div>
                <label
                  htmlFor="descricao"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  rows={3}
                  value={novoAmbienteDescricao}
                  onChange={(e) => setNovoAmbienteDescricao(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição do ambiente (opcional)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNovoAmbienteNome('')
                    setNovoAmbienteDescricao('')
                  }}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Ambiente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

