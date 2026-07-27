export type AuthRole = 'admin' | 'recepcao' | 'financeiro'

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous' | 'expired'

export type AuthPermissions = {
  manageUsers: boolean
  manageEmployees: boolean
  viewFinancial: boolean
  viewReports: boolean
  operationalWrite: boolean
}

export type AuthenticatedUser = {
  id: string
  nome: string
  email: string
  role: AuthRole
  idFuncionario: number | null
  requiresPasswordChange: boolean
}

export type AuthBootstrapPayload = {
  user?: Partial<AuthenticatedUser> | null
  status?: SessionStatus | null
  serverTimeNow?: number | null
  sessionTimeoutSeconds?: number | null
  csrfToken?: string | null
  isAdmin?: boolean
  permissions?: Partial<AuthPermissions>
}

export type AuthState = {
  status: SessionStatus
  user: AuthenticatedUser | null
  serverTimeNow: number | null
  sessionTimeoutSeconds: number
  permissions: AuthPermissions
}

export type AuthLogFilter = 'all' | 'access' | 'system' | 'reports'

export type AuthLogDetail =
  | string
  | Record<string, unknown>
  | Array<unknown>
  | null

export type AuthLogEntry = {
  id: number | string
  user_id?: string | null
  action: string
  category?: string | null
  ip?: string | null
  created_at: string
  user_name?: string | null
  details?: AuthLogDetail
  log_source?: string | null
}

export type AuthLogPagination = {
  current_page: number
  total_pages: number
  total_records: number
}

export type AuthLogListResult = {
  data: AuthLogEntry[]
  pagination: AuthLogPagination | null
}
