'use client'

import './EstoqueCategoriaModal.css'
import BaseButton from '@/shared/components/base/BaseButton'

type Props = {
  value: string
  editId: number | null
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function EstoqueCategoriaModal({ value, editId, onChange, onClose, onSubmit }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content EstoqueCategoriaModal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editId ? 'Editar Categoria' : 'Nova Categoria'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-2">
                <div className="col-12">
                  <input className="form-control" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Nome da categoria" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onClose}>Cancelar</BaseButton>
              <BaseButton onClick={onSubmit}>{editId ? 'Salvar' : 'Cadastrar'}</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
