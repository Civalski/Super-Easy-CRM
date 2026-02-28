'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Check, Loader2, ChevronDown } from 'lucide-react'

export interface AsyncSelectOption {
    id: string
    nome: string
    subtitulo?: string
    tipo: 'cliente' | 'prospecto' | 'outro'
    original?: unknown
}

interface AsyncSelectProps {
    label?: string
    placeholder?: string
    value?: string | null
    initialLabel?: string
    onChange: (option: AsyncSelectOption | null) => void
    fetchUrl: string
    className?: string
    disabled?: boolean
    required?: boolean
    id?: string
    name?: string
}

export default function AsyncSelect({
    label,
    placeholder = 'Buscar...',
    value,
    initialLabel,
    onChange,
    fetchUrl,
    className = '',
    disabled = false,
    required = false,
    id,
    name,
}: AsyncSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [options, setOptions] = useState<AsyncSelectOption[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedLabel, setSelectedLabel] = useState(initialLabel || '')

    const wrapperRef = useRef<HTMLDivElement>(null)

    // Update internal label if initialLabel changes
    useEffect(() => {
        if (initialLabel) {
            setSelectedLabel(initialLabel)
        }
    }, [initialLabel])

    // Pre-load default options on open
    useEffect(() => {
        if (isOpen && query.length === 0 && options.length === 0) {
            const controller = new AbortController()
            setLoading(true)
            fetch(fetchUrl, { signal: controller.signal })
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    if (Array.isArray(data)) {
                        setOptions(data)
                    }
                })
                .catch(err => {
                    if (!controller.signal.aborted) {
                        console.error('Error fetching default options:', err)
                    }
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setLoading(false)
                    }
                })

            return () => controller.abort()
        }
    }, [isOpen, query, fetchUrl, options.length])

    // Debounce search
    useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true)
                try {
                    const res = await fetch(`${fetchUrl}?q=${encodeURIComponent(query)}`, {
                        signal: controller.signal,
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setOptions(Array.isArray(data) ? data : [])
                    } else {
                        console.error('Failed to fetch options')
                        setOptions([])
                    }
                } catch (err) {
                    if (!controller.signal.aborted) {
                        console.error('Error fetching options:', err)
                        setOptions([])
                    }
                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false)
                    }
                }
            } else if (query.trim().length === 0 && isOpen) {
                // If query cleared, fetch defaults again?
                // The previous effect handles "on open", but if I type then backspace to empty...
                setLoading(true)
                fetch(fetchUrl, { signal: controller.signal })
                    .then(res => res.ok ? res.json() : [])
                    .then(data => {
                        if (Array.isArray(data)) {
                            setOptions(data)
                        }
                    })
                    .catch(err => {
                        if (!controller.signal.aborted) {
                            console.error('Error fetching default options:', err)
                        }
                    })
                    .finally(() => {
                        if (!controller.signal.aborted) {
                            setLoading(false)
                        }
                    })
            }
        }, 500)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [query, fetchUrl, isOpen])

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleSelect = (option: AsyncSelectOption) => {
        onChange(option)
        setSelectedLabel(option.nome)
        setIsOpen(false)
        setQuery('') // Clear query after selection? Or keep it? Clearing is standard for combobox.
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
        setSelectedLabel('')
        setQuery('')
    }

    return (
        <div className={`relative min-w-0 ${className}`} ref={wrapperRef}>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                className={`
          relative w-full border rounded-lg bg-white dark:bg-gray-700 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'cursor-text hover:border-gray-400 dark:hover:border-gray-500'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 dark:border-gray-600'}
        `}
                onClick={() => !disabled && setIsOpen(true)}
            >
                <div className="flex min-w-0 items-center px-4 py-2 min-h-[42px]">
                    {/* Search Icon */}
                    <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />

                    {/* Input Area */}
                    <div className="relative min-w-0 flex-1">
                        {/* If we have a value and query is empty, allow showing the label but make it look like an input value.
                 Actually, typical pattern:
                 If isOpen: show Input.
                 If !isOpen and value: show Label.
                 We want to allow typing to search.
             */}

                        {isOpen ? (
                            <input
                                type="text"
                                className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 p-0"
                                placeholder={placeholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                                disabled={disabled}
                            />
                        ) : (
                            <div className={`w-full truncate ${!value ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {value ? selectedLabel : placeholder}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                        {value && !disabled && (
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                onClick={handleClear}
                            >
                                <X size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            className="text-gray-400"
                            disabled={disabled}
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 crm-card shadow-lg max-h-60 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                            <Loader2 size={20} className="animate-spin mr-2" />
                            Buscando...
                        </div>
                    )}

                    {!loading && options.length === 0 && query.length >= 2 && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            Nenhum resultado encontrado.
                        </div>
                    )}

                    {/* Show "Type 2 chars" message ONLY if we have NO options (no preloaded ones) AND short query */}
                    {!loading && options.length === 0 && query.length < 2 && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Digite pelo menos 2 caracteres para buscar.
                        </div>
                    )}

                    {!loading && options.length > 0 && (
                        <ul className="py-1">
                            {options.map((option) => (
                                <li
                                    key={`${option.tipo}-${option.id}`}
                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelect(option)
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white flex items-center">
                                                {option.nome}
                                                {option.id === value && <Check size={14} className="ml-2 text-blue-500" />}
                                            </div>
                                            {option.subtitulo && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {option.subtitulo}
                                                </div>
                                            )}
                                        </div>
                                        {option.tipo === 'prospecto' && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                                Lead
                                            </span>
                                        )}
                                        {option.tipo === 'cliente' && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                                Cliente
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {/* Hidden input for form submission if name is provided (though usually state handling is enough) */}
            {name && <input type="hidden" name={name} value={value || ''} />}
        </div>
    )
}
