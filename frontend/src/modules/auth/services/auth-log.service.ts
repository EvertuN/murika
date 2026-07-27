import { api, type ApiEnvelope } from '@/shared/services/api'
import type {
  AuthLogEntry,
  AuthLogFilter,
  AuthLogListResult,
  AuthLogPagination
} from '@/modules/auth/types/auth'

type AuthLogListEnvelope = ApiEnvelope<AuthLogEntry[]> & {
  pagination?: AuthLogPagination
}

function normalizePagination(pagination?: AuthLogPagination): AuthLogPagination | null {
  if (!pagination) {
    return null
  }

  return {
    current_page: pagination.current_page,
    total_pages: pagination.total_pages,
    total_records: pagination.total_records
  }
}

export const authLogService = {
  async listarAdmin(page = 1, filter: AuthLogFilter = 'all'): Promise<AuthLogListResult> {
    const payload = (await api.getEnvelope<AuthLogEntry[]>('/sistema_logs', {
      acao: 'listar_admin',
      page,
      type: filter
    })) as AuthLogListEnvelope

    return {
      data: payload.data ?? [],
      pagination: normalizePagination(payload.pagination)
    }
  },

  async listarUsuario(): Promise<AuthLogEntry[]> {
    return api.get<AuthLogEntry[]>('/sistema_logs', { acao: 'listar_usuario' })
  }
}

export default authLogService
