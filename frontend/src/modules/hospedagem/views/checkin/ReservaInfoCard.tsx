'use client'

import './ReservaInfoCard.css'
import type { Reserva } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import { formatDateBr, renderStatusBadge } from './checkin-utils'

type Props = {
  reserva: Reserva
  compact?: boolean
}

export default function ReservaInfoCard({ reserva, compact = false }: Props) {
  return (
    <div className={`AppHospedagem-infoCard ${compact ? 'AppHospedagem-infoCard--compact' : ''}`}>
      <div>
        <span>Hóspede</span>
        <strong>{reserva.cliente_nome || reserva.empresa_razao || '-'}</strong>
      </div>
      <div>
        <span>Quarto</span>
        <strong>Quarto {reserva.quarto_numero || reserva.id_quarto}</strong>
      </div>
      <div>
        <span>Status</span>
        {renderStatusBadge(reserva.status)}
      </div>
      <div>
        <span>Origem</span>
        <strong>{reserva.origem}</strong>
      </div>
      <div>
        <span>Check-in</span>
        <strong>{formatDateBr(reserva.data_checkin)}</strong>
      </div>
      <div>
        <span>Checkout</span>
        <strong>{formatDateBr(reserva.data_checkout)}</strong>
      </div>
      <div>
        <span>Diárias</span>
        <strong>{reserva.quantidade_diarias || '-'}</strong>
      </div>
      <div>
        <span>Valor da estadia</span>
        <strong>{Number(reserva.valor_estadia || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
      </div>
      <div>
        <span>Lançado por</span>
        <strong>{reserva.usuario_criacao_nome || '-'}</strong>
      </div>
      <div>
        <span>Código</span>
        <strong>{reserva.codigo_reserva || reserva.id_reserva}</strong>
      </div>
    </div>
  )
}
