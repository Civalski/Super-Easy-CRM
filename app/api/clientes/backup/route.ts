import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CSV_COLUMNS = [
  'perfil',
  'nome',
  'email',
  'telefone',
  'empresa',
  'endereco',
  'cidade',
  'estado',
  'cep',
  'cargo',
  'documento',
  'website',
  'dataNascimento',
  'observacoes',
  'camposPersonalizados',
  'cnpj',
  'matrizFilial',
  'razaoSocial',
  'nomeFantasia',
  'capitalSocial',
  'porte',
  'qualificacaoProfissional',
  'naturezaJuridica',
  'situacaoCadastral',
  'dataSituacaoCadastral',
  'motivoSituacaoCadastral',
  'dataAbertura',
  'tipoLogradouro',
  'logradouro',
  'numeroEndereco',
  'complemento',
  'bairro',
  'telefone2',
  'fax',
  'cnaePrincipal',
  'cnaePrincipalDesc',
  'cnaesSecundarios',
  'mei',
  'dataEntradaMei',
  'simples',
] as const

function inferPerfil(c: {
  empresa?: string | null
  nome?: string | null
  cnpj?: string | null
  razaoSocial?: string | null
}): 'b2b' | 'b2c' {
  if (c.cnpj?.trim() || c.razaoSocial?.trim() || (c.empresa?.trim() && c.empresa !== c.nome)) {
    return 'b2b'
  }
  return 'b2c'
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const clientes = await prisma.cliente.findMany({
        where: { userId },
        orderBy: { numero: 'asc' },
      })

      const backup = clientes.map((c) => {
        const perfil = inferPerfil(c)
        return {
          perfil,
          nome: c.nome ?? '',
          email: c.email ?? '',
          telefone: c.telefone ?? '',
          empresa: c.empresa ?? '',
          endereco: c.endereco ?? '',
          cidade: c.cidade ?? '',
          estado: c.estado ?? '',
          cep: c.cep ?? '',
          cargo: c.cargo ?? '',
          documento: c.documento ?? '',
          website: c.website ?? '',
          dataNascimento: c.dataNascimento ?? '',
          observacoes: c.observacoes ?? '',
          camposPersonalizados:
            c.camposPersonalizados && typeof c.camposPersonalizados === 'object'
              ? JSON.stringify(c.camposPersonalizados)
              : '',
          cnpj: c.cnpj ?? '',
          matrizFilial: c.matrizFilial ?? '',
          razaoSocial: c.razaoSocial ?? '',
          nomeFantasia: c.nomeFantasia ?? '',
          capitalSocial: c.capitalSocial ?? '',
          porte: c.porte ?? '',
          qualificacaoProfissional: c.qualificacaoProfissional ?? '',
          naturezaJuridica: c.naturezaJuridica ?? '',
          situacaoCadastral: c.situacaoCadastral ?? '',
          dataSituacaoCadastral: c.dataSituacaoCadastral ?? '',
          motivoSituacaoCadastral: c.motivoSituacaoCadastral ?? '',
          dataAbertura: c.dataAbertura ?? '',
          tipoLogradouro: c.tipoLogradouro ?? '',
          logradouro: c.logradouro ?? '',
          numeroEndereco: c.numeroEndereco ?? '',
          complemento: c.complemento ?? '',
          bairro: c.bairro ?? '',
          telefone2: c.telefone2 ?? '',
          fax: c.fax ?? '',
          cnaePrincipal: c.cnaePrincipal ?? '',
          cnaePrincipalDesc: c.cnaePrincipalDesc ?? '',
          cnaesSecundarios: c.cnaesSecundarios ?? '',
          mei: c.mei ?? '',
          dataEntradaMei: c.dataEntradaMei ?? '',
          simples: c.simples ?? '',
        }
      })

      const { searchParams } = new URL(request.url)
      const format = searchParams.get('format')
      const dateStr = new Date().toISOString().slice(0, 10)

      if (format === 'csv') {
        const header = CSV_COLUMNS.join(',')
        const escape = (v: string) => {
          const s = String(v ?? '').replace(/"/g, '""')
          return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
        }
        const rows = backup.map((r) =>
          CSV_COLUMNS.map((col) => escape((r as Record<string, string>)[col] ?? '')).join(',')
        )
        const csv = [header, ...rows].join('\n')
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="backup-clientes-${dateStr}.csv"`,
          },
        })
      }

      const json = JSON.stringify(backup, null, 2)
      return new NextResponse(json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-clientes-${dateStr}.json"`,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar backup de clientes:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar backup' },
        { status: 500 }
      )
    }
  })
}
