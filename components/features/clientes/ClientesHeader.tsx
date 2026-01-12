/**
 * Header da página de clientes
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus } from 'lucide-react'

export function ClientesHeader() {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Clientes
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Gerencie seus clientes e contatos
                </p>
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
