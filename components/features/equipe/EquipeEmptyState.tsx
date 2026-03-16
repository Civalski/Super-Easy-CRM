'use client'

export function EquipeEmptyState() {
  return (
    <section className="crm-card p-8 text-center sm:p-10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Nenhum usuario normal vinculado
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Quando houver vendedores vinculados ao seu workspace, os indicadores de contatos,
        tarefas, orcamentos, pedidos e faturamento aparecerao aqui.
      </p>
    </section>
  )
}
