/**
 * Converte arquivo JSON ou CSV em array de objetos no formato do formulário de cliente.
 * Campos: nome, email, telefone, empresa, cidade, estado, cep, observacoes, documento, cargo, endereco
 */

const IMPORT_COLUMNS = [
  'nome',
  'email',
  'telefone',
  'empresa',
  'cidade',
  'estado',
  'cep',
  'observacoes',
  'documento',
  'cargo',
  'endereco',
] as const

type ImportRow = Record<string, string>

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ''))
  const rows: ImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const obj: ImportRow = {}
    header.forEach((h, idx) => {
      obj[h] = values[idx]?.trim() ?? ''
    })
    rows.push(obj)
  }
  return rows
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

function jsonToRows(data: unknown): ImportRow[] {
  const rawList = Array.isArray(data) ? data : [data]
  return rawList.map((raw) => {
    if (!raw || typeof raw !== 'object') return {}
    const obj = raw as Record<string, unknown>
    const row: ImportRow = {}
    for (const col of IMPORT_COLUMNS) {
      const val = obj[col]
      row[col] = typeof val === 'string' ? val.trim() : val != null ? String(val).trim() : ''
    }
    return row
  })
}

function csvToRows(text: string): ImportRow[] {
  const parsed = parseCSV(text)
  const normalized: ImportRow[] = []
  for (const row of parsed) {
    const out: ImportRow = {}
    const keys = Object.keys(row)
    for (const col of IMPORT_COLUMNS) {
      const nc = normalizeKey(col)
      const found = keys.find((k) => normalizeKey(k) === nc)
      out[col] = found ? (row[found] ?? '').trim() : ''
    }
    normalized.push(out)
  }
  return normalized
}

export function parseImportFile(file: File): Promise<ImportRow[]> {
  return file.text().then((text) => {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'csv' || file.type === 'text/csv') {
      return csvToRows(text)
    }
    try {
      const data = JSON.parse(text)
      return jsonToRows(data)
    } catch {
      return csvToRows(text)
    }
  })
}
