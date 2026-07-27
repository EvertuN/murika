export type ApiPrimitive = string | number | boolean | null | undefined

export type ApiParams = Record<string, ApiPrimitive>

export type ApiEnvelope<T> = {
  success: boolean
  data?: T
  message?: string
  error?: string
  [key: string]: unknown
}

export const BASE_URL = '/api'
export const BASE_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': 'application/json'
}

export type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly requestId?: string

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

function toSearchParams(data: ApiParams): URLSearchParams {
  const searchParams = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  return searchParams
}

function mergeHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(BASE_HEADERS)

  if (typeof window !== 'undefined' && window.MURIKA_CSRF_TOKEN) {
    merged.set('X-CSRF-Token', window.MURIKA_CSRF_TOKEN)
  }

  if (!headers) {
    return merged
  }

  new Headers(headers).forEach((value, key) => {
    merged.set(key, value)
  })

  return merged
}

function handlePossibleAuthRedirect(response: Response): void {
  if (response.redirected && response.url.includes('/login')) {
    window.location.assign('/login?msg=expirou')
    throw new ApiError('Sessão expirada. Faça login novamente.', 401, 'SESSION_EXPIRED')
  }
}

async function parseApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  handlePossibleAuthRedirect(response)
  const text = await response.text()
  let payload: ApiEnvelope<T>

  try {
    payload = JSON.parse(text) as ApiEnvelope<T>
  } catch {
    throw new ApiError('A API retornou uma resposta inválida.', response.status, 'INVALID_API_RESPONSE')
  }

  return payload
}

function assertSuccess<T>(response: Response, payload: ApiEnvelope<T>): void {
  if (!response.ok || !payload.success) {
    if (payload.code === 'PASSWORD_CHANGE_REQUIRED' && typeof window !== 'undefined') {
      window.location.assign('/nova-senha')
    }
    throw new ApiError(
      payload.message || 'Não foi possível concluir a requisição.',
      response.status,
      typeof payload.code === 'string' ? payload.code : undefined,
      typeof payload.requestId === 'string' ? payload.requestId : undefined
    )
  }
}

export async function requestEnvelope<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: mergeHeaders(options.headers)
  })

  const payload = await parseApiEnvelope<T>(response)
  assertSuccess(response, payload)
  return payload
}

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await parseApiEnvelope<T>(response)
  assertSuccess(response, payload)
  return payload.data as T
}

export const api = {
  async get<T>(endpoint: string, params?: ApiParams): Promise<T> {
    const query = params ? `?${toSearchParams(params).toString()}` : ''
    const response = await fetch(`${BASE_URL}${endpoint}${query}`, {
      headers: mergeHeaders(),
      credentials: 'include'
    })
    return handleResponse<T>(response)
  },

  async post<T>(endpoint: string, data: ApiParams): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: mergeHeaders(),
      credentials: 'include',
      body: toSearchParams(data)
    })
    return handleResponse<T>(response)
  },

  async getEnvelope<T>(endpoint: string, params?: ApiParams): Promise<ApiEnvelope<T>> {
    const query = params ? `?${toSearchParams(params).toString()}` : ''
    return requestEnvelope<T>(`${BASE_URL}${endpoint}${query}`)
  },

  async postEnvelope<T>(endpoint: string, data: ApiParams): Promise<ApiEnvelope<T>> {
    return requestEnvelope<T>(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      body: toSearchParams(data)
    })
  }
}

export default api
