'use client'

import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, X, Check } from 'lucide-react'

interface EstadoCidadeSelectorProps {
    onSelectionChange?: (estado: string | null, cidades: string[]) => void
    className?: string
}

const ESTADOS = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'AP', nome: 'Amapá' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'PA', nome: 'Pará' },
    { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piauí' },
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RO', nome: 'Rondônia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'TO', nome: 'Tocantins' },
]

export default function EstadoCidadeSelector({
    onSelectionChange,
    className = '',
}: EstadoCidadeSelectorProps) {
    const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null)
    const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([])
    const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([])
    const [mostrarDropdownEstado, setMostrarDropdownEstado] = useState(false)
    const [mostrarDropdownCidade, setMostrarDropdownCidade] = useState(false)
    const [buscaCidade, setBuscaCidade] = useState('')
    const [carregandoCidades, setCarregandoCidades] = useState(false)

    // Carregar cidades quando o estado for selecionado
    useEffect(() => {
        if (estadoSelecionado) {
            carregarCidades(estadoSelecionado)
        } else {
            setCidadesDisponiveis([])
            setCidadesSelecionadas([])
        }
    }, [estadoSelecionado])

    // Notificar mudanças
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(estadoSelecionado, cidadesSelecionadas)
        }
    }, [estadoSelecionado, cidadesSelecionadas, onSelectionChange])

    const carregarCidades = async (uf: string) => {
        setCarregandoCidades(true)
        try {
            const response = await fetch(`/api/cidades/${uf}`)

            if (!response.ok) {
                throw new Error('Erro ao carregar cidades')
            }

            const cidades = await response.json()

            // Garantir que cidades seja um array
            if (Array.isArray(cidades)) {
                setCidadesDisponiveis(cidades)
            } else {
                console.error('API retornou dados em formato inesperado:', cidades)
                setCidadesDisponiveis([])
            }
        } catch (error) {
            console.error('Erro ao carregar cidades:', error)
            setCidadesDisponiveis([])
        } finally {
            setCarregandoCidades(false)
        }
    }

    const handleEstadoSelect = (uf: string) => {
        setEstadoSelecionado(uf)
        setMostrarDropdownEstado(false)
        setCidadesSelecionadas([])
    }

    const handleCidadeToggle = (cidade: string) => {
        setCidadesSelecionadas((prev) =>
            prev.includes(cidade)
                ? prev.filter((c) => c !== cidade)
                : [...prev, cidade]
        )
    }

    const handleRemoverCidade = (cidade: string) => {
        setCidadesSelecionadas((prev) => prev.filter((c) => c !== cidade))
    }

    const limparSelecao = () => {
        setEstadoSelecionado(null)
        setCidadesSelecionadas([])
        setCidadesDisponiveis([])
    }

    const cidadesFiltradas = cidadesDisponiveis.filter((cidade) =>
        cidade.toLowerCase().includes(buscaCidade.toLowerCase())
    )

    const estadoNome = ESTADOS.find((e) => e.uf === estadoSelecionado)?.nome

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Seletor de Estado */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMostrarDropdownEstado(!mostrarDropdownEstado)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-gray-400" />
                            <span className={estadoSelecionado ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                                {estadoSelecionado ? `${estadoSelecionado} - ${estadoNome}` : 'Selecione um estado'}
                            </span>
                        </div>
                        <ChevronDown
                            size={20}
                            className={`text-gray-400 transition-transform ${mostrarDropdownEstado ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {mostrarDropdownEstado && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {ESTADOS.map((estado) => (
                                <button
                                    key={estado.uf}
                                    type="button"
                                    onClick={() => handleEstadoSelect(estado.uf)}
                                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${estadoSelecionado === estado.uf
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-white'
                                        }`}
                                >
                                    <span className="font-medium">{estado.uf}</span> - {estado.nome}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Seletor de Cidades */}
            {estadoSelecionado && (
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cidades
                    </label>

                    {/* Cidades Selecionadas */}
                    {cidadesSelecionadas.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {cidadesSelecionadas.map((cidade) => (
                                <div
                                    key={cidade}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                                >
                                    <span>{cidade}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoverCidade(cidade)}
                                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMostrarDropdownCidade(!mostrarDropdownCidade)}
                            disabled={carregandoCidades}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-gray-400">
                                {carregandoCidades
                                    ? 'Carregando cidades...'
                                    : cidadesSelecionadas.length > 0
                                        ? `${cidadesSelecionadas.length} cidade(s) selecionada(s)`
                                        : 'Selecione as cidades'}
                            </span>
                            <ChevronDown
                                size={20}
                                className={`text-gray-400 transition-transform ${mostrarDropdownCidade ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {mostrarDropdownCidade && !carregandoCidades && (
                            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                {/* Campo de busca */}
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                    <input
                                        type="text"
                                        placeholder="Buscar cidade..."
                                        value={buscaCidade}
                                        onChange={(e) => setBuscaCidade(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>

                                {/* Lista de cidades */}
                                <div className="max-h-60 overflow-y-auto">
                                    {cidadesFiltradas.length > 0 ? (
                                        cidadesFiltradas.map((cidade) => {
                                            const isSelected = cidadesSelecionadas.includes(cidade)
                                            return (
                                                <button
                                                    key={cidade}
                                                    type="button"
                                                    onClick={() => handleCidadeToggle(cidade)}
                                                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'text-gray-900 dark:text-white'
                                                        }`}
                                                >
                                                    <span>{cidade}</span>
                                                    {isSelected && <Check size={18} />}
                                                </button>
                                            )
                                        })
                                    ) : (
                                        <div className="px-4 py-8 text-center text-gray-400">
                                            Nenhuma cidade encontrada
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {cidadesSelecionadas.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {cidadesSelecionadas.length} cidade(s) selecionada(s)
                        </div>
                    )}
                </div>
            )}

            {/* Botão Limpar */}
            {estadoSelecionado && (
                <button
                    type="button"
                    onClick={limparSelecao}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                    Limpar seleção
                </button>
            )}
        </div>
    )
}
