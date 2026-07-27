'use client'

import './AuthAdminLogsView.css'
import { useCallback, useEffect, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import BasePagination from '@/shared/components/base/BasePagination'
import authLogService from '@/modules/auth/services/auth-log.service'
import type { AuthLogDetail, AuthLogEntry, AuthLogFilter } from '@/modules/auth/types/auth'

function parseDetails(details: AuthLogDetail) {
  if (typeof details !== 'string') return details

  try {
    return JSON.parse(details)
  } catch {
    return details
  }
}

function getLogJson(entry: AuthLogEntry) {
  return {
    ...entry,
    details: parseDetails(entry.details ?? null)
  }
}

function formatLogDate(value?: string | null) {
  if (!value) return '-'

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (match) {
    const [, year, month, day, hour = '00', minute = '00', second = '00'] = match
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

export default function AuthAdminLogsView() {
  const [logs, setLogs] = useState<AuthLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<AuthLogFilter>('all')
  const [selectedLog, setSelectedLog] = useState<AuthLogEntry | null>(null)

  const load = useCallback(async (nextPage = 1, nextFilter: AuthLogFilter = 'all') => {
    setLoading(true)
    setErro('')
    try {
      const response = await authLogService.listarAdmin(nextPage, nextFilter)
      setLogs(response.data)
      setPage(response.pagination?.current_page || 1)
      setTotalPages(response.pagination?.total_pages || 1)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar logs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1, filter)
  }, [filter, load])

  return (
    <div className="AuthAdminLogsView-view card">
      <div className="AuthAdminLogsView-header">
        <div>
          <h4 className="mb-1">Logs Admin</h4>
          <p className="AuthAdminLogsView-subtitle">Eventos de autenticação, acesso e operações do sistema.</p>
        </div>
      </div>
      {erro ? <div className="alert alert-danger">{erro}</div> : null}

      <div className="AuthAdminLogsView-filters">
        <div>
          <label className="form-label">Categoria</label>
          <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value as AuthLogFilter)}>
            <option value="all">Todos</option>
            <option value="access">Acesso</option>
            <option value="system">Sistema</option>
            <option value="reports">Relatórios</option>
          </select>
        </div>
        <div className="AuthAdminLogsView-filterActions">
          <BaseButton variant="outline-secondary" onClick={() => void load(1, filter)}>
            <i className="fas fa-filter" /> Filtrar
          </BaseButton>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover mb-0 AuthAdminLogsView-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Usuário</th>
              <th>Ação</th>
              <th>Categoria</th>
              <th>IP</th>
              <th>Fonte</th>
              <th className="text-center">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center">Carregando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={8} className="text-center">Sem logs</td></tr>
            ) : logs.map((entry) => (
              <tr key={String(entry.id)}>
                <td className="AuthAdminLogsView-idCell">#{String(entry.id)}</td>
                <td className="AuthAdminLogsView-dateCell">{formatLogDate(entry.created_at)}</td>
                <td>{entry.user_name || 'Sistema'}</td>
                <td><span className="AuthAdminLogsView-actionBadge">{entry.action}</span></td>
                <td>{entry.category ? <span className="AuthAdminLogsView-categoryBadge">{entry.category}</span> : '-'}</td>
                <td>{entry.ip || '-'}</td>
                <td>{entry.log_source || '-'}</td>
                <td className="text-center">
                  <button type="button" className="AuthAdminLogsView-detailButton" onClick={() => setSelectedLog(entry)}>
                    <i className="fas fa-eye" /> Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <BasePagination page={page} totalPages={totalPages} disabled={loading} onChangePage={(nextPage) => void load(nextPage, filter)} />
      </div>

      {selectedLog ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content AuthAdminLogsView-modal">
                <div className="modal-header">
                  <h5 className="modal-title">JSON completo do log #{String(selectedLog.id)}</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedLog(null)} />
                </div>
                <div className="modal-body">
                  <pre className="AuthAdminLogsView-json">{JSON.stringify(getLogJson(selectedLog), null, 2)}</pre>
                </div>
                <div className="modal-footer">
                  <BaseButton variant="outline-secondary" onClick={() => setSelectedLog(null)}>Fechar</BaseButton>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}


