'use client'

import './EstoqueItemModal.css'
import BaseButton from '@/shared/components/base/BaseButton'
import type { EstoqueCategoria } from '@/modules/estoque/services/estoque-categoria.service'

export type EstoqueItemForm = {
  nome: string
  id_categoria: string
  preco_venda: string
}

type Props = {
  form: EstoqueItemForm
  editId: number | null
  categorias: EstoqueCategoria[]
  editOnlyPrice?: boolean
  onChange: (form: EstoqueItemForm) => void
  onClose: () => void
  onSubmit: () => void
}

export default function EstoqueItemModal({ form, editId, categorias, editOnlyPrice = false, onChange, onClose, onSubmit }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content EstoqueItemModal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editId ? 'Editar Item' : 'Novo Item'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-2">
                <div className="col-md-5">
                  <input className="form-control" placeholder="Nome" value={form.nome} disabled={editOnlyPrice} onChange={(event) => onChange({ ...form, nome: event.target.value })} />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={form.id_categoria} disabled={editOnlyPrice} onChange={(event) => onChange({ ...form, id_categoria: event.target.value })}>
                    <option value="">Categoria...</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id_categoria} value={String(categoria.id_categoria)}>{categoria.nome_categoria}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <input className="form-control" inputMode="decimal" placeholder="Preço sugerido" value={form.preco_venda} onChange={(event) => onChange({ ...form, preco_venda: event.target.value })} />
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
