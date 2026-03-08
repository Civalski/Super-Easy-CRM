/**
 * API para cadastro manual de leads (prospectos) no funil.
 * Leads não são clientes — um lead só vira cliente ao concluir um pedido.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

function gerarCnpjManualUnico(): { cnpj: string; cnpjBasico: string; cnpjOrdem: string; cnpjDv: string } {
  const sufixo = String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 100)).padStart(2, '0')
  const cnpj = ('99' + sufixo).padStart(14, '0').slice(-14)
  const cnpjBasico = cnpj.slice(0, 8)
  const cnpjOrdem = cnpj.slice(8, 12)
  const cnpjDv = cnpj.slice(12, 14)
  return { cnpj, cnpjBasico, cnpjOrdem, cnpjDv }
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()
      const razaoSocial = (body.razaoSocial || body.nome || '').trim()
      if (!razaoSocial) {
        return NextResponse.json({ error: 'Nome ou razão social é obrigatório' }, { status: 400 })
      }

      let cnpjData = gerarCnpjManualUnico()
      let tentativas = 0
      const maxTentativas = 5

      while (tentativas < maxTentativas) {
        const existente = await prisma.prospecto.findUnique({
          where: { userId_cnpj: { userId, cnpj: cnpjData.cnpj } },
        })
        if (!existente) break
        cnpjData = gerarCnpjManualUnico()
        tentativas++
      }

      if (tentativas >= maxTentativas) {
        return NextResponse.json({ error: 'Não foi possível gerar CNPJ único. Tente novamente.' }, { status: 500 })
      }

      const prospecto = await prisma.prospecto.create({
        data: {
          userId,
          cnpj: cnpjData.cnpj,
          cnpjBasico: cnpjData.cnpjBasico,
          cnpjOrdem: cnpjData.cnpjOrdem,
          cnpjDv: cnpjData.cnpjDv,
          razaoSocial,
          nomeFantasia: (body.nomeFantasia || body.empresa || '').trim() || null,
          municipio: (body.municipio || 'Não informado').trim(),
          uf: (body.uf || 'NI').trim().slice(0, 2).toUpperCase(),
          telefone1: (body.telefone1 || body.telefone || '').trim() || null,
          email: (body.email || '').trim() || null,
          status: 'novo',
          observacoes: (body.observacoes || '').trim() || null,
        },
      })

      return NextResponse.json(prospecto, { status: 201 })
    } catch (error) {
      console.error('Erro ao cadastrar lead manual:', error)
      return NextResponse.json(
        { error: 'Erro ao cadastrar lead' },
        { status: 500 }
      )
    }
  })
}
