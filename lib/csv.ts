/**
 * Adapter para leitura de arquivos CSV usando papaparse.
 * Formato mais leve que XLSX para importação de leads.
 */
import Papa from 'papaparse'

export type CsvRowObject = Record<string, string | number | null>

/**
 * Lê uma string CSV e retorna array de objetos.
 * A primeira linha é usada como chaves.
 */
export function readCsvToObjects(csvString: string): CsvRowObject[] {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (result.errors.length > 0) {
    const firstError = result.errors[0]
    throw new Error(`Falha ao ler arquivo CSV. ${firstError?.message ?? 'Erro desconhecido'}`)
  }

  const rows: CsvRowObject[] = []
  for (const row of result.data ?? []) {
    const obj: CsvRowObject = {}
    for (const [key, value] of Object.entries(row)) {
      const trimmed = typeof value === 'string' ? value.trim() : value
      obj[key] = trimmed === '' ? null : trimmed
    }
    rows.push(obj)
  }

  return rows
}
