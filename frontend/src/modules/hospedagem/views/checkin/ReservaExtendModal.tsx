'use client'

import BaseButton from '@/shared/components/base/BaseButton'

type Props = {
  checkout: string
  motivo: string
  onChangeCheckout: (value: string) => void
  onChangeMotivo: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function ReservaExtendModal({ checkout, motivo, onChangeCheckout, onChangeMotivo, onClose, onSubmit }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Estender estadia</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <label className="form-label">Novo checkout</label>
              <input type="date" className="form-control" value={checkout} onChange={(event) => onChangeCheckout(event.target.value)} />
              <label className="form-label mt-3">Motivo/observação</label>
              <textarea className="form-control" rows={3} value={motivo} onChange={(event) => onChangeMotivo(event.target.value)} />
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
