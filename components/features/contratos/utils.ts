import type { Clausula } from './types'

/**
 * Converte texto colado em cláusulas.
 * Reconhece: "1. Título\nConteúdo", "Cláusula 1.", "§ 1", ou parágrafos separados por linha em branco.
 */
export function parseClausulasFromText(text: string): Clausula[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const lines = trimmed.split(/\r?\n/)
  const clauses: Clausula[] = []
  let currentTitle = ''
  let currentContent: string[] = []

  const flushCurrent = () => {
    const conteudo = currentContent.join('\n').trim()
    if (currentTitle || conteudo) {
      clauses.push({
        titulo: currentTitle.trim(),
        conteudo,
      })
    }
    currentTitle = ''
    currentContent = []
  }

  const startNewClause = (titulo: string, restOfLine = '') => {
    flushCurrent()
    currentTitle = titulo.trim()
    currentContent = restOfLine.trim() ? [restOfLine.trim()] : []
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    const numDot = trimmedLine.match(/^(\d+)[.)]\s*([\s\S]+)?$/)
    if (numDot) {
      const titulo = numDot[2]?.trim() || `Cláusula ${numDot[1]}`
      startNewClause(titulo)
      continue
    }

    const numParen = trimmedLine.match(/^(\d+)\)\s*([\s\S]+)?$/)
    if (numParen) {
      const titulo = numParen[2]?.trim() || `Cláusula ${numParen[1]}`
      startNewClause(titulo)
      continue
    }

    const clausulaMatch = trimmedLine.match(/^Cláusula\s+(.+)/i)
    if (clausulaMatch) {
      startNewClause(clausulaMatch[1].trim())
      continue
    }

    const paragMatch = trimmedLine.match(/^§\s*(\d+)?\.?\s*(.+)?$/i)
    if (paragMatch) {
      const titulo = paragMatch[2]?.trim() || (paragMatch[1] ? `§ ${paragMatch[1]}` : 'Cláusula')
      startNewClause(titulo)
      continue
    }

    if (trimmedLine === '') {
      flushCurrent()
      continue
    }

    if (currentTitle || currentContent.length > 0) {
      currentContent.push(trimmedLine)
    } else {
      startNewClause(trimmedLine)
    }
  }

  flushCurrent()
  return clauses
}
