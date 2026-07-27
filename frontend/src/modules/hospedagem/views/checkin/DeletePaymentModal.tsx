'use client'

import BaseButton from '@/shared/components/base/BaseButton'
import type { Pagamento } from '@/modules/hospedagem/services/hospedagem_reserva.service'

type Props = {
  pagamento: Pagamento
  onClose: () => void
  onConfirm: () => void
}

export default function DeletePaymentModal({ pagamento, onClose, onConfirm }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar exclusão</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              Deseja excluir o pagamento de <strong>{Number(pagamento.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>?
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onClose}>Cancelar</BaseButton>
              <BaseButton variant="danger" onClick={onConfirm}>Excluir</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
