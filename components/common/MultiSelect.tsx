'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';

export interface MultiSelectOption {
    label: string;
    value: string;
    description?: string;
    badge?: string;
    group?: string;
}


interface MultiSelectProps {
    label: string;
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    loading?: boolean;
    disabled?: boolean;
    maxHeight?: string;
}

export function MultiSelect({
    label,
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    searchPlaceholder = 'Buscar...',
    loading = false,
    disabled = false,
    maxHeight = 'max-h-96'
}: MultiSelectProps) {

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrar opções
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(option =>
            option.label.toLowerCase().includes(lowerTerm) ||
            option.value.toLowerCase().includes(lowerTerm) ||
            (option.description && option.description.toLowerCase().includes(lowerTerm))
        );
    }, [options, searchTerm]);

    // Opções selecionadas com detalhes
    const selectedOptions = useMemo(() => {
        return options.filter(opt => value.includes(opt.value));
    }, [options, value]);

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const removeOption = (optionValue: string) => {
        onChange(value.filter(v => v !== optionValue));
    };

    const clearSelection = () => {
        onChange([]);
    };

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full px-4 py-3 text-left crm-card-soft transition-colors flex items-center justify-between
                        ${disabled
                            ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-70'
                            : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400'
                        }
                    `}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                        <span className={`truncate ${value.length === 0 ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {value.length > 0
                                ? `${value.length} selecionado${value.length > 1 ? 's' : ''}`
                                : placeholder
                            }
                        </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-2 crm-card overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {/* Campo de Busca */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Lista de Opções */}
                        <div className={`overflow-y-auto ${maxHeight}`}>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => {
                                    const isSelected = value.includes(option.value);
                                    const showGroupHeader = option.group && (index === 0 || filteredOptions[index - 1].group !== option.group);

                                    return (
                                        <div key={option.value}>
                                            {showGroupHeader && (
                                                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900/80 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm border-y border-gray-200 dark:border-gray-800 first:border-t-0">
                                                    {option.group}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => toggleOption(option.value)}
                                                className={`w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 flex items-start gap-3
                                                    ${isSelected ? 'bg-purple-50 dark:bg-purple-900/10' : ''}
                                                `}
                                            >
                                                <div className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors
                                                    ${isSelected
                                                        ? 'bg-purple-600 border-purple-600'
                                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400'
                                                    }
                                                `}>
                                                    {isSelected && <Check className="text-white w-3 h-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>
                                                            {option.label}
                                                        </span>
                                                        {option.badge && (
                                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                                                {option.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {option.description && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                            {option.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <p className="text-sm">Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de Selecionados (Pills) */}
            {selectedOptions.length > 0 && (
                <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                            {selectedOptions.length} selecionado(s)
                        </span>
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                        >
                            Limpar tudo
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                        {selectedOptions.map((option) => (
                            <div
                                key={option.value}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg group animate-in zoom-in-95 duration-200"
                            >
                                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                    {option.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeOption(option.value)}
                                    className="p-0.5 text-purple-400 hover:text-red-500 dark:text-purple-400 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-black/20 rounded-full transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                    <span className="sr-only">Remover {option.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
