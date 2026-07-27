'use client'

import BaseButton from '@/shared/components/base/BaseButton'
import type { Reserva } from '@/modules/hospedagem/services/hospedagem_reserva.service'

type Props = {
  reserva: Reserva
  status: string
  isAdmin: boolean
  onChangeStatus: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function ReservaStatusModal({ reserva, status, isAdmin, onChangeStatus, onClose, onSubmit }: Props) {
  const semPagamento = Number(reserva.sem_pagamento ?? 1) === 1 && Number(reserva.pagamentos_count ?? 0) === 0
  const fecharBloqueado = !isAdmin && semPagamento

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Editar Status - {reserva.codigo_reserva || reserva.id_reserva}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(event) => onChangeStatus(event.target.value)}>
                <option value="ABERTA">Aberto</option>
                <option value="FECHADA" disabled={fecharBloqueado}>Fechado</option>
                <option value="CANCELADA">Cancelado</option>
              </select>
              {fecharBloqueado ? (
                <div className="form-text text-danger">Somente admin pode fechar uma reserva sem pagamento.</div>
              ) : null}
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onClose}>Cancelar</BaseButton>
              <BaseButton variant="primary" onClick={onSubmit}>Salvar</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
