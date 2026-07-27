'use client'

import './ReservaListView.css'
import { useEffect } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import BasePagination from '@/shared/components/base/BasePagination'
import type { Reserva, ReservaAlertas } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import { formatDateBr, renderPagamentoBadge, renderStatusBadge } from './checkin-utils'

type Props = {
  reservas: Reserva[]
  loading: boolean
  isAdmin: boolean
  canWrite: boolean
  page: number
  totalPages: number
  alertas: ReservaAlertas | null
  actionsOpenId: number | null
  filtroStatus: string
  filtroOrigem: string
  filtroDataInicio: string
  filtroDataFim: string
  filtroCodigo: string
  filtroClienteEmpresa: string
  filtroSemPagamento: string
  onSetActionsOpenId: (updater: number | null | ((current: number | null) => number | null)) => void
  onChangeFiltroStatus: (value: string) => void
  onChangeFiltroOrigem: (value: string) => void
  onChangeFiltroDataInicio: (value: string) => void
  onChangeFiltroDataFim: (value: string) => void
  onChangeFiltroCodigo: (value: string) => void
  onChangeFiltroClienteEmpresa: (value: string) => void
  onChangeFiltroSemPagamento: (value: string) => void
  onRefresh: () => void
  onNew: () => void
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onEditStatus: (reserva: Reserva) => void
  onOpenPayments: (idReserva: number) => void
  onDelete: (idReserva: number) => void
}

export default function ReservaListView({
  reservas,
  loading,
  isAdmin,
  canWrite,
  page,
  totalPages,
  alertas,
  actionsOpenId,
  filtroStatus,
  filtroOrigem,
  filtroDataInicio,
  filtroDataFim,
  filtroCodigo,
  filtroClienteEmpresa,
  filtroSemPagamento,
  onSetActionsOpenId,
  onChangeFiltroStatus,
  onChangeFiltroOrigem,
  onChangeFiltroDataInicio,
  onChangeFiltroDataFim,
  onChangeFiltroCodigo,
  onChangeFiltroClienteEmpresa,
  onChangeFiltroSemPagamento,
  onRefresh,
  onNew,
  onClearFilters,
  onPageChange,
  onEditStatus,
  onOpenPayments,
  onDelete
}: Props) {
  const abertasSemPagamento = Number(alertas?.abertas_sem_pagamento || 0)
  const iraoFecharSemPagamento = Number(alertas?.irao_fechar_sem_pagamento || 0)
  const fechadasSemPagamento = Number(alertas?.fechadas_sem_pagamento || 0)
  const consumosPendentesPagamento = Number(alertas?.consumos_pendentes_pagamento || 0)
  const fechadasAutomaticamente = Number(alertas?.fechadas_automaticamente || 0)
  const mostrarAlertaReservas = abertasSemPagamento > 0 || iraoFecharSemPagamento > 0 || fechadasSemPagamento > 0 || consumosPendentesPagamento > 0 || fechadasAutomaticamente > 0
  const temAlertaSemPagamento = abertasSemPagamento > 0 || iraoFecharSemPagamento > 0 || fechadasSemPagamento > 0 || consumosPendentesPagamento > 0

  useEffect(() => {
    if (actionsOpenId === null) return

    const closeActions = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.AppHospedagem-actionDropdown')) return
      onSetActionsOpenId(null)
    }

    document.addEventListener('mousedown', closeActions)
    return () => document.removeEventListener('mousedown', closeActions)
  }, [actionsOpenId, onSetActionsOpenId])

  return (
    <>
      <div className="AppHospedagem-header">
        <h4 className="mb-0">Reserva</h4>
        <div className="d-flex gap-2">
          <BaseButton variant="outline-secondary" onClick={onClearFilters}>Limpar filtros</BaseButton>
          <BaseButton variant="outline-secondary" onClick={onRefresh}>Atualizar</BaseButton>
          {canWrite ? <BaseButton onClick={onNew}>
            <i className="fas fa-plus me-2" aria-hidden="true" />
            Nova Reserva
          </BaseButton> : null}
        </div>
      </div>

      <div className="AppHospedagem-filters">
        <div>
          <label>Pagamento</label>
          <select className="form-select" value={filtroSemPagamento} onChange={(event) => onChangeFiltroSemPagamento(event.target.value)}>
            <option value="">Todos</option>
            <option value="1">Sem pagamento</option>
            <option value="0">Com pagamento</option>
          </select>
        </div>
        <div>
          <label>Status</label>
          <select className="form-select" value={filtroStatus} onChange={(event) => onChangeFiltroStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="ABERTA">Aberta</option>
            <option value="FECHADA">Fechada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
        <div>
          <label>Origem</label>
          <select className="form-select" value={filtroOrigem} onChange={(event) => onChangeFiltroOrigem(event.target.value)}>
            <option value="">Todas</option>
            <option value="BALCAO">Balcão</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
        <div>
          <label>Cliente/Empresa</label>
          <input className="form-control" placeholder="Nome, documento, razão ou CNPJ" value={filtroClienteEmpresa} onChange={(event) => onChangeFiltroClienteEmpresa(event.target.value)} />
        </div>
        <div>
          <label>Código</label>
          <input className="form-control" placeholder="Código da reserva" value={filtroCodigo} onChange={(event) => onChangeFiltroCodigo(event.target.value)} />
        </div>
        <div>
          <label>Período (de)</label>
          <input type="date" className="form-control" value={filtroDataInicio} onChange={(event) => onChangeFiltroDataInicio(event.target.value)} />
        </div>
        <div>
          <label>Período (até)</label>
          <input type="date" className="form-control" value={filtroDataFim} onChange={(event) => onChangeFiltroDataFim(event.target.value)} />
        </div>
      </div>

      {mostrarAlertaReservas ? (
        <div className="AppHospedagem-reservaAlert" role="status" aria-live="polite">
          <div className="AppHospedagem-reservaAlertIcon">
            <i className="fas fa-exclamation-triangle" aria-hidden="true" />
          </div>
          <div className="AppHospedagem-reservaAlertBody">
            <strong>{temAlertaSemPagamento ? 'Atenção nas reservas sem pagamento' : 'Reservas fechadas automaticamente'}</strong>
            {temAlertaSemPagamento ? (
              <>
                {iraoFecharSemPagamento > 0 ? <span>{iraoFecharSemPagamento} reserva(s) irão fechar sem pagamento.</span> : null}
                {abertasSemPagamento > 0 ? <span>{abertasSemPagamento} reserva(s) abertas sem pagamento.</span> : null}
                {fechadasSemPagamento > 0 ? <span className="AppHospedagem-reservaAlertDanger">{fechadasSemPagamento} reserva(s) fechadas sem pagamento.</span> : null}
                {/* {consumosPendentesPagamento > 0 ? <span className="AppHospedagem-reservaAlertDanger">{consumosPendentesPagamento} consumo(s) pendente(s) de pagamento.</span> : null} */}
              </>
            ) : null}
            {fechadasAutomaticamente > 0 ? <small>{fechadasAutomaticamente} reserva(s) foram fechadas automaticamente agora.</small> : null}
          </div>
        </div>
      ) : null}

      <div className="table-responsive">
        <table className="table table-hover mb-0 AppHospedagem-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Quarto</th>
              <th>Cliente</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Situação</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center">Carregando...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan={9} className="text-center">Sem reservas</td></tr>
            ) : reservas.map((reserva) => {
              const podeEditarStatus = canWrite && (isAdmin || String(reserva.status || '').toUpperCase() !== 'FECHADA')

              return (
                <tr key={reserva.id_reserva}>
                  <td>{reserva.codigo_reserva || reserva.id_reserva}</td>
                  <td>Quarto {reserva.quarto_numero || reserva.id_quarto}</td>
                  <td>{reserva.cliente_nome || reserva.empresa_razao || '-'}</td>
                  <td>{reserva.origem}</td>
                  <td>{renderStatusBadge(reserva.status)}</td>
                  <td>{renderPagamentoBadge(reserva)}</td>
                  <td>{formatDateBr(reserva.data_checkin)}</td>
                  <td>{formatDateBr(reserva.data_checkout)}</td>
                  <td className="text-center">
                    <div className="dropdown d-inline-block AppHospedagem-actionDropdown">
                      <button
                        className="btn btn-sm btn-outline-secondary AppHospedagem-actionMenu"
                        type="button"
                        aria-expanded={actionsOpenId === reserva.id_reserva}
                        onClick={() => onSetActionsOpenId((current) => current === reserva.id_reserva ? null : reserva.id_reserva)}
                      >
                        <i className="fas fa-bars" aria-hidden="true" />
                        <i className="fas fa-chevron-down ms-2" aria-hidden="true" />
                      </button>
                      <ul className={`dropdown-menu AppHospedagem-dropdownMenu ${actionsOpenId === reserva.id_reserva ? 'show' : ''}`}>
                        {podeEditarStatus ? <li><button className="dropdown-item" type="button" onClick={() => { onSetActionsOpenId(null); onEditStatus(reserva) }}>Editar Status</button></li> : null}
                        <li><button className="dropdown-item" type="button" onClick={() => { onSetActionsOpenId(null); onOpenPayments(reserva.id_reserva) }}>Pagamentos</button></li>
                        {isAdmin ? <li><button className="dropdown-item text-danger" type="button" onClick={() => { onSetActionsOpenId(null); onDelete(reserva.id_reserva) }}>Excluir</button></li> : null}
                      </ul>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <BasePagination page={page} totalPages={totalPages} onChangePage={onPageChange} />
      </div>
    </>
  )
}
