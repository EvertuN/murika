'use client'

import BaseButton from '@/shared/components/base/BaseButton'
import type { FormaPagamento } from '@/modules/hospedagem/services/hospedagem_reserva.service'

export type ConsumoForm = {
  id_item: string
  quantidade: string
  valor_unitario: string
  justificativa_valor: string
  forma_cobranca: 'PAGAR_AGORA' | 'COBRAR_NA_RESERVA' | 'REGISTRAR_SEM_PAGAMENTO'
  id_forma_pagamento: string
  codigo_autorizacao: string
  is_prazo: boolean
  observacao: string
}

type Props = {
  form: ConsumoForm
  itens: Array<{ id_item: number | string; nome: string; preco_venda?: number | string }>
  formasPagamento: FormaPagamento[]
  tentouEnviar: boolean
  errors: string[]
  salvando?: boolean
  permitePagamentoCorporativo?: boolean
  isAdmin: boolean
  onChange: (form: ConsumoForm) => void
  onSubmit: () => void
}

export default function ConsumoFormView({
  form,
  itens,
  formasPagamento,
  tentouEnviar,
  errors,
  salvando = false,
  permitePagamentoCorporativo = false,
  isAdmin,
  onChange,
  onSubmit
}: Props) {
  const itemSelecionado = itens.find((item) => String(item.id_item) === form.id_item)
  const precoSugerido = Number(itemSelecionado?.preco_venda || 0)
  const valorAplicado = form.valor_unitario === '' ? precoSugerido : Number(form.valor_unitario)
  const valorAlterado = Math.abs(valorAplicado - precoSugerido) >= 0.005
  const valorTotal = valorAplicado * Math.max(0, Number(form.quantidade) || 0)
  const formaSelecionada = formasPagamento.find((forma) => String(forma.id_forma_pagamento) === form.id_forma_pagamento)
  const formaNome = (formaSelecionada?.nome_forma_pagamento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const pagamentoCorporativo = permitePagamentoCorporativo && form.is_prazo
  const registrarSemPagamento = form.forma_cobranca === 'REGISTRAR_SEM_PAGAMENTO' && !pagamentoCorporativo
  const cobrarNaReserva = form.forma_cobranca === 'COBRAR_NA_RESERVA' && !pagamentoCorporativo
  const pagarAgora = form.forma_cobranca === 'PAGAR_AGORA' && !pagamentoCorporativo
  const exigeCodigo = formaNome.includes('PIX') || formaNome.includes('CREDITO') || formaNome.includes('DEBITO')
  const codigoLabel = formaNome.includes('PIX') ? 'ID/Transação' : 'Código AUT'

  return (
    <div className="AppHospedagem-paymentForm">
      {tentouEnviar && errors.length > 0 ? (
        <div className="alert alert-danger">
          {errors.map((error) => <div key={error}>{error}</div>)}
        </div>
      ) : null}

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Quantidade</label>
          <input className="form-control" type="number" min={1} value={form.quantidade} onChange={(event) => onChange({ ...form, quantidade: event.target.value })} />
        </div>
        <div className="col-md-8">
          <label className="form-label">Item</label>
          <select className="form-select" value={form.id_item} onChange={(event) => {
            const idItem = event.target.value
            const selecionado = itens.find((item) => String(item.id_item) === idItem)
            onChange({ ...form, id_item: idItem, valor_unitario: selecionado ? String(Number(selecionado.preco_venda || 0).toFixed(2)) : '', justificativa_valor: '' })
          }}>
            <option value="">Selecione</option>
            {itens.map((item) => <option key={String(item.id_item)} value={String(item.id_item)}>{item.nome}</option>)}
          </select>
        </div>
      </div>

      {form.id_item ? <div className="row g-3 mt-1">
        <div className="col-md-4">
          <label className="form-label">Valor unitário</label>
          <input className="form-control" type="number" min="0" step="0.01" disabled={!isAdmin} value={form.valor_unitario} onChange={(event) => onChange({ ...form, valor_unitario: event.target.value })} />
          <small className="text-muted">Sugerido: {precoSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</small>
        </div>
        {valorAlterado ? <div className="col-md-8">
          <label className="form-label">Justificativa da alteração</label>
          <input className="form-control" maxLength={255} value={form.justificativa_valor} onChange={(event) => onChange({ ...form, justificativa_valor: event.target.value })} />
        </div> : null}
      </div> : null}

      {!pagamentoCorporativo ? <div className="mt-3">
        <label className="form-label">Cobrança</label>
        <select
          className="form-select"
          value={form.forma_cobranca}
          onChange={(event) => onChange({
            ...form,
            forma_cobranca: event.target.value as ConsumoForm['forma_cobranca'],
            id_forma_pagamento: '',
            codigo_autorizacao: ''
          })}
        >
          <option value="PAGAR_AGORA">Pagar agora</option>
          <option value="REGISTRAR_SEM_PAGAMENTO">Pendente</option>
          <option value="COBRAR_NA_RESERVA">Na reserva</option>
        </select>
      </div> : null}

      {permitePagamentoCorporativo ? (
        <label className="AppHospedagem-switch mt-3">
          <input
            type="checkbox"
            checked={form.is_prazo}
            onChange={(event) => onChange({
              ...form,
              is_prazo: event.target.checked,
              forma_cobranca: event.target.checked ? 'PAGAR_AGORA' : form.forma_cobranca,
              id_forma_pagamento: event.target.checked ? '' : form.id_forma_pagamento,
              codigo_autorizacao: event.target.checked ? '' : form.codigo_autorizacao
            })}
          />
          <span />
          Pagamento corporativo
        </label>
      ) : null}

      {pagarAgora ? (
        <div className="row g-3 mt-1">
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

      {valorTotal > 0 ? (
        <div className="alert alert-light border py-2 mt-3">
          Total do consumo: <strong>{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
      ) : null}

      {cobrarNaReserva ? (
        <div className="alert alert-warning py-2 mt-3">
          Soma o valor à conta da reserva.
        </div>
      ) : null}

      {registrarSemPagamento ? (
        <div className="alert alert-warning py-2 mt-3">
          Cobrado no checkout ou pagamento final.
        </div>
      ) : null}

      {pagamentoCorporativo ? (
        <div className="alert alert-light border py-2 mt-3">
          Este consumo será lançado como a prazo e aparecerá nos totais financeiros do período.
        </div>
      ) : null}

      <div className="mt-3">
        <label className="form-label">Observação</label>
        <textarea className="form-control" rows={3} value={form.observacao} onChange={(event) => onChange({ ...form, observacao: event.target.value })} />
      </div>

      <BaseButton className="mt-3" disabled={salvando} onClick={onSubmit}>
        <i className="fas fa-cart-plus me-2" aria-hidden="true" />
        {salvando ? 'Salvando...' : 'Adicionar consumo'}
      </BaseButton>
    </div>
  )
}
