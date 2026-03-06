/**
 * Adapter para leitura de arquivos Excel usando exceljs.
 * Substitui xlsx (SheetJS) por questões de segurança.
 */
import ExcelJS from 'exceljs'

export type ExcelRowArray = (string | number | null)[]
export type ExcelRowObject = Record<string, string | number | null>

/**
 * Lê um buffer Excel e retorna a primeira planilha como matriz (array de arrays).
 * Equivalente a XLSX.utils.sheet_to_json(worksheet, { header: 1 }).
 */
export async function readExcelToMatrix(
  buffer: ArrayBuffer
): Promise<ExcelRowArray[]> {
  const workbook = new ExcelJS.Workbook()
  try {
    // Alguns arquivos XLSX (especialmente exportados por CRMs/BI) trazem tableParts
    // inconsistentes que quebram o parser do exceljs com "reading 'name'".
    // Ignoramos esse nodo para manter leitura robusta da planilha.
    await workbook.xlsx.load(buffer, { ignoreNodes: ['tableParts'] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao abrir arquivo Excel'
    throw new Error(`Falha ao ler arquivo Excel (.xlsx). ${message}`)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const rows: ExcelRowArray[] = []
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const arr: ExcelRowArray = []
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      while (arr.length < colNumber) arr.push(null)
      const v = cell.value
      if (v === null || v === undefined) {
        arr[colNumber - 1] = null
      } else if (typeof v === 'number' && Number.isFinite(v)) {
        arr[colNumber - 1] = v
      } else if (typeof v === 'string') {
        arr[colNumber - 1] = v
      } else if (typeof v === 'object' && v instanceof Date) {
        arr[colNumber - 1] = v.toISOString().slice(0, 10)
      } else if (typeof v === 'object' && v !== null) {
        const rich = v as { text?: string; result?: number }
        if (typeof rich.result === 'number') arr[colNumber - 1] = rich.result
        else if (typeof rich.text === 'string') arr[colNumber - 1] = rich.text
        else arr[colNumber - 1] = String(v)
      } else {
        arr[colNumber - 1] = String(v)
      }
    })
    rows.push(arr)
  })

  return rows
}

/**
 * Lê um buffer Excel e retorna a primeira planilha como array de objetos.
 * A primeira linha é usada como chaves. Equivalente a XLSX.utils.sheet_to_json(worksheet).
 */
export async function readExcelToObjects(buffer: ArrayBuffer): Promise<ExcelRowObject[]> {
  const matrix = await readExcelToMatrix(buffer)
  if (matrix.length === 0) return []

  const headers = (matrix[0] ?? []).map((v) => String(v ?? ''))
  const rows: ExcelRowObject[] = []

  for (let i = 1; i < matrix.length; i += 1) {
    const row = matrix[i] ?? []
    const obj: ExcelRowObject = {}
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ?? null
    })
    rows.push(obj)
  }

  return rows
}
