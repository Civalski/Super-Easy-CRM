/**
 * Componente seletor de ambiente com CRUD integrado
 * 
 * Refatorado para usar:
 * - useAmbientes: Hook para lógica de CRUD
 * - AmbienteFormModal: Modal reutilizável para criar/editar
 * - DeleteConfirmModal: Modal de confirmação de exclusão
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import { useAmbientes, type Ambiente } from '@/lib/hooks/useAmbientes';
import { AmbienteFormModal, DeleteConfirmModal } from './AmbienteModals';

interface AmbienteSelectorProps {
  ambienteSelecionado: string | null;
  onAmbienteChange: (ambienteId: string | null) => void;
}

export default function AmbienteSelector({
  ambienteSelecionado,
  onAmbienteChange,
}: AmbienteSelectorProps) {
  // Hook de ambientes
  const {
    ambientes,
    loading,
    creating,
    editing,
    deleting,
    fetchAmbientes,
    createAmbiente,
    updateAmbiente,
    deleteAmbiente,
  } = useAmbientes(ambienteSelecionado, onAmbienteChange);

  // Estados de UI
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ambienteEditando, setAmbienteEditando] = useState<Ambiente | null>(null);
  const [ambienteExcluindo, setAmbienteExcluindo] = useState<Ambiente | null>(null);

  // Form states
  const [novoNome, setNovoNome] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar ambientes ao montar
  useEffect(() => {
    fetchAmbientes();
  }, [fetchAmbientes]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createAmbiente(novoNome, novoDescricao || null);
    if (result) {
      setNovoNome('');
      setNovoDescricao('');
      setShowCreateModal(false);
      setIsOpen(false);
    }
  };

  const handleEditClick = (ambiente: Ambiente, e: React.MouseEvent) => {
    e.stopPropagation();
    setAmbienteEditando(ambiente);
    setEditNome(ambiente.nome);
    setEditDescricao(ambiente.descricao || '');
    setShowEditModal(true);
    setIsOpen(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ambienteEditando) return;

    const result = await updateAmbiente(ambienteEditando.id, editNome, editDescricao || null);
    if (result) {
      setShowEditModal(false);
      setAmbienteEditando(null);
      setEditNome('');
      setEditDescricao('');
    }
  };

  const handleDeleteClick = (ambiente: Ambiente, e: React.MouseEvent) => {
    e.stopPropagation();
    setAmbienteExcluindo(ambiente);
    setShowDeleteConfirm(true);
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!ambienteExcluindo) return;

    const success = await deleteAmbiente(ambienteExcluindo.id);
    if (success) {
      setShowDeleteConfirm(false);
      setAmbienteExcluindo(null);
    }
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setNovoNome('');
    setNovoDescricao('');
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setAmbienteEditando(null);
    setEditNome('');
    setEditDescricao('');
  };

  const handleCloseDelete = () => {
    setShowDeleteConfirm(false);
    setAmbienteExcluindo(null);
  };

  const ambienteAtual = Array.isArray(ambientes)
    ? ambientes.find((a) => a.id === ambienteSelecionado)
    : undefined;

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
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
                  <div
                    key={ambiente.id}
                    className={`group flex items-center justify-between px-4 py-2 text-sm transition-colors ${ambienteSelecionado === ambiente.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onAmbienteChange(ambiente.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      {ambiente.nome}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(ambiente, e)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Editar ambiente"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(ambiente, e)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Excluir ambiente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
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

      {/* Modais */}
      <AmbienteFormModal
        isOpen={showCreateModal}
        title="Criar Novo Ambiente"
        nome={novoNome}
        descricao={novoDescricao}
        onNomeChange={setNovoNome}
        onDescricaoChange={setNovoDescricao}
        onSubmit={handleCreate}
        onClose={handleCloseCreate}
        isSubmitting={creating}
        submitLabel="Criar Ambiente"
        submittingLabel="Criando..."
      />

      <AmbienteFormModal
        isOpen={showEditModal && !!ambienteEditando}
        title="Editar Ambiente"
        nome={editNome}
        descricao={editDescricao}
        onNomeChange={setEditNome}
        onDescricaoChange={setEditDescricao}
        onSubmit={handleEdit}
        onClose={handleCloseEdit}
        isSubmitting={editing}
        submitLabel="Salvar Alterações"
        submittingLabel="Salvando..."
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm && !!ambienteExcluindo}
        itemName={ambienteExcluindo?.nome || ''}
        warningMessage="Esta ação não pode ser desfeita. Todas as oportunidades associadas a este ambiente também serão excluídas."
        onConfirm={handleDelete}
        onClose={handleCloseDelete}
        isDeleting={deleting}
      />
    </>
  );
}
