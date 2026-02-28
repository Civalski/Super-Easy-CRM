/**
 * Header da página de clientes
 * Design consistente com outras páginas do CRM
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus, Users } from 'lucide-react'

export function ClientesHeader() {
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25">
                    <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Clientes
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gerencie seus clientes e contatos
                    </p>
                </div>
            </div>
            <Link href="/clientes/novo">
                <Button>
                    <Plus size={20} className="mr-2" />
                    Novo Cliente
                </Button>
            </Link>
        </div>
    )
}
