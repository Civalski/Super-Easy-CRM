export interface ContractPdfTheme {
  primary: string
  dark: string
  light: string
  ultraLight: string
  textStrong: string
  textMuted: string
  border: string
  footerBg: string
  white: string
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '').trim()
  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    return { r: 18, g: 48, b: 102 }
  }

  const value = Number.parseInt(normalized, 16)
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function mix(color: string, target: string, ratio: number): string {
  const c1 = hexToRgb(color)
  const c2 = hexToRgb(target)
  const t = Math.max(0, Math.min(1, ratio))
  return rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t)
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const linearize = (v: number) => {
    const srgb = v / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
  }

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

export function createContractPdfTheme(primaryHex: string): ContractPdfTheme {
  const primary = /^#[\da-fA-F]{6}$/.test(primaryHex) ? primaryHex.toUpperCase() : '#123066'
  const isBright = relativeLuminance(primary) > 0.42

  return {
    primary,
    dark: mix(primary, '#000000', isBright ? 0.52 : 0.25),
    light: mix(primary, '#FFFFFF', 0.78),
    ultraLight: mix(primary, '#FFFFFF', 0.92),
    textStrong: '#10141D',
    textMuted: '#5B6374',
    border: '#D4DAE5',
    footerBg: '#F3F5F9',
    white: '#FFFFFF',
  }
}
