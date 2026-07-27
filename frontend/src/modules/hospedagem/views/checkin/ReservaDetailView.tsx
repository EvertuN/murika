'use client'

import './ReservaDetailView.css'
import BaseButton from '@/shared/components/base/BaseButton'
import type { FormaPagamento, Pagamento, Reserva, ReservaConsumo } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import { formatDateBr } from './checkin-utils'
import ConsumoFormView, { type ConsumoForm } from './ConsumoFormView'
import PagamentoFormView, { type PagamentoForm } from './PagamentoFormView'
import ReservaInfoCard from './ReservaInfoCard'

type Props = {
  reserva: Reserva
  pagamentos: Pagamento[]
  consumos: ReservaConsumo[]
  formasPagamento: FormaPagamento[]
  pagamentoForm: PagamentoForm
  consumoForm: ConsumoForm
  consumoItens: Array<{ id_item: number | string; nome: string; preco_venda?: number | string }>
  mostrarPagamentoForm: boolean
  mostrarConsumoForm: boolean
  pagamentoTentouEnviar: boolean
  consumoTentouEnviar: boolean
  pagamentoErrors: string[]
  consumoErrors: string[]
  consumoSalvando: boolean
  permitePagamentoCorporativo: boolean
  exigeCodigoPagamento: boolean
  codigoPagamentoPlaceholder: string
  isAdmin: boolean
  canWrite: boolean
  onChangePagamentoForm: (form: PagamentoForm) => void
  onChangeConsumoForm: (form: ConsumoForm) => void
  onSubmitPagamento: () => void
  onSubmitConsumo: () => void
  onShowPagamentoForm: () => void
  onShowConsumoForm: () => void
  onBack: () => void
  onOpenTimeline: () => void
  onOpenExtend: () => void
  onUpdateStayValue: () => void
  onDeletePagamento: (pagamento: Pagamento) => void
  onDeleteConsumo: (consumo: ReservaConsumo) => void
  onQuitarConsumo: (consumo: ReservaConsumo) => void
}

export default function ReservaDetailView({
  reserva,
  pagamentos,
  consumos,
  formasPagamento,
  pagamentoForm,
  consumoForm,
  consumoItens,
  mostrarPagamentoForm,
  mostrarConsumoForm,
  pagamentoTentouEnviar,
  consumoTentouEnviar,
  pagamentoErrors,
  consumoErrors,
  consumoSalvando,
  permitePagamentoCorporativo,
  exigeCodigoPagamento,
  codigoPagamentoPlaceholder,
  isAdmin,
  canWrite,
  onChangePagamentoForm,
  onChangeConsumoForm,
  onSubmitPagamento,
  onSubmitConsumo,
  onShowPagamentoForm,
  onShowConsumoForm,
  onBack,
  onOpenTimeline,
  onOpenExtend,
  onUpdateStayValue,
  onDeletePagamento,
  onDeleteConsumo,
  onQuitarConsumo
}: Props) {
  const pagamentoEmReservaFechadaBloqueado = reserva.status === 'FECHADA' && !isAdmin
  const showingForm = mostrarPagamentoForm || mostrarConsumoForm
  const totalPagamentos = pagamentos.reduce((total, entry) => total + Number(entry.valor || 0), 0)
  const getConsumoStatus = (entry: ReservaConsumo) => String(entry.status_pagamento || '').toUpperCase()
  const consumosPrazo = consumos.filter((entry) => Number(entry.is_prazo || 0) === 1 || getConsumoStatus(entry) === 'A_PRAZO')
  const consumosPendentes = consumos.filter((entry) => getConsumoStatus(entry) === 'PENDENTE')
  const consumosPagosAgora = consumos.filter((entry) => getConsumoStatus(entry) === 'PAGO' || (!entry.status_pagamento && entry.id_forma_pagamento && Number(entry.is_prazo || 0) !== 1))
  const consumosNaReserva = consumos.filter((entry) => getConsumoStatus(entry) === 'COBRADO_RESERVA' || (!entry.status_pagamento && !entry.id_forma_pagamento && Number(entry.is_prazo || 0) !== 1))
  const totalConsumosPagosAgora = consumosPagosAgora.reduce((total, entry) => total + Number(entry.valor_total || 0), 0)
  const totalConsumosNaReserva = consumosNaReserva.reduce((total, entry) => total + Number(entry.valor_total || 0), 0)
  const totalConsumosPrazo = consumosPrazo.reduce((total, entry) => total + Number(entry.valor_total || 0), 0)
  const totalConsumosPendentes = consumosPendentes.reduce((total, entry) => total + Number(entry.valor_total || 0), 0)
  const hasConsumoActions = canWrite && (isAdmin || consumosPendentes.length > 0)
  const totalRecebido = totalPagamentos + totalConsumosPagosAgora
  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const renderConsumoStatus = (entry: ReservaConsumo) => {
    const status = getConsumoStatus(entry)
    if (status === 'PENDENTE') {
      return <span className="AppHospedagem-pill AppHospedagem-pill--pending">Pendente</span>
    }
    if (Number(entry.is_prazo || 0) === 1 || status === 'A_PRAZO') {
      return <span className="AppHospedagem-pill AppHospedagem-pill--ap">AP</span>
    }
    if (status === 'COBRADO_RESERVA') {
      return 'Na reserva'
    }
    return 'Pago agora'
  }

  const renderResumoFinanceiro = () => (
    <div className="AppHospedagem-emptyPayments">
      <div><strong>Pagamentos da reserva:</strong> {pagamentos.length} registro(s) - {formatMoney(totalPagamentos)}</div>&nbsp;&nbsp;
      <div><strong>Consumos pagos agora:</strong> {consumosPagosAgora.length} registro(s) - {formatMoney(totalConsumosPagosAgora)}</div>&nbsp;&nbsp;
      <div><strong>Consumos AP:</strong> {consumosPrazo.length} registro(s) - {formatMoney(totalConsumosPrazo)}</div>&nbsp;&nbsp;
      <div><strong>Consumos a cobrar:</strong> {consumosNaReserva.length} registro(s) - {formatMoney(totalConsumosNaReserva)}</div>&nbsp;&nbsp;
      <div><strong>Consumos pendentes:</strong> {consumosPendentes.length} registro(s) - {formatMoney(totalConsumosPendentes)}</div>&nbsp;&nbsp;
      <div><strong>Total recebido:</strong> {formatMoney(totalRecebido)}</div>
    </div>
  )

  const renderPagamentosCompactTable = () => (
    <div className="table-responsive">
      <table className="table table-bordered mb-0 AppHospedagem-table">
        <thead>
          <tr>
            <th>Forma</th>
            <th>Valor</th>
            <th>Data</th>
            <th>A Prazo</th>
          </tr>
        </thead>
        <tbody>
          {pagamentos.length === 0 ? (
            <tr><td colSpan={4} className="text-center">Nenhum pagamento registrado.</td></tr>
          ) : pagamentos.map((entry) => (
            <tr key={entry.id_pagamento}>
              <td>{Number(entry.is_prazo || 0) === 1 ? 'A prazo' : (entry.nome_forma_pagamento || '-')}</td>
              <td>{Number(entry.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td>{formatDateBr(entry.data_pagamento)}</td>
              <td><span className={`AppHospedagem-pill ${Number(entry.is_prazo || 0) === 1 ? 'AppHospedagem-pill--ap' : ''}`}>{Number(entry.is_prazo || 0) === 1 ? 'AP' : 'Não'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderConsumosTable = (compact = false) => (
    <div className="table-responsive">
      <table className="table table-bordered mb-0 AppHospedagem-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qtd</th>
            <th>Valor</th>
            <th>Cobrança</th>
            {!compact ? <th>Forma</th> : null}
            {!compact ? <th>Código</th> : null}
            {!compact ? <th>Lançado por</th> : null}
            {!compact ? <th>Data</th> : null}
            {hasConsumoActions ? <th>Ações</th> : null}
            {!compact ? <th>Observação</th> : null}
          </tr>
        </thead>
        <tbody>
          {consumos.length === 0 ? (
            <tr><td colSpan={compact ? (hasConsumoActions ? 5 : 4) : hasConsumoActions ? 10 : 9} className="text-center">Nenhum consumo registrado para esta reserva.</td></tr>
          ) : consumos.map((entry) => (
            <tr key={entry.id_consumo}>
              <td>{entry.nome_item || '-'}</td>
              <td>{entry.quantidade}</td>
              <td>{Number(entry.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td>{renderConsumoStatus(entry)}</td>
              {!compact ? <td>{entry.nome_forma_pagamento || '-'}</td> : null}
              {!compact ? <td>{entry.codigo_autorizacao || '-'}</td> : null}
              {!compact ? <td>{entry.usuario_criacao_nome || '-'}</td> : null}
              {!compact ? <td>{entry.data_formatada || '-'}</td> : null}
              {hasConsumoActions ? (
                <td>
                  <div className="d-flex gap-2">
                    {getConsumoStatus(entry) === 'PENDENTE' ? (
                      <BaseButton size="action" variant="primary" onClick={() => onQuitarConsumo(entry)}>
                        Quitar
                      </BaseButton>
                    ) : null}
                    {isAdmin ? (
                      <BaseButton size="action" variant="danger" onClick={() => onDeleteConsumo(entry)}>
                        Excluir
                      </BaseButton>
                    ) : null}
                  </div>
                </td>
              ) : null}
              {!compact ? <td>{entry.observacao || '-'}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <div className={`AppHospedagem-detailHeader ${showingForm ? 'AppHospedagem-detailHeader--payment' : ''}`}>
        <h4 className="mb-0">{mostrarPagamentoForm ? 'Novo Pagamento' : mostrarConsumoForm ? 'Novo Consumo' : 'Informações da reserva'}</h4>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary AppHospedagem-iconButton" type="button" onClick={onOpenTimeline}>
            <i className="fas fa-history" aria-hidden="true" />
          </button>
          {canWrite ? <BaseButton variant="outline-secondary" disabled={reserva.status === 'FECHADA'} onClick={onOpenExtend}>Estender</BaseButton> : null}
          {isAdmin ? <BaseButton variant="outline-secondary" onClick={onUpdateStayValue}>Alterar valor</BaseButton> : null}
          {canWrite ? <BaseButton variant={mostrarPagamentoForm ? 'primary' : 'outline-primary'} onClick={onShowPagamentoForm} disabled={pagamentoEmReservaFechadaBloqueado}>
            <i className="fas fa-plus-circle me-2" aria-hidden="true" />
            Adicionar pagamento
          </BaseButton> : null}
          {canWrite ? <BaseButton variant={mostrarConsumoForm ? 'primary' : 'outline-primary'} onClick={onShowConsumoForm}>
            <i className="fas fa-cart-plus me-2" aria-hidden="true" />
            Adicionar consumo
          </BaseButton> : null}
          <BaseButton variant="outline-secondary" onClick={onBack}>
            <i className="fas fa-arrow-left me-2" aria-hidden="true" />
            Voltar
          </BaseButton>
        </div>
      </div>

      {showingForm ? (
        <div className="AppHospedagem-detailGrid">
          <div>
            <h4 className="AppHospedagem-sectionTitle">{mostrarConsumoForm ? 'Novo Consumo' : 'Novo Pagamento'}</h4>
            {mostrarConsumoForm ? (
              <ConsumoFormView
                form={consumoForm}
                itens={consumoItens}
                formasPagamento={formasPagamento}
                tentouEnviar={consumoTentouEnviar}
                errors={consumoErrors}
                salvando={consumoSalvando}
                permitePagamentoCorporativo={permitePagamentoCorporativo}
                isAdmin={isAdmin}
                onChange={onChangeConsumoForm}
                onSubmit={onSubmitConsumo}
              />
            ) : (
              <PagamentoFormView
                form={pagamentoForm}
                formasPagamento={formasPagamento}
                tentouEnviar={pagamentoTentouEnviar}
                errors={pagamentoErrors}
                exigeCodigoPagamento={exigeCodigoPagamento}
                codigoPagamentoPlaceholder={codigoPagamentoPlaceholder}
                onChange={onChangePagamentoForm}
                onSubmit={onSubmitPagamento}
              />
            )}
          </div>
          <div>
            <h4 className="AppHospedagem-sectionTitle">Informações da reserva</h4>
            <ReservaInfoCard reserva={reserva} compact />
            <h4 className="AppHospedagem-sectionTitle">Informações de Pagamento</h4>
            {renderPagamentosCompactTable()}
            <h4 className="AppHospedagem-sectionTitle">Consumos</h4>
            {renderConsumosTable(true)}
          </div>
        </div>
      ) : (
        <>
          <ReservaInfoCard reserva={reserva} />
          {renderResumoFinanceiro()}
          <h4 className="AppHospedagem-sectionTitle">Informações de Pagamento</h4>
          <div className="table-responsive">
            <table className="table table-bordered mb-0 AppHospedagem-table">
              <thead>
                <tr>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Lançado por</th>
                  <th>Autorização</th>
                  <th>A Prazo</th>
                  <th>Observação</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.length === 0 ? (
                  <tr><td colSpan={8} className="text-center">Nenhum pagamento registrado para esta reserva.</td></tr>
                ) : pagamentos.map((entry) => (
                  <tr key={entry.id_pagamento}>
                    <td>{Number(entry.is_prazo || 0) === 1 ? 'A prazo' : (entry.nome_forma_pagamento || '-')}</td>
                    <td>{Number(entry.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>{formatDateBr(entry.data_pagamento)}</td>
                    <td>{entry.usuario_criacao_nome || '-'}</td>
                    <td>{entry.codigo_autorizacao || '-'}</td>
                    <td><span className={`AppHospedagem-pill ${Number(entry.is_prazo || 0) === 1 ? 'AppHospedagem-pill--ap' : ''}`}>{Number(entry.is_prazo || 0) === 1 ? 'AP' : 'Não'}</span></td>
                    <td>{entry.observacao || '-'}</td>
                    <td className="text-center">
                      {isAdmin ? (
                        <BaseButton size="action" variant="danger" onClick={() => onDeletePagamento(entry)}>
                          <i className="fas fa-trash" aria-hidden="true" />
                        </BaseButton>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="AppHospedagem-sectionTitle">Consumos</h4>
          {renderConsumosTable()}
        </>
      )}
    </>
  )
}
