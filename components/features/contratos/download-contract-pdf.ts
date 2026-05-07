export function getDownloadFileNameFromHeader(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/filename\*?=['"]?(?:UTF-8'')?([^'";\n]+)['"]?/i)
  if (match) return decodeURIComponent(match[1].trim())
  const simple = header.match(/filename=["']?([^"';]+)["']?/i)
  return simple ? simple[1].trim() : null
}

export async function fetchContractPdfWithFallback(contractId: string): Promise<Response> {
  const urls = [`/api/contratos/${contractId}/pdf-v2`, `/api/contratos/${contractId}/pdf`]
  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Nao foi possivel gerar o PDF.')
      }
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro ao gerar PDF.')
    }
  }

  throw lastError || new Error('Nao foi possivel gerar o PDF.')
}
