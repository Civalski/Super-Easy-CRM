'use client'

import { LeadsSearchComponent } from '@/components/LeadsSearchComponent'

export default function LeadsPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Busca de Leads
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Encontre leads qualificados filtrando por localização, CNAE e outros critérios
                </p>
            </div>

            <LeadsSearchComponent />
        </div>
    )
}
