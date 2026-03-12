import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

const LOGO_SIZE_LIMIT = 600 * 1024 // 600KB base64

/**
 * GET: Retorna status do onboarding e dados já salvos (se houver).
 */
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

      const completed = Boolean(user?.onboardingCompletedAt)

      return NextResponse.json({
        completed,
        empresaConfig: empresaConfig ?? null,
        pdfConfig: pdfConfig ?? null,
      })
    } catch (error) {
      console.error('Erro ao buscar status do onboarding:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}

/**
 * POST: Salva dados do onboarding e marca como concluído.
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()

      const {
        areaAtuacao,
        tipoPublico,
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
        return NextResponse.json(
          { error: 'Logo muito grande. Limite: 450KB.' },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        await tx.empresaConfig.upsert({
          where: { userId },
          create: {
            userId,
            areaAtuacao: areaAtuacao ?? null,
            tipoPublico: tipoPublico ?? null,
          },
          update: {
            areaAtuacao: areaAtuacao ?? null,
            tipoPublico: tipoPublico ?? null,
          },
        })

        await tx.pdfConfig.upsert({
          where: { userId },
          create: {
            userId,
            nomeEmpresa: nomeEmpresa ?? null,
            nomeVendedor: nomeVendedor ?? null,
            telefone: telefone ?? null,
            email: email ?? null,
            site: site ?? null,
            rodape: rodape ?? null,
            corPrimaria: corPrimaria ?? null,
            validadeDias: validadeDias ?? null,
            logoBase64: logoBase64 ?? null,
            logoPosicao: logoPosicao ?? 'topo',
          },
          update: {
            nomeEmpresa: nomeEmpresa ?? null,
            nomeVendedor: nomeVendedor ?? null,
            telefone: telefone ?? null,
            email: email ?? null,
            site: site ?? null,
            rodape: rodape ?? null,
            corPrimaria: corPrimaria ?? null,
            validadeDias: validadeDias ?? null,
            logoBase64: logoBase64 ?? null,
            logoPosicao: logoPosicao ?? 'topo',
          },
        })

        await tx.user.update({
          where: { id: userId },
          data: { onboardingCompletedAt: new Date() },
        })
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao salvar onboarding:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  })
}

/**
 * DELETE: Reseta o onboarding (apaga dados antigos e permite refazer a configuração inicial).
 */
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
