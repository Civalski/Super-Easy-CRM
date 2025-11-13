import { Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure as preferências do sistema
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Settings size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Configurações em desenvolvimento
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  )
}

