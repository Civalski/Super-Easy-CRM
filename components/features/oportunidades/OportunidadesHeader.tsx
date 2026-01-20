/**
 * Header da página de oportunidades
 * Design consistente com outras páginas do CRM
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus, TrendingUp } from 'lucide-react'

interface OportunidadesHeaderProps {
    children?: React.ReactNode; // Para o AmbienteSelector
}

export function OportunidadesHeader({ children }: OportunidadesHeaderProps) {
    return (
        <div className="flex justify-between items-start mb-6">
            <div>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/25">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Pipeline de Oportunidades
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gerencie seu funil de vendas com drag and drop
                        </p>
                    </div>
                </div>
                {children && <div className="mt-3 ml-14">{children}</div>}
            </div>
            <Link href="/oportunidades/nova">
                <Button>
                    <Plus size={20} className="mr-2" />
                    Nova Oportunidade
                </Button>
            </Link>
        </div>
    )
}
