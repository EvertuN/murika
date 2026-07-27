'use client'

import './ClienteFormModal.css'
import BaseButton from '@/shared/components/base/BaseButton'

export type ClienteForm = {
  nome: string
  email: string
  telefone: string
  tipo_documento: string
  documento: string
}

type Props = {
  form: ClienteForm
  editId: number | null
  error?: string
  onChange: (form: ClienteForm) => void
  onClose: () => void
  onSubmit: () => void
}

function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '')
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPassaporte(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase()
}

export default function ClienteFormModal({ form, editId, error = '', onChange, onClose, onSubmit }: Props) {
  const handleDocumentoChange = (value: string) => {
    const documento = form.tipo_documento === 'CPF' ? formatCpf(value) : formatPassaporte(value)
    onChange({ ...form, documento })
  }

  const handleTipoDocumentoChange = (tipo_documento: string) => {
    const documento = tipo_documento === 'CPF' ? formatCpf(form.documento) : formatPassaporte(form.documento)
    onChange({ ...form, tipo_documento, documento })
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content ClienteFormModal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
              <div className="row g-2">
                <div className="col-md-4">
                  <input className="form-control" placeholder="Nome" value={form.nome} onChange={(event) => onChange({ ...form, nome: event.target.value })} />
                </div>
                <div className="col-md-4">
                  <input className="form-control" placeholder="Email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} />
                </div>
                <div className="col-md-4">
                  <input className="form-control phone-mask" placeholder="Telefone" value={form.telefone} onChange={(event) => onChange({ ...form, telefone: event.target.value })} />
                </div>
                <div className="col-md-2">
                  <select className="form-select" value={form.tipo_documento} onChange={(event) => handleTipoDocumentoChange(event.target.value)}>
                    <option value="CPF">CPF</option>
                    <option value="passaporte">Passaporte</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <input className="form-control" name="documento" placeholder="Documento" value={form.documento}
                    onChange={(event) => handleDocumentoChange(event.target.value)} />
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
