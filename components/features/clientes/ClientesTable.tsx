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
import { clampFixedMenuPosition } from '@/lib/ui/clampFixedMenuPosition'
import { ClienteDetalhesDrawer } from './ClienteDetalhesDrawer'
import type { Cliente } from './types'

const CLIENTE_MENU_WIDTH = 224
const CLIENTE_MENU_HEIGHT_EST = 380

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

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (menuButtonRef.current?.contains(target)) return
      const menuEl = document.getElementById(`cliente-menu-${openMenuId}`)
      if (menuEl?.contains(target)) return
      setOpenMenuId(null)
    }

    const updatePosition = () => {
      const desktop = window.matchMedia('(min-width: 1024px)').matches
      const scope = desktop
        ? document.querySelector('.cliente-list-desktop-scope')
        : document.querySelector('.cliente-list-mobile-scope')
      const btn = scope?.querySelector(`[data-cliente-menu-btn="${openMenuId}"]`) as HTMLElement | undefined
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setMenuPosition(
          clampFixedMenuPosition(rect, CLIENTE_MENU_WIDTH, CLIENTE_MENU_HEIGHT_EST, true)
        )
      }
    }

    updatePosition()
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [openMenuId])

  const menuCliente = openMenuId ? clientes.find((c) => c.id === openMenuId) : null
  const menuPhoneCountry = menuCliente?.telefone
    ? (() => {
        const clean = menuCliente.telefone!.replace(/\D/g, '')
        return clean ? (clean.startsWith('55') ? clean : `55${clean}`) : ''
      })()
    : ''

  return (
    <div className="crm-card">
      <div className="cliente-list-mobile-scope divide-y divide-gray-200 dark:divide-gray-700 lg:hidden">
        {clientes.map((cliente) => {
          return (
            <div key={cliente.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-gray-900 dark:text-white" title={cliente.nome}>
                    {cliente.nome}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {cliente.numero != null ? `#${String(cliente.numero).padStart(5, '0')}` : 'Sem código'}
                    {cliente.empresa ? ` · ${cliente.empresa}` : ''}
                  </div>
                </div>
                <button
                  ref={openMenuId === cliente.id ? menuButtonRef : undefined}
                  data-cliente-menu-btn={cliente.id}
                  type="button"
                  onClick={() => setOpenMenuId((prev) => (prev === cliente.id ? null : cliente.id))}
                  className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  title="Ações"
                  aria-label="Ações"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {cliente.telefone ? (
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Phone size={14} className="shrink-0 opacity-70" />
                    <span className="truncate">{cliente.telefone}</span>
                  </div>
                ) : null}
                {cliente.email ? (
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Mail size={14} className="shrink-0 opacity-70" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Orç. {cliente.orcamentos ?? 0}
                </span>
                <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Vend. {cliente.vendas ?? 0}
                </span>
                <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Ped. {cliente.pedidos ?? 0}
                </span>
                <span className="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Canc. {cliente.cancelamentos ?? 0}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cliente-list-desktop-scope hidden lg:block">
      <table className="w-full table-fixed">
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
                </div>
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
      </div>

      {menuCliente && menuPosition && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={`cliente-menu-${menuCliente.id}`}
              className="fixed z-[9999] w-56 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <Link
                href={{
                  pathname: '/oportunidades',
                  query: {
                    clienteId: menuCliente.id,
                    clienteNome: menuCliente.nome,
                    aba: 'abertas',
                  },
                }}
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20 lg:min-h-0 lg:py-2"
                onClick={() => setOpenMenuId(null)}
              >
                <Briefcase size={12} className="mr-1.5" />
                Ver orcamentos abertos
              </Link>
              <button
                type="button"
                onClick={() => handleVerDetalhes(menuCliente)}
                className="flex w-full min-h-[44px] items-center rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:min-h-0"
              >
                <Eye size={12} className="mr-1.5" />
                Ver detalhes
              </button>
              {menuPhoneCountry ? (
                <a
                  href={`https://wa.me/${menuPhoneCountry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenuId(null)}
                  className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20 lg:min-h-0"
                >
                  <MessageCircle size={12} className="mr-1.5" />
                  Enviar WhatsApp
                </a>
              ) : null}
              {menuCliente.email ? (
                <a
                  href={getEmailComposeUrl(menuCliente.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenuId(null)}
                  className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20 lg:min-h-0"
                >
                  <Mail size={12} className="mr-1.5" />
                  Enviar email
                </a>
              ) : null}
              <Link
                href={{
                  pathname: '/oportunidades',
                  query: {
                    novoOrcamento: '1',
                    clienteId: menuCliente.id,
                    clienteNome: menuCliente.nome,
                  },
                }}
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20 lg:min-h-0"
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
                    clienteId: menuCliente.id,
                    clienteNome: menuCliente.nome,
                  },
                }}
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20 lg:min-h-0"
                onClick={() => setOpenMenuId(null)}
              >
                <ClipboardList size={12} className="mr-1.5" />
                Criar pedido
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null)
                  onDeleteClick(menuCliente)
                }}
                disabled={deletingId === menuCliente.id}
                className="flex w-full min-h-[44px] items-center rounded-md px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-900/20 lg:min-h-0"
              >
                <Trash2 size={12} className="mr-1.5" />
                {deletingId === menuCliente.id ? 'Excluindo...' : 'Excluir'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null)
                  onEditClick?.(menuCliente)
                }}
                className="flex w-full min-h-[44px] items-center rounded-md px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20 lg:min-h-0"
              >
                <Edit2 size={12} className="mr-1.5" />
                Editar
              </button>
            </div>,
            document.body
          )
        : null}

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
