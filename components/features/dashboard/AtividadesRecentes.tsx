/**
 * Seção de atividades recentes
 */
'use client'

export function AtividadesRecentes() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Atividades Recentes
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhuma atividade recente</p>
            </div>
        </div>
    )
}
