'use client'

import './PagamentoFormView.css'
import BaseButton from '@/shared/components/base/BaseButton'
import type { FormaPagamento } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import { formatMoneyInput, renderAlertList } from './checkin-utils'

export type PagamentoForm = {
  id_forma_pagamento: string
  valor: string
  data_pagamento: string
  codigo_autorizacao: string
  numero_nf: string
  is_prazo: boolean
  observacao: string
}

type Props = {
  form: PagamentoForm
  formasPagamento: FormaPagamento[]
  tentouEnviar: boolean
  errors: string[]
  exigeCodigoPagamento: boolean
  codigoPagamentoPlaceholder: string
  showSubmit?: boolean
  onChange: (form: PagamentoForm) => void
  onSubmit: () => void
}

export default function PagamentoFormView({
  form,
  formasPagamento,
  tentouEnviar,
  errors,
  exigeCodigoPagamento,
  codigoPagamentoPlaceholder,
  showSubmit = true,
  onChange,
  onSubmit
}: Props) {
  return (
    <div className="AppHospedagem-paymentCard">
      {tentouEnviar ? renderAlertList(errors) : null}
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label">Valor</label>
          <div className="input-group">
            <span className="input-group-text">R$</span>
            <input className="form-control" inputMode="decimal" placeholder="0,00" value={form.valor} onChange={(event) => onChange({ ...form, valor: formatMoneyInput(event.target.value) })} />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Data</label>
          <input type="date" className="form-control" value={form.data_pagamento} onChange={(event) => onChange({ ...form, data_pagamento: event.target.value })} />
        </div>
      </div>
      <label className="AppHospedagem-switch AppHospedagem-paymentSwitch">
        <input
          type="checkbox"
          checked={form.is_prazo}
          onChange={(event) => onChange({
            ...form,
            is_prazo: event.target.checked,
            id_forma_pagamento: event.target.checked ? '' : form.id_forma_pagamento,
            codigo_autorizacao: event.target.checked ? '' : form.codigo_autorizacao,
            numero_nf: ''
          })}
        />
        <span />
        Pagamento a prazo
      </label>
      {!form.is_prazo ? (
        <>
          <label className="form-label">Forma de Pagamento</label>
          <select className="form-select mb-3" value={form.id_forma_pagamento} onChange={(event) => onChange({ ...form, id_forma_pagamento: event.target.value })}>
            <option value="">Selecione...</option>
            {formasPagamento.map((forma) => (
              <option key={forma.id_forma_pagamento} value={String(forma.id_forma_pagamento)}>{forma.nome_forma_pagamento}</option>
            ))}
          </select>
        </>
      ) : null}
      {exigeCodigoPagamento && !form.is_prazo ? (
        <div className="mt-3">
          <label className="form-label">{codigoPagamentoPlaceholder}</label>
          <input className="form-control" maxLength={6} value={form.codigo_autorizacao} onChange={(event) => onChange({ ...form, codigo_autorizacao: event.target.value.slice(0, 6) })} />
        </div>
      ) : null}
      <label className="form-label mt-3">Observação</label>
      <textarea className="form-control" rows={3} value={form.observacao} onChange={(event) => onChange({ ...form, observacao: event.target.value })} />
      {showSubmit ? <BaseButton className="mt-3" block onClick={onSubmit}>
        <i className="fas fa-plus-circle me-2" aria-hidden="true" />
        Adicionar Pagamento
      </BaseButton> : null}
    </div>
  )
}
