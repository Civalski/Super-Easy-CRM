import { renderToBuffer } from '@react-pdf/renderer'
import { ContractPdfDocument } from './document'
import { buildContractPdfViewModel } from './mapper'
import { createContractPdfTheme } from './theme'
import type { ContractPdfConfigInput, ContractPdfInput, ContractPdfUserInput } from './types'

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function buildContractPdfFileName(input: {
  documentLabel: 'Contrato' | 'Proposta'
  numberLabel: string
  title: string
}) {
  const numberPart = input.numberLabel.replace('#', '')
  const shortTitle = sanitizeFileName(input.title).slice(0, 30) || input.documentLabel
  const datePart = new Date().toLocaleDateString('pt-BR').replace(/\//g, '.')
  return `${input.documentLabel} ${numberPart} - ${shortTitle} - ${datePart}.pdf`
}

export async function renderContractPdfV2(input: {
  contrato: ContractPdfInput
  user: ContractPdfUserInput
  pdfConfig?: ContractPdfConfigInput | null
}) {
  const viewModel = buildContractPdfViewModel(input)
  const theme = createContractPdfTheme(viewModel.primaryHex)

  const buffer = await renderToBuffer(
    <ContractPdfDocument model={viewModel} theme={theme} />
  )

  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' })

  const downloadFileName = buildContractPdfFileName({
    documentLabel: viewModel.documentLabel,
    numberLabel: viewModel.numberLabel,
    title: viewModel.title,
  })

  return {
    blob,
    viewModel,
    downloadFileName,
  }
}
