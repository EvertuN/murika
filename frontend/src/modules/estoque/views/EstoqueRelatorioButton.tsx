'use client'

import { useState } from 'react'
import './EstoqueRelatorioButton.css'
import BaseButton from '@/shared/components/base/BaseButton'
import estoqueMovimentacaoService from '@/modules/estoque/services/estoque-movimentacao.service'

const hojeInput = () => {
  const data = new Date()
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export default function EstoqueRelatorioButton() {
  const [modalAberto, setModalAberto] = useState(false)
  const [dataInicio, setDataInicio] = useState(hojeInput)
  const [dataFim, setDataFim] = useState(hojeInput)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [erro, setErro] = useState('')

  const abrirRelatorio = () => {
    if (!dataInicio || !dataFim) return setErro('Informe as datas inicial e final.')
    const inicio = `${dataInicio}T${horaInicio || '00:00'}`
    const fim = `${dataFim}T${horaFim || '23:59'}`
    if (fim < inicio) return setErro('O fim do período deve ser posterior ao início.')
    window.open(estoqueMovimentacaoService.buildRelatorioUrl({ data_inicio: dataInicio, data_fim: dataFim, hora_inicio: horaInicio, hora_fim: horaFim }), '_blank', 'width=1100,height=800')
    setModalAberto(false)
  }

  const abrirModal = () => {
    const hoje = hojeInput()
    setDataInicio(hoje); setDataFim(hoje); setHoraInicio(''); setHoraFim(''); setErro(''); setModalAberto(true)
  }

  return (
    <>
      <BaseButton variant="outline-secondary" size="toolbar" className="EstoqueRelatorioButton-button" onClick={abrirModal}>
        <i className="fas fa-file-lines" aria-hidden="true" /> Gerar relatório
      </BaseButton>
      {modalAberto ? <>
        <div className="modal-backdrop fade show" />
        <div className="modal fade show d-block" tabIndex={-1}>
          <div className="modal-dialog"><div className="modal-content EstoqueRelatorioButton-modal">
            <div className="modal-header"><h5 className="modal-title">Relatório de estoque por período</h5><button type="button" className="btn-close" onClick={() => setModalAberto(false)} /></div>
            <div className="modal-body">
              {erro ? <div className="alert alert-danger">{erro}</div> : null}
              <div className="row g-3">
                <div className="col-6"><label className="form-label">Data inicial</label><input className="form-control" type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} /></div>
                <div className="col-6"><label className="form-label">Data final</label><input className="form-control" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} /></div>
                <div className="col-6"><label className="form-label">Hora inicial <small className="text-muted">(opcional)</small></label><input className="form-control" type="time" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} /></div>
                <div className="col-6"><label className="form-label">Hora final <small className="text-muted">(opcional)</small></label><input className="form-control" type="time" value={horaFim} onChange={(event) => setHoraFim(event.target.value)} /></div>
              </div>
              <small className="text-muted d-block mt-3">Sem horários, o sistema considera os dias completos.</small>
            </div>
            <div className="modal-footer"><BaseButton variant="outline-secondary" onClick={() => setModalAberto(false)}>Cancelar</BaseButton><BaseButton variant="primary" onClick={abrirRelatorio}>Gerar relatório</BaseButton></div>
          </div></div>
        </div>
      </> : null}
    </>
  )
}
