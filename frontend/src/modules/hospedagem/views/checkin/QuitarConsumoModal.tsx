'use client'

import BaseButton from '@/shared/components/base/BaseButton'
import type { FormaPagamento, ReservaConsumo } from '@/modules/hospedagem/services/hospedagem_reserva.service'

export type QuitarConsumoForm = {
  forma_quitacao: 'PAGAR_AGORA' | 'COBRAR_NA_RESERVA' | 'A_PRAZO'
  id_forma_pagamento: string
  codigo_autorizacao: string
  observacao: string
}

type Props = {
  consumo: ReservaConsumo
  form: QuitarConsumoForm
  formasPagamento: FormaPagamento[]
  errors: string[]
  tentouEnviar: boolean
  salvando?: boolean
  onChange: (form: QuitarConsumoForm) => void
  onClose: () => void
  onConfirm: () => void
}

export default function QuitarConsumoModal({
  consumo,
  form,
  formasPagamento,
  errors,
  tentouEnviar,
  salvando = false,
  onChange,
  onClose,
  onConfirm
}: Props) {
  const formaSelecionada = formasPagamento.find((forma) => String(forma.id_forma_pagamento) === form.id_forma_pagamento)
  const formaNome = (formaSelecionada?.nome_forma_pagamento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const exigeCodigo = formaNome.includes('PIX') || formaNome.includes('CREDITO') || formaNome.includes('DEBITO')
  const codigoLabel = formaNome.includes('PIX') ? 'ID/Transação' : 'Código AUT'

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Quitar consumo</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {tentouEnviar && errors.length > 0 ? (
                <div className="alert alert-danger">
                  {errors.map((error) => <div key={error}>{error}</div>)}
                </div>
              ) : null}

              <div className="alert alert-light border py-2">
                <strong>{consumo.nome_item || 'Consumo'}</strong> - {Number(consumo.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>

              <div className="mb-3">
                <label className="form-label">Forma de quitação</label>
                <select
                  className="form-select"
                  value={form.forma_quitacao}
                  onChange={(event) => onChange({
                    ...form,
                    forma_quitacao: event.target.value as QuitarConsumoForm['forma_quitacao'],
                    id_forma_pagamento: '',
                    codigo_autorizacao: ''
                  })}
                >
                  <option value="PAGAR_AGORA">Pagar agora</option>
                  <option value="COBRAR_NA_RESERVA">Na reserva</option>
                  <option value="A_PRAZO">Pagamento corporativo / a prazo</option>
                </select>
              </div>

              {form.forma_quitacao === 'PAGAR_AGORA' ? (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Forma de pagamento</label>
                    <select className="form-select" value={form.id_forma_pagamento} onChange={(event) => onChange({ ...form, id_forma_pagamento: event.target.value, codigo_autorizacao: '' })}>
                      <option value="">Selecione</option>
                      {formasPagamento.map((forma) => (
                        <option key={forma.id_forma_pagamento} value={String(forma.id_forma_pagamento)}>{forma.nome_forma_pagamento}</option>
                      ))}
                    </select>
                  </div>
                  {exigeCodigo ? (
                    <div className="col-md-6">
                      <label className="form-label">{codigoLabel}</label>
                      <input className="form-control" maxLength={6} value={form.codigo_autorizacao} onChange={(event) => onChange({ ...form, codigo_autorizacao: event.target.value.slice(0, 6) })} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3">
                <label className="form-label">Observação</label>
                <textarea className="form-control" rows={3} value={form.observacao} onChange={(event) => onChange({ ...form, observacao: event.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onClose}>Cancelar</BaseButton>
              <BaseButton variant="primary" disabled={salvando} onClick={onConfirm}>
                {salvando ? 'Salvando...' : 'Quitar'}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
