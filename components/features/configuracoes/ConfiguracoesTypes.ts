/**
 * Tipos para a feature Configurações
 */

export interface SeedResult {
    success: boolean
    message?: string
    resumo?: {
        clientes: number
        contatos: number
        oportunidades: number
        tarefas: number
    }
    error?: string
}
