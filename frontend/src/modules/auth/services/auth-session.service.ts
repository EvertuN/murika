import type {
  AuthBootstrapPayload,
  AuthPermissions,
  AuthenticatedUser,
  AuthRole,
  AuthState,
  SessionStatus
} from '@/modules/auth/types/auth'

const DEFAULT_PERMISSIONS: AuthPermissions = {
  manageUsers: false,
  manageEmployees: false,
  viewFinancial: false,
  viewReports: false,
  operationalWrite: false
}

function isRole(value: unknown): value is AuthRole {
  return value === 'admin' || value === 'recepcao' || value === 'financeiro'
}

function isSessionStatus(value: unknown): value is SessionStatus {
  return value === 'unknown' || value === 'authenticated' || value === 'anonymous' || value === 'expired'
}

function normalizeUser(input: Partial<AuthenticatedUser> | null | undefined): AuthenticatedUser | null {
  if (!input || typeof input.id !== 'string' || typeof input.nome !== 'string' || !isRole(input.role)) {
    return null
  }

  return {
    id: input.id,
    nome: input.nome,
    email: typeof input.email === 'string' ? input.email : '',
    role: input.role,
    idFuncionario: typeof input.idFuncionario === 'number' ? input.idFuncionario : null,
    requiresPasswordChange: Boolean(input.requiresPasswordChange)
  }
}

function permissionsForRole(role: AuthRole | null): AuthPermissions {
  return {
    manageUsers: role === 'admin',
    manageEmployees: role === 'admin',
    viewFinancial: role === 'admin' || role === 'financeiro',
    viewReports: role === 'admin' || role === 'financeiro',
    operationalWrite: role === 'admin' || role === 'recepcao'
  }
}

function normalizePayload(payload: AuthBootstrapPayload): AuthState {
  const user = normalizeUser(payload.user)
  const rolePermissions = permissionsForRole(user?.role ?? null)
  const permissions = {
    ...DEFAULT_PERMISSIONS,
    ...rolePermissions,
    ...(payload.permissions ?? {})
  }

  return {
    status: isSessionStatus(payload.status)
      ? payload.status
      : (user ? 'authenticated' : 'anonymous'),
    user,
    serverTimeNow: typeof payload.serverTimeNow === 'number' ? payload.serverTimeNow : null,
    sessionTimeoutSeconds:
      typeof payload.sessionTimeoutSeconds === 'number'
        ? payload.sessionTimeoutSeconds
        : 43200,
    permissions
  }
}

function applyPayloadToWindow(payload: AuthBootstrapPayload): void {
  window.MURIKA_AUTH_BOOTSTRAP = payload
  window.MURIKA_AUTH_USER = payload.user ?? null
  window.MURIKA_AUTH_STATUS = payload.status ?? undefined
  window.SERVER_TIME_NOW = payload.serverTimeNow ?? undefined
  window.MURIKA_SESSION_TIMEOUT = payload.sessionTimeoutSeconds ?? undefined
  window.MURIKA_CSRF_TOKEN = payload.csrfToken ?? undefined
  window.MURIKA_IS_ADMIN = Boolean(payload.isAdmin)
}

export function getAuthBootstrapPayload(): AuthBootstrapPayload {
  if (typeof window === 'undefined') {
    return { user: null, status: 'anonymous' }
  }

  return window.MURIKA_AUTH_BOOTSTRAP ?? {
    user: window.MURIKA_AUTH_USER ?? null,
    status: window.MURIKA_AUTH_STATUS ?? null,
    serverTimeNow: window.SERVER_TIME_NOW ?? null,
    sessionTimeoutSeconds: window.MURIKA_SESSION_TIMEOUT ?? null,
    csrfToken: window.MURIKA_CSRF_TOKEN ?? null,
    isAdmin: Boolean(window.MURIKA_IS_ADMIN)
  }
}

export function getBootstrapAuthState(): AuthState {
  return normalizePayload(getAuthBootstrapPayload())
}

export function hasWindowAuthBootstrap(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.MURIKA_AUTH_BOOTSTRAP || window.MURIKA_AUTH_USER)
}

export async function loadPhpAuthSession(): Promise<AuthState> {
  const response = await fetch('/api/auth_session', {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
  })

  const envelope = await response.json() as {
    success?: boolean
    data?: AuthBootstrapPayload
    message?: string
  }

  if (!response.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Sessão PHP ausente ou expirada.')
  }

  applyPayloadToWindow(envelope.data)
  return normalizePayload(envelope.data)
}

export function isSessionExpired(): boolean {
  return false
}

export function redirectToLogout(path = '/logout'): void {
  if (typeof window !== 'undefined') {
    window.location.assign(path)
  }
}
