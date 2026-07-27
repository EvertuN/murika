'use client'

import BaseButton from '@/shared/components/base/BaseButton'
import type { ReservaConsumo } from '@/modules/hospedagem/services/hospedagem_reserva.service'

type Props = {
  consumo: ReservaConsumo
  motivo: string
  onChangeMotivo: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConsumptionModal({ consumo, motivo, onChangeMotivo, onClose, onConfirm }: Props) {
  const motivoInvalido = motivo.trim().length === 0

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Excluir consumo</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p className="mb-3">
                Deseja excluir <strong>{consumo.nome_item || 'este consumo'}</strong> de{' '}
                <strong>{Number(consumo.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>?
              </p>
              <label className="form-label">Motivo</label>
              <textarea
                className={`form-control ${motivoInvalido ? 'is-invalid' : ''}`}
                maxLength={200}
                value={motivo}
                onChange={(event) => onChangeMotivo(event.target.value)}
              />
              <div className="invalid-feedback">Informe o motivo da exclusão.</div>
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onClose}>Cancelar</BaseButton>
              <BaseButton variant="danger" disabled={motivoInvalido} onClick={onConfirm}>Excluir</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
