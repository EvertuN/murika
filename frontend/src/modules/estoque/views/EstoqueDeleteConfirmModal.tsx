'use client'

import './EstoqueDeleteConfirmModal.css'
import BaseButton from '@/shared/components/base/BaseButton'

type Props = {
  itemType: 'categoria' | 'item'
  label: string
  onCancel: () => void
  onConfirm: () => void
}

export default function EstoqueDeleteConfirmModal({ itemType, label, onCancel, onConfirm }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content EstoqueDeleteConfirmModal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar exclusão</h5>
              <button type="button" className="btn-close" onClick={onCancel} />
            </div>
            <div className="modal-body">
              Deseja excluir {itemType === 'categoria' ? 'a categoria' : 'o item'} <strong>{label}</strong>?
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onCancel}>Cancelar</BaseButton>
              <BaseButton variant="danger" onClick={onConfirm}>Excluir</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
