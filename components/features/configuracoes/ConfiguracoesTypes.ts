/**
 * Tipos para a feature Configurações
 */

export interface SeedResult {
    success: boolean
    message?: string
    resumo?: {
        ambientes: number
        clientes: number
        contatos: number
        oportunidades: number
        tarefas: number
    }
    error?: string
}
