'use client'

import './ReservaFormView.css'
import { useState, type Ref } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import type { Cliente, Empresa, Quarto } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import type { FormaPagamento } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import { formatMoneyInput, parseMoneyToDecimal, renderAlertList } from './checkin-utils'
import PagamentoFormView, { type PagamentoForm } from './PagamentoFormView'

export type ReservaForm = {
  id_quarto: string
  id_cliente: string
  id_empresa: string
  origem: string
  data_checkin: string
  data_checkout: string
  valor_estadia: string
  diarias: ReservaDiariaForm[]
  sem_pagamento_inicial: boolean
  observacao: string
}

export type ReservaDiariaForm = {
  data: string
  valor: string
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const parseDateInput = (value: string): Date | null => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildDailyDates = (checkin: string, checkout: string): string[] => {
  const start = parseDateInput(checkin)
  const end = parseDateInput(checkout)
  if (!start || !end || end <= start) return []

  const dates: string[] = []
  const current = new Date(start)
  while (current < end) {
    dates.push(formatDateInput(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

const formatDecimalMoneyInput = (value: number): string => (
  value > 0
    ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''
)

const sumDailyValues = (diarias: ReservaDiariaForm[]): number => (
  diarias.reduce((total, diaria) => total + Number(parseMoneyToDecimal(diaria.valor) || 0), 0)
)

const formatDailyDate = (value: string): string => {
  const date = parseDateInput(value)
  return date
    ? date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : value
}

type Props = {
  form: ReservaForm
  quartos: Quarto[]
  clientesFiltrados: Cliente[]
  empresasFiltradas: Empresa[]
  clienteBusca: string
  empresaBusca: string
  clienteBuscaAberta: boolean
  empresaBuscaAberta: boolean
  clienteBuscaRef: Ref<HTMLDivElement>
  empresaBuscaRef: Ref<HTMLDivElement>
  tentouEnviar: boolean
  errors: string[]
  pagamentoForm: PagamentoForm
  formasPagamento: FormaPagamento[]
  pagamentoErrors: string[]
  exigeCodigoPagamento: boolean
  codigoPagamentoPlaceholder: string
  minCheckin?: string
  minCheckout?: string
  maxCheckout?: string
  onChangeForm: (form: ReservaForm) => void
  onChangePagamentoForm: (form: PagamentoForm) => void
  onChangeClienteBusca: (value: string) => void
  onChangeEmpresaBusca: (value: string) => void
  onSetClienteBuscaAberta: (value: boolean) => void
  onSetEmpresaBuscaAberta: (value: boolean) => void
  onNavigateCliente: () => void
  onNavigateEmpresa: () => void
  onBack: () => void
  onSubmit: () => void
}

export default function ReservaFormView({
  form,
  quartos,
  clientesFiltrados,
  empresasFiltradas,
  clienteBusca,
  empresaBusca,
  clienteBuscaAberta,
  empresaBuscaAberta,
  clienteBuscaRef,
  empresaBuscaRef,
  tentouEnviar,
  errors,
  pagamentoForm,
  formasPagamento,
  pagamentoErrors,
  exigeCodigoPagamento,
  codigoPagamentoPlaceholder,
  minCheckin,
  minCheckout,
  maxCheckout,
  onChangeForm,
  onChangePagamentoForm,
  onChangeClienteBusca,
  onChangeEmpresaBusca,
  onSetClienteBuscaAberta,
  onSetEmpresaBuscaAberta,
  onNavigateCliente,
  onNavigateEmpresa,
  onBack,
  onSubmit
}: Props) {
  const [editingDailyValues, setEditingDailyValues] = useState(false)
  const [bulkDailyValue, setBulkDailyValue] = useState('')
  const selectedRoom = quartos.find((quarto) => String(quarto.id_quarto) === form.id_quarto)
  const dailyTotal = sumDailyValues(form.diarias)

  const syncDailyValues = (diarias: ReservaDiariaForm[], nextForm: ReservaForm = form) => {
    const total = formatDecimalMoneyInput(sumDailyValues(diarias))
    onChangeForm({ ...nextForm, diarias, valor_estadia: total })
    onChangePagamentoForm({ ...pagamentoForm, valor: total })
  }

  const rebuildDailyValues = (nextForm: ReservaForm, defaultValue: number, preserveExisting: boolean) => {
    const previousValues = new Map(form.diarias.map((diaria) => [diaria.data, diaria.valor]))
    const defaultFormatted = formatDecimalMoneyInput(defaultValue)
    const diarias = buildDailyDates(nextForm.data_checkin, nextForm.data_checkout).map((data) => ({
      data,
      valor: preserveExisting ? previousValues.get(data) || defaultFormatted : defaultFormatted
    }))
    syncDailyValues(diarias, nextForm)
  }

  const updateDailyValue = (data: string, value: string) => {
    syncDailyValues(form.diarias.map((diaria) => (
      diaria.data === data ? { ...diaria, valor: formatMoneyInput(value) } : diaria
    )))
  }

  const applyBulkDailyValue = () => {
    const formatted = formatMoneyInput(bulkDailyValue)
    if (!parseMoneyToDecimal(formatted)) return
    syncDailyValues(form.diarias.map((diaria) => ({ ...diaria, valor: formatted })))
  }

  return (
    <>
      <div className="AppHospedagem-header">
        <h4 className="mb-0">Nova reserva</h4>
        <BaseButton variant="outline-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left me-2" aria-hidden="true" />
          Voltar
        </BaseButton>
      </div>
      {tentouEnviar ? renderAlertList(errors) : null}
      <div className="AppHospedagem-formGrid">
        <div>
          <label>Quarto</label>
          <select className="form-select" value={form.id_quarto} onChange={(event) => {
            const idQuarto = event.target.value
            const room = quartos.find((quarto) => String(quarto.id_quarto) === idQuarto)
            rebuildDailyValues({ ...form, id_quarto: idQuarto }, Number(room?.preco_padrao || 0), false)
          }}>
            <option value="">Selecione</option>
            {quartos.map((quarto) => (
              <option key={quarto.id_quarto} value={String(quarto.id_quarto)}>{quarto.numero} - {quarto.tipo || 'Sem categoria'}{Number(quarto.preco_padrao || 0) > 0 ? ` - ${money.format(Number(quarto.preco_padrao))}/diária` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Origem</label>
          <select className="form-select" value={form.origem} onChange={(event) => onChangeForm({ ...form, origem: event.target.value })}>
            <option value="BALCAO">Balcão</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
        <div>
          <label>Check-in</label>
          <input type="date" className="form-control" min={minCheckin} value={form.data_checkin} onChange={(event) => rebuildDailyValues({ ...form, data_checkin: event.target.value }, Number(selectedRoom?.preco_padrao || 0), true)} />
        </div>
        <div>
          <label>Checkout</label>
          <input type="date" className="form-control" min={minCheckout} max={maxCheckout} value={form.data_checkout} onChange={(event) => rebuildDailyValues({ ...form, data_checkout: event.target.value }, Number(selectedRoom?.preco_padrao || 0), true)} />
        </div>
      </div>

      <section className="ReservaForm-dailyCard">
        <div className="ReservaForm-dailyHeader">
          <div>
            <span className="ReservaForm-eyebrow">Composição da reserva</span>
            <h5>Diárias</h5>
            <p>{form.diarias.length > 0 ? `${form.diarias.length} diária(s) no período selecionado.` : 'Selecione o quarto e o período para calcular as diárias.'}</p>
          </div>
          {form.diarias.length > 0 ? <BaseButton type="button" variant="outline-primary" onClick={() => setEditingDailyValues((current) => !current)}>
            <i className={`fas ${editingDailyValues ? 'fa-check' : 'fa-pen'} me-2`} aria-hidden="true" />
            {editingDailyValues ? 'Concluir edição' : 'Editar valores'}
          </BaseButton> : null}
        </div>

        {editingDailyValues && form.diarias.length > 0 ? (
          <div className="ReservaForm-bulkEditor">
            <label htmlFor="bulk-daily-value">Alterar todas as diárias</label>
            <div className="input-group">
              <span className="input-group-text">R$</span>
              <input id="bulk-daily-value" className="form-control" inputMode="decimal" placeholder="0,00" value={bulkDailyValue} onChange={(event) => setBulkDailyValue(formatMoneyInput(event.target.value))} />
              <BaseButton type="button" onClick={applyBulkDailyValue}>Aplicar em todas</BaseButton>
            </div>
          </div>
        ) : null}

        {form.diarias.length > 0 ? (
          <div className="ReservaForm-dailyList">
            {form.diarias.map((diaria, index) => (
              <div className="ReservaForm-dailyRow" key={diaria.data}>
                <div><span>Diária {index + 1}</span><strong>{formatDailyDate(diaria.data)}</strong></div>
                {editingDailyValues ? (
                  <div className="input-group ReservaForm-dailyInput">
                    <span className="input-group-text">R$</span>
                    <input className="form-control" aria-label={`Valor da diária ${index + 1}`} inputMode="decimal" value={diaria.valor} onChange={(event) => updateDailyValue(diaria.data, event.target.value)} />
                  </div>
                ) : <strong className="ReservaForm-dailyValue">{money.format(Number(parseMoneyToDecimal(diaria.valor) || 0))}</strong>}
              </div>
            ))}
          </div>
        ) : <div className="ReservaForm-dailyEmpty"><i className="fas fa-calendar-days" aria-hidden="true" /> Nenhuma diária calculada.</div>}

        <div className="ReservaForm-total">
          <span>Valor total da reserva</span>
          <strong>{money.format(dailyTotal)}</strong>
        </div>
      </section>

      <div className="AppHospedagem-clientGrid">
        <div className="AppHospedagem-clientBlock">
          <label>Cliente <span className="text-danger">*</span></label>
          <div className="AppHospedagem-searchBox" ref={clienteBuscaRef}>
            <input className="form-control" placeholder="Buscar cliente por nome ou documento..." value={clienteBusca} onFocus={() => onSetClienteBuscaAberta(true)} onChange={(event) => { onChangeClienteBusca(event.target.value); onSetClienteBuscaAberta(true) }} />
            {clienteBuscaAberta ? <div className="AppHospedagem-searchList">
              {clientesFiltrados.map((cliente) => (
                <button type="button" className={String(cliente.id_cliente) === form.id_cliente ? 'active' : ''} key={cliente.id_cliente} onClick={() => {
                  onChangeForm({ ...form, id_cliente: String(cliente.id_cliente) })
                  onChangeClienteBusca(`${cliente.nome} - ${cliente.documento || ''}`.trim())
                  onSetClienteBuscaAberta(false)
                }}>
                  <i className="fas fa-user" aria-hidden="true" />
                  <span>{cliente.nome} - <small>{cliente.documento || 'sem documento'}</small></span>
                </button>
              ))}
            </div> : null}
          </div>
          <button type="button" className="AppHospedagem-linkButton" onClick={onNavigateCliente}>
            <i className="fas fa-plus-circle me-2" aria-hidden="true" />
            Cadastrar novo cliente
          </button>
        </div>
        <div className="AppHospedagem-clientBlock">
          <label>Empresa</label>
          <div className="AppHospedagem-searchBox" ref={empresaBuscaRef}>
            <input className="form-control" placeholder="Buscar empresa por razão social ou CNPJ..." value={empresaBusca} onFocus={() => onSetEmpresaBuscaAberta(true)} onChange={(event) => { onChangeEmpresaBusca(event.target.value); onSetEmpresaBuscaAberta(true) }} />
            {empresaBuscaAberta ? <div className="AppHospedagem-searchList">
              {empresasFiltradas.map((empresa) => (
                <button type="button" className={String(empresa.id_empresa) === form.id_empresa ? 'active' : ''} key={empresa.id_empresa} onClick={() => {
                  onChangeForm({ ...form, id_empresa: String(empresa.id_empresa) })
                  onChangeEmpresaBusca(`${empresa.razao_social} - ${empresa.cnpj || ''}`.trim())
                  onSetEmpresaBuscaAberta(false)
                }}>
                  <i className="fas fa-building" aria-hidden="true" />
                  <span>{empresa.razao_social} - <small>{empresa.cnpj || 'sem CNPJ'}</small></span>
                </button>
              ))}
            </div> : null}
          </div>
          <button type="button" className="AppHospedagem-linkButton" onClick={onNavigateEmpresa}>
            <i className="fas fa-plus-circle me-2" aria-hidden="true" />
            Cadastrar nova empresa
          </button>
        </div>
      </div>
      <div className="mt-3">
        <label>Observação</label>
        <textarea className="form-control" rows={4} placeholder="Observações adicionais..." value={form.observacao} onChange={(event) => onChangeForm({ ...form, observacao: event.target.value })} />
      </div>
      <div className="card mt-4 p-3 ReservaForm-paymentSection">
        <div className="ReservaForm-paymentIntro">
          <h5>Pagamento inicial</h5>
          <p>Registre o pagamento junto com a reserva ou sinalize que ele ficará pendente.</p>
        </div>
        <label className={`ReservaForm-noPaymentOption ${form.sem_pagamento_inicial ? 'is-selected' : ''}`}>
          <input className="form-check-input" type="checkbox" checked={form.sem_pagamento_inicial} onChange={(event) => onChangeForm({ ...form, sem_pagamento_inicial: event.target.checked })} />
          <span className="ReservaForm-noPaymentIcon"><i className="fas fa-clock" aria-hidden="true" /></span>
          <span className="ReservaForm-noPaymentText">
            <strong>Criar sem pagamento inicial</strong>
            <small>A reserva será criada agora e ficará marcada como pendente de pagamento.</small>
          </span>
        </label>
        {!form.sem_pagamento_inicial ? <PagamentoFormView form={pagamentoForm} formasPagamento={formasPagamento} tentouEnviar={tentouEnviar} errors={pagamentoErrors} exigeCodigoPagamento={exigeCodigoPagamento} codigoPagamentoPlaceholder={codigoPagamentoPlaceholder} onChange={onChangePagamentoForm} onSubmit={() => undefined} showSubmit={false} /> : <div className="ReservaForm-pendingNotice"><i className="fas fa-circle-info" aria-hidden="true" /> Nenhum pagamento será registrado neste momento.</div>}
      </div>
      <BaseButton className="AppHospedagem-createButton" onClick={onSubmit}>
        <i className="fas fa-save me-2" aria-hidden="true" />
        {form.sem_pagamento_inicial ? 'Criar reserva sem pagamento' : 'Criar reserva e pagamento'}
      </BaseButton>
    </>
  )
}
