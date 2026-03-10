/**
 * Grid de tarefas
 */
'use client'

import { TarefaCard } from './TarefaCard'
import type { Tarefa, TabType } from './TarefasTypes'

interface TarefasGridProps {
    tarefas: Tarefa[]
    activeTab: TabType
    atualizandoTarefa: string | null
    excluindoTarefa: string | null
    onVoltarParaPendente: (tarefaId: string) => void
    onConcluirTarefa: (tarefaId: string) => void
    onExcluirTarefa: (tarefaId: string) => void
    onEditTarefa: (tarefaId: string) => void
}

export function TarefasGrid({
    tarefas,
    activeTab,
    atualizandoTarefa,
    excluindoTarefa,
    onVoltarParaPendente,
    onConcluirTarefa,
    onExcluirTarefa,
    onEditTarefa,
}: TarefasGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tarefas.map((tarefa) => (
                <TarefaCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    activeTab={activeTab}
                    atualizandoTarefa={atualizandoTarefa}
                    excluindoTarefa={excluindoTarefa}
                    onVoltarParaPendente={onVoltarParaPendente}
                    onConcluirTarefa={onConcluirTarefa}
                    onExcluirTarefa={onExcluirTarefa}
                    onEditTarefa={onEditTarefa}
                />
            ))}
        </div>
    )
}
