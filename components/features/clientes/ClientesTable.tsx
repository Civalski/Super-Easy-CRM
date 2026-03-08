/**
 * Tabela de listagem de clientes
 */
'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Briefcase,
  ClipboardList,
  Edit2,
  Eye,
  FileText,
  Hash,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
  MoreVertical,
  Building2,
  User,
  XCircle,
  CheckCircle2,
} from '@/lib/icons'
import { getEmailComposeUrl } from '@/lib/emailCompose'
import { ClienteDetalhesDrawer } from './ClienteDetalhesDrawer'
import type { Cliente } from './types'

interface ClientesTableProps {
  clientes: Cliente[]
  deletingId: string | null
  onDeleteClick: (cliente: Cliente) => void
  onEditClick?: (cliente: Cliente) => void
}

export function ClientesTable({ clientes, deletingId, onDeleteClick, onEditClick }: ClientesTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detalhesDrawerOpen, setDetalhesDrawerOpen] = useState(false)
  const [clienteParaDetalhes, setClienteParaDetalhes] = useState<Cliente | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  const handleVerDetalhes = (cliente: Cliente) => {
    setOpenMenuId(null)
    setClienteParaDetalhes(cliente)
    setDetalhesDrawerOpen(true)
  }

  useEffect(() => {
    if (!openMenuId || typeof document === 'undefined') return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuButtonRef.current?.contains(target)) return
      const menuEl = document.getElementById(`cliente-menu-${openMenuId}`)
      if (menuEl?.contains(target)) return
      setOpenMenuId(null)
    }

    const updatePosition = () => {
      const btn = document.querySelector(`[data-cliente-menu-btn="${openMenuId}"]`) as HTMLElement
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setMenuPosition({ top: rect.bottom + 4, left: rect.right - 224 })
      }
    }

    updatePosition()
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openMenuId])

  return (
    <div className="crm-card overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="crm-table-head">
          <tr>
            <th className="w-[8%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Hash size={14} />
                Código
              </span>
            </th>
            <th className="w-[20%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <User size={14} />
                Nome
              </span>
            </th>
            <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} />
                Telefone
              </span>
            </th>
            <th className="w-[22%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} />
                Email
              </span>
            </th>
            <th className="w-[16%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} />
                Empresa
              </span>
            </th>
            <th className="w-[6%] px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400" title="Orçamentos">
              <span className="inline-flex items-center justify-center gap-1">
                <FileText size={14} />
                Orç.
              </span>
            </th>
            <th className="w-[6%] px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400" title="Vendas">
              <span className="inline-flex items-center justify-center gap-1">
                <CheckCircle2 size={14} />
                Vend.
              </span>
            </th>
            <th className="w-[6%] px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400" title="Pedidos">
              <span className="inline-flex items-center justify-center gap-1">
                <ClipboardList size={14} />
                Ped.
              </span>
            </th>
            <th className="w-[6%] px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400" title="Cancelamentos">
              <span className="inline-flex items-center justify-center gap-1">
                <XCircle size={14} />
                Canc.
              </span>
            </th>
            <th className="w-[14%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5 justify-end">
                <MoreVertical size={14} />
                Ações
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {clientes.map((cliente) => {
            const cleanPhone = cliente.telefone?.replace(/\D/g, '') ?? ''
            const phoneWithCountry = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : ''
            return (
            <tr key={cliente.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {cliente.numero != null ? String(cliente.numero).padStart(5, '0') : '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="truncate text-base font-medium text-gray-900 dark:text-white" title={cliente.nome}>
                  {cliente.nome}
                </div>
              </td>

              <td className="px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {cliente.telefone ? (
                    <span className="truncate block" title={cliente.telefone}>{cliente.telefone}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </td>

              <td className="px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {cliente.email ? (
                    <span className="truncate block" title={cliente.email}>{cliente.email}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </td>

              <td className="px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {cliente.empresa ? (
                    <span className="truncate block" title={cliente.empresa}>{cliente.empresa}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </td>

              <td className="px-2 py-3 text-center">
                <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {cliente.orcamentos ?? 0}
                </span>
              </td>
              <td className="px-2 py-3 text-center">
                <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {cliente.vendas ?? 0}
                </span>
              </td>
              <td className="px-2 py-3 text-center">
                <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {cliente.pedidos ?? 0}
                </span>
              </td>
              <td className="px-2 py-3 text-center">
                <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
                  {cliente.cancelamentos ?? 0}
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <div className="relative flex justify-end">
                  <button
                    ref={openMenuId === cliente.id ? menuButtonRef : undefined}
                    data-cliente-menu-btn={cliente.id}
                    type="button"
                    onClick={() => setOpenMenuId((prev) => (prev === cliente.id ? null : cliente.id))}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    title="Ações"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === cliente.id && menuPosition && typeof document !== 'undefined' ? createPortal(
                    <div
                      id={`cliente-menu-${cliente.id}`}
                      className="fixed z-[9999] w-56 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                      style={{ top: menuPosition.top, left: menuPosition.left }}
                    >
                      <Link
                        href={{
                          pathname: '/oportunidades',
                          query: {
                            clienteId: cliente.id,
                            clienteNome: cliente.nome,
                            aba: 'abertas',
                          },
                        }}
                        className="flex items-center rounded-md px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        onClick={() => setOpenMenuId(null)}
                      >
                        <Briefcase size={12} className="mr-1.5" />
                        Ver orcamentos abertos
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleVerDetalhes(cliente)}
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Eye size={12} className="mr-1.5" />
                        Ver detalhes
                      </button>
                      {phoneWithCountry && (
                        <a
                          href={`https://wa.me/${phoneWithCountry}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenMenuId(null)}
                          className="flex items-center rounded-md px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        >
                          <MessageCircle size={12} className="mr-1.5" />
                          Enviar WhatsApp
                        </a>
                      )}
                      {cliente.email && (
                        <a
                          href={getEmailComposeUrl(cliente.email)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenMenuId(null)}
                          className="flex items-center rounded-md px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                          <Mail size={12} className="mr-1.5" />
                          Enviar email
                        </a>
                      )}
                      <Link
                        href={{
                          pathname: '/oportunidades',
                          query: {
                            novoOrcamento: '1',
                            clienteId: cliente.id,
                            clienteNome: cliente.nome,
                          },
                        }}
                        className="flex items-center rounded-md px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        onClick={() => setOpenMenuId(null)}
                      >
                        <FileText size={12} className="mr-1.5" />
                        Criar orcamento
                      </Link>
                      <Link
                        href={{
                          pathname: '/pedidos',
                          query: {
                            novoPedido: '1',
                            clienteId: cliente.id,
                            clienteNome: cliente.nome,
                          },
                        }}
                        className="flex items-center rounded-md px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                        onClick={() => setOpenMenuId(null)}
                      >
                        <ClipboardList size={12} className="mr-1.5" />
                        Criar pedido
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null)
                          onDeleteClick(cliente)
                        }}
                        disabled={deletingId === cliente.id}
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={12} className="mr-1.5" />
                        {deletingId === cliente.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null)
                          onEditClick?.(cliente)
                        }}
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20"
                      >
                        <Edit2 size={12} className="mr-1.5" />
                        Editar
                      </button>
                    </div>,
                    document.body
                  ) : null}
                </div>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>

      <ClienteDetalhesDrawer
        open={detalhesDrawerOpen}
        clienteId={clienteParaDetalhes?.id ?? null}
        clienteNome={clienteParaDetalhes?.nome}
        onClose={() => {
          setDetalhesDrawerOpen(false)
          setClienteParaDetalhes(null)
        }}
        onEditCliente={
          onEditClick && clienteParaDetalhes
            ? (c) => {
                setDetalhesDrawerOpen(false)
                setClienteParaDetalhes(null)
                onEditClick(c)
              }
            : undefined
        }
      />
    </div>
  )
}

export type { Cliente }
