/**
 * Componente Header do CRM
 * 
 * Refatorado para usar:
 * - useGlobalSearch: Hook para lógica de busca
 * - SearchResultsDropdown: Dropdown de resultados
 */
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { SearchResultsDropdown } from './SearchResultsDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const buscaRef = useRef<HTMLDivElement>(null);

  const {
    busca,
    setBusca,
    resultados,
    mostrarResultados,
    carregando,
    totalResultados,
    limparBusca,
    fecharResultados,
    abrirResultados,
  } = useGlobalSearch();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(event.target as Node)) {
        fecharResultados();
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [fecharResultados]);

  const handleClienteClick = (id: string) => {
    router.push(`/clientes/${id}`);
    limparBusca();
  };

  const handleOportunidadeClick = (id: string) => {
    router.push('/oportunidades');
    limparBusca();
  };

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
              onFocus={abrirResultados}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {busca && (
              <button
                onClick={limparBusca}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            )}

            {mostrarResultados && busca.trim().length >= 2 && (
              <SearchResultsDropdown
                resultados={resultados}
                carregando={carregando}
                totalResultados={totalResultados}
                onClienteClick={handleClienteClick}
                onOportunidadeClick={handleOportunidadeClick}
              />
            )}
          </div>
        </div>

        {/* Seção Direita - Notificações e Usuário */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">U</span>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Usuário</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">usuario@email.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
