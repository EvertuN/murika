'use client'

import './EmpresaFormModal.css'
import BaseButton from '@/shared/components/base/BaseButton'

export type EmpresaForm = {
  razao_social: string
  cnpj: string
  telefone: string
  email: string
}

type Props = {
  form: EmpresaForm
  editId: number | null
  error?: string
  onChange: (form: EmpresaForm) => void
  onClose: () => void
  onSubmit: () => void
}

export default function EmpresaFormModal({ form, editId, error = '', onChange, onClose, onSubmit }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content EmpresaFormModal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editId ? 'Editar Empresa' : 'Nova Empresa'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
              <div className="row g-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Razão social" value={form.razao_social} onChange={(event) => onChange({ ...form, razao_social: event.target.value })} />
                </div>
                <div className="col-md-5">
                  <input className="form-control cnpj" placeholder="CNPJ" value={form.cnpj} onChange={(event) => onChange({ ...form, cnpj: event.target.value })} />
                </div>
                <div className="col-md-4">
                  <input className="form-control phone-mask" placeholder="Telefone" value={form.telefone} onChange={(event) => onChange({ ...form, telefone: event.target.value })} />
                </div>
                <div className="col-md-4">
                  <input className="form-control" placeholder="Email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} />
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
