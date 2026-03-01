import { NextResponse } from 'next/server'

function isEnabled(value: string | undefined) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export function isHeavyRoutesDisabled() {
  return isEnabled(process.env.DISABLE_HEAVY_ROUTES)
}

export function heavyRoutesDisabledResponse() {
  return NextResponse.json(
    {
      error: 'Operacao temporariamente desabilitada por seguranca de custo',
      code: 'HEAVY_ROUTES_DISABLED',
    },
    { status: 503 }
  )
}
