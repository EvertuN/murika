import type { Reserva, ReservaTimelineItem } from '@/modules/hospedagem/services/hospedagem_reserva.service'

export function formatDateBr(value?: string | null) {
  if (!value) return '-'
  const [date] = value.split(' ')
  const parts = date.split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function formatDateTimeBr(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

export function formatMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d{3,})/, '')
  if (!digits) return ''
  const cents = digits.padStart(3, '0')
  const integerPart = cents.slice(0, -2)
  const decimalPart = cents.slice(-2)
  return `${Number(integerPart).toLocaleString('pt-BR')},${decimalPart}`
}

export function parseMoneyToDecimal(value: string): string {
  const amount = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : ''
}

export function renderStatusBadge(status: string) {
  const normalized = String(status || '').toUpperCase()
  const badgeClass = normalized === 'ABERTA' ? 'AppHospedagem-badge--open' : normalized === 'FECHADA' ? 'AppHospedagem-badge--closed' : 'AppHospedagem-badge--canceled'
  return <span className={`AppHospedagem-badge ${badgeClass}`}>{normalized || '-'}</span>
}

export function renderPagamentoBadge(reserva: Reserva) {
  const pago = Number(reserva.sem_pagamento ?? 1) === 0 || Number(reserva.pagamentos_count ?? 0) > 0
  return <span className={`AppHospedagem-badge ${pago ? 'AppHospedagem-badge--paid' : 'AppHospedagem-badge--unpaid'}`}>{pago ? 'PG' : 'SP'}</span>
}

export function renderAlertList(messages: string[]) {
  return messages.length > 0 ? (
    <div className="AppHospedagem-warning">
      <ul className="mb-0">
        {messages.map((message) => <li key={message}>{message}</li>)}
      </ul>
    </div>
  ) : null
}

export function timelineTitle(entry: ReservaTimelineItem) {
  const action = entry.action.toUpperCase()
  if (action.includes('PAYMENT') || action.includes('PAGAMENTO')) return 'Pagamento adicionado'
  if (action.includes('UPDATE_STATUS')) return 'Status alterado'
  if (action.includes('UPDATE_CHECKOUT')) return 'Checkout alterado'
  if (action.includes('CREATE')) return 'Reserva criada'
    if (action.includes('DELETE')) return 'Pagamento excluído'
  return entry.action
}

export function timelineSummary(entry: ReservaTimelineItem) {
  const details = entry.details || {}
  const parts: string[] = []
  const statusAnterior = details.status_anterior
  const status = details.status
  if (statusAnterior || status) parts.push(`Status: ${String(statusAnterior || '-')} -> ${String(status || '-')}`)
  if (details.valor) parts.push(`Valor ${Number(details.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
  if (details.data_pagamento) parts.push(`em ${formatDateBr(String(details.data_pagamento))}`)
  if (details.codigo_reserva) parts.push(`Código ${String(details.codigo_reserva)}`)
  if (details.id_quarto) parts.push(`Quarto ${String(details.id_quarto)}`)
  if (details.origem) parts.push(`Origem ${String(details.origem)}`)
  if (details.data_checkout) parts.push(`Checkout ${formatDateBr(String(details.data_checkout))}`)
  if (details.situacao_reserva) parts.push(`Situação reserva: ${String(details.situacao_reserva)}`)
  if (details.pagamentos_restantes !== undefined) parts.push(`Pagamentos restantes: ${String(details.pagamentos_restantes)}`)
  return parts.length > 0 ? parts.join(' - ') : entry.entity
}
