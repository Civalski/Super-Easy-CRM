import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const LOGO_SIZE_LIMIT = 600 * 1024

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const [user, empresaConfig, pdfConfig] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { onboardingCompletedAt: true },
        }),
        prisma.empresaConfig.findUnique({ where: { userId } }),
        prisma.pdfConfig.findUnique({ where: { userId } }),
      ])

      return NextResponse.json({
        completed: Boolean(user?.onboardingCompletedAt),
        empresaConfig: empresaConfig ?? null,
        pdfConfig: pdfConfig ?? null,
      })
    } catch (error) {
      console.error('Erro ao buscar status do onboarding:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()

      if (body.logoBase64 && body.logoBase64.length > LOGO_SIZE_LIMIT) {
        return NextResponse.json({ error: 'Logo muito grande. Limite: 450KB.' }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        await tx.empresaConfig.upsert({
          where: { userId },
          create: {
            userId,
            areaAtuacao: body.areaAtuacao ?? null,
            tipoPublico: body.tipoPublico ?? null,
          },
          update: {
            areaAtuacao: body.areaAtuacao ?? null,
            tipoPublico: body.tipoPublico ?? null,
          },
        })

        await tx.pdfConfig.upsert({
          where: { userId },
          create: {
            userId,
            nomeEmpresa: body.nomeEmpresa ?? null,
            nomeVendedor: body.nomeVendedor ?? null,
            telefone: body.telefone ?? null,
            email: body.email ?? null,
            site: body.site ?? null,
            rodape: body.rodape ?? null,
            corPrimaria: body.corPrimaria ?? null,
            validadeDias: body.validadeDias ?? null,
            logoBase64: body.logoBase64 ?? null,
            logoPosicao: body.logoPosicao ?? 'topo',
          },
          update: {
            nomeEmpresa: body.nomeEmpresa ?? null,
            nomeVendedor: body.nomeVendedor ?? null,
            telefone: body.telefone ?? null,
            email: body.email ?? null,
            site: body.site ?? null,
            rodape: body.rodape ?? null,
            corPrimaria: body.corPrimaria ?? null,
            validadeDias: body.validadeDias ?? null,
            logoBase64: body.logoBase64 ?? null,
            logoPosicao: body.logoPosicao ?? 'topo',
          },
        })

      })

      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: new Date() },
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao salvar onboarding:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.empresaConfig.deleteMany({ where: { userId } })
        await tx.pdfConfig.deleteMany({ where: { userId } })
        await tx.user.update({
          where: { id: userId },
          data: { onboardingCompletedAt: null },
        })
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao resetar onboarding:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}
