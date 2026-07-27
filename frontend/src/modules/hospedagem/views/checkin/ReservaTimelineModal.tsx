'use client'

import './ReservaTimelineModal.css'
import BaseButton from '@/shared/components/base/BaseButton'
import type { ReservaTimelineItem } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import { formatDateTimeBr, timelineSummary, timelineTitle } from './checkin-utils'

type Props = {
  timeline: ReservaTimelineItem[]
  loading: boolean
  onClose: () => void
}

export default function ReservaTimelineModal({ timeline, loading, onClose }: Props) {
  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Histórico de alterações</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : timeline.length === 0 ? (
                <div className="text-center text-muted py-4">Nenhum evento encontrado.</div>
              ) : (
                <div className="AppHospedagem-historyList">
                  {timeline.map((entry) => (
                    <div className="AppHospedagem-historyItem" key={entry.id}>
                      <div>
                        <strong>{timelineTitle(entry)}</strong>
                        <span>{timelineSummary(entry)}</span>
                      </div>
                      <div className="AppHospedagem-historyMeta">
                        <span>{formatDateTimeBr(entry.created_at)}</span>
                        <strong>{entry.user_name || 'Sistema'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <BaseButton variant="outline-secondary" onClick={onClose}>Fechar</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
