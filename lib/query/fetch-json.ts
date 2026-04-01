'use client'

export class AppFetchError extends Error {
  status?: number
  url: string
  payload?: unknown

  constructor(message: string, context: { status?: number; url: string; payload?: unknown }) {
    super(message)
    this.name = 'AppFetchError'
    this.status = context.status
    this.url = context.url
    this.payload = context.payload
  }
}

interface FetchJsonInit extends RequestInit {
  includeCredentials?: boolean
}

export async function fetchJson<T>(url: string, init?: FetchJsonInit): Promise<T> {
  const { includeCredentials = true, headers, ...requestInit } = init ?? {}

  const response = await fetch(url, {
    ...requestInit,
    credentials: includeCredentials ? 'include' : requestInit.credentials,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      (payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : null) || `Erro ao buscar ${url}`

    throw new AppFetchError(message, {
      status: response.status,
      url,
      payload,
    })
  }

  return payload as T
}

