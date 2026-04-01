/**
 * Design-only snapshot do PDF de Proposta de Servico.
 * Arquivo standalone para compartilhar com IA sem auth/banco/cache.
 */

export type Rgb = { red: number; green: number; blue: number }

export type BrandTheme = {
  primaryHex: string
  logoUrl?: string
}

export type BrandPalette = {
  primary: Rgb
  dark: Rgb
  ultralight: Rgb
  light: Rgb
  textStrong: Rgb
  textMuted: Rgb
}

export const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: { x: 50, top: 50, bottom: 60 },
} as const

export const CONTENT_WIDTH = PAGE.width - PAGE.margin.x * 2

export const FS = {
  title: 15,
  docNumber: 20,
  section: 9.5,
  label: 7.5,
  metaValue: 10,
  text: 9,
  bullet: 9,
  condLabel: 7.5,
  condValue: 10,
  footer: 7.5,
} as const

export const SPACING = {
  headerPadX: 28,
  headerPadTop: 24,
  headerPadBottom: 20,
  metaStripPadY: 10,
  metaStripGapX: 16,
  bodyPadX: 28,
  bodyPadY: 20,
  sectionGap: 14,
  sectionHeaderY: 8,
  sectionBodyY: 11,
  sectionBodyX: 12,
  condGridCellY: 8,
  footerPadY: 10,
  dotSize: 3.5,
  dotGap: 8,
} as const

export function lerpColor(c1: Rgb, c2: Rgb, t: number): Rgb {
  return {
    red: Math.min(1, Math.max(0, c1.red + (c2.red - c1.red) * t)),
    green: Math.min(1, Math.max(0, c1.green + (c2.green - c1.green) * t)),
    blue: Math.min(1, Math.max(0, c1.blue + (c2.blue - c1.blue) * t)),
  }
}

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return { red: 0.07, green: 0.18, blue: 0.4 }
  }
  const value = Number.parseInt(normalized, 16)
  return {
    red: ((value >> 16) & 0xff) / 255,
    green: ((value >> 8) & 0xff) / 255,
    blue: (value & 0xff) / 255,
  }
}

export function rgbToHex(color: Rgb): string {
  const toHex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`
}

function relativeLuminance(color: Rgb): number {
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return (
    0.2126 * linearize(color.red) +
    0.7152 * linearize(color.green) +
    0.0722 * linearize(color.blue)
  )
}

export function deriveBrandPalette(hex: string): BrandPalette {
  const primary = hexToRgb(hex)
  const white: Rgb = { red: 1, green: 1, blue: 1 }
  const black: Rgb = { red: 0, green: 0, blue: 0 }
  const isBright = relativeLuminance(primary) > 0.4

  return {
    primary,
    dark: lerpColor(primary, black, 0.18),
    ultralight: lerpColor(primary, white, 0.93),
    light: lerpColor(primary, white, 0.78),
    textStrong: lerpColor(primary, black, isBright ? 0.55 : 0.35),
    textMuted: lerpColor(primary, black, isBright ? 0.35 : 0.25),
  }
}

/**
 * Regras visuais do PDF (resumo):
 * 1) Header: fundo de marca, logo esquerda, numero grande direita.
 * 2) Meta strip: cliente, emissao e validade.
 * 3) Secoes: cards apenas com conteudo real (sem blocos vazios).
 * 4) Condicoes: grid compacto com destaque do valor principal.
 * 5) Rodape: paginacao + texto customizado (quando existir).
 */
export const PROPOSTA_PDF_DESIGN_RULES = true

