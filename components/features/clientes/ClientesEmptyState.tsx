/**
 * Estado vazio para listagem de clientes
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus, Users } from 'lucide-react'

export function ClientesEmptyState() {
    return (
        <div className="crm-card p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum cliente cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece adicionando seu primeiro cliente ao sistema.
            </p>
            <Link href="/clientes/novo">
                <Button>
                    <Plus size={20} className="mr-2" />
                    Adicionar Cliente
                </Button>
            </Link>
        </div>
    )
}
