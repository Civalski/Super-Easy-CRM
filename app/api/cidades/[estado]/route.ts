import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: NextRequest,
    { params }: { params: { estado: string } }
) {
    try {
        const { estado } = params

        // Validar que o estado é uma UF válida
        const estadosValidos = [
            'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
            'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
        ]

        if (!estadosValidos.includes(estado.toUpperCase())) {
            return NextResponse.json(
                { error: 'Estado inválido' },
                { status: 400 }
            )
        }

        // Caminho para a pasta do estado
        const estadoPath = path.join(process.cwd(), 'Dados', estado.toUpperCase())

        // Verificar se a pasta existe
        if (!fs.existsSync(estadoPath)) {
            return NextResponse.json(
                { error: 'Pasta do estado não encontrada' },
                { status: 404 }
            )
        }

        // Ler todos os arquivos da pasta
        const arquivos = fs.readdirSync(estadoPath)

        // Filtrar apenas arquivos .parquet e extrair nomes das cidades
        const cidades = arquivos
            .filter(arquivo => arquivo.endsWith('.parquet'))
            .map(arquivo => {
                // Remover a extensão .parquet
                const semExtensao = arquivo.replace('.parquet', '')
                // Remover o prefixo "UF - " (ex: "RJ - ")
                const nomeCidade = semExtensao.replace(/^[A-Z]{2} - /, '')
                return nomeCidade
            })
            .sort() // Ordenar alfabeticamente

        return NextResponse.json(cidades)
    } catch (error) {
        console.error('Erro ao buscar cidades:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar cidades' },
            { status: 500 }
        )
    }
}
