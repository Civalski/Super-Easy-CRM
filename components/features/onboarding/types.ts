export interface OnboardingFormData {
  areaAtuacao: string
  tipoPublico: 'B2B' | 'B2C' | 'ambos'
  nomeEmpresa: string
  nomeVendedor: string
  telefone: string
  email: string
  site: string
  rodape: string
  logoBase64: string
  logoPosicao: 'topo' | 'rodape'
  corPrimaria: string
  temaPreferencia: 'light' | 'dark'
  menuLayout: 'sidebar' | 'header'
}

export interface OnboardingStatus {
  completed: boolean
  empresaConfig: { areaAtuacao?: string; tipoPublico?: string } | null
  pdfConfig: {
    nomeEmpresa?: string
    nomeVendedor?: string
    telefone?: string
    email?: string
    site?: string
    rodape?: string
    logoBase64?: string
    logoPosicao?: string
    corPrimaria?: string
  } | null
}
