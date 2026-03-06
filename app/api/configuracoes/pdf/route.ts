import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

const LOGO_SIZE_LIMIT = 600 * 1024 // 600KB base64

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const config = await prisma.pdfConfig.findUnique({ where: { userId } })
      return NextResponse.json(config ?? {})
    } catch (error) {
      console.error('Erro ao buscar configurações do PDF:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()
    const {
      nomeEmpresa,
      nomeVendedor,
      telefone,
      email,
      site,
      rodape,
      corPrimaria,
      validadeDias,
      logoBase64,
      logoPosicao,
    } = body

    if (logoBase64 && logoBase64.length > LOGO_SIZE_LIMIT) {
      return NextResponse.json({ error: 'Logo muito grande. Limite: 450KB.' }, { status: 400 })
    }

    const config = await prisma.pdfConfig.upsert({
      where: { userId },
      create: {
        userId,
        nomeEmpresa,
        nomeVendedor,
        telefone,
        email,
        site,
        rodape,
        corPrimaria,
        validadeDias,
        logoBase64,
        logoPosicao,
      },
      update: {
        nomeEmpresa,
        nomeVendedor,
        telefone,
        email,
        site,
        rodape,
        corPrimaria,
        validadeDias,
        logoBase64,
        logoPosicao,
      },
    })

      return NextResponse.json(config)
    } catch (error) {
      console.error('Erro ao salvar configurações do PDF:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}
