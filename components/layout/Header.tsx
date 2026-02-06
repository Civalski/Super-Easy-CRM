/**
 * Componente Header do CRM
 * 
 * Refatorado para usar:
 * - useGlobalSearch: Hook para lógica de busca
 * - SearchResultsDropdown: Dropdown de resultados
 * - NotificationDropdown: Dropdown de notificações
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { SearchResultsDropdown } from './SearchResultsDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import TaskNotificationModal from '@/components/features/tarefas/TaskNotificationModal';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const buscaRef = useRef<HTMLDivElement>(null);
  const notificacaoRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Estados para notificações
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

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

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await fetch('/api/notificacoes');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      // Polling de 5 minutos (opcional/turbo)
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      // Fechar busca
      if (buscaRef.current && !buscaRef.current.contains(event.target as Node)) {
        fecharResultados();
      }

      // Fechar notificações
      if (notificacaoRef.current && !notificacaoRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
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

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'U';
  const userName = session?.user?.name || 'Usuário';
  const userEmail = session?.user?.email;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Recarregar ao abrir para garantir dados frescos
      fetchNotifications();
    }
  };

  // Limpar todas notificações
  const handleClearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notificacoes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  // Dispensar notificação individual
  const handleDismissNotification = async (id: string) => {
    // Improve UX by removing immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch('/api/notificacoes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error('Erro ao dispensar notificação:', error);
      // Revert if error? Maybe overkill for this specific feature.
    }
  };

  return (
    <header className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 gap-4 min-h-[var(--top-bar-height)] border-b border-gray-200 dark:border-gray-700">
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
          <div ref={notificacaoRef} className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                isLoading={isLoadingNotifications}
                onClose={() => setShowNotifications(false)}
                onSelect={(n) => setSelectedNotification(n)}
                onClearAll={handleClearAllNotifications}
                onDismiss={handleDismissNotification}
              />
            )}
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">{userInitial}</span>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <TaskNotificationModal
        isOpen={!!selectedNotification}
        task={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onUpdate={fetchNotifications}
      />
    </header>
  );
}
