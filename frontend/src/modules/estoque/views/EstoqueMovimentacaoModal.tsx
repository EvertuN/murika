'use client'

import './EstoqueMovimentacaoModal.css'
import { useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { FormaPagamento } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import type {
  EstoqueItemOption,
  EstoqueTipoConsumo,
  EstoqueTipoMovimentacao,
  ReservaConsumoOption
} from '@/modules/estoque/services/estoque-movimentacao.service'

type FormaCobranca = 'PAGAR_AGORA' | 'COBRAR_NA_RESERVA' | 'REGISTRAR_SEM_PAGAMENTO'

export type MovimentacaoFormPayload = {
  tipo: EstoqueTipoMovimentacao
  id_item: number
  quantidade: number
  observacao?: string
  tipo_consumo?: EstoqueTipoConsumo | ''
  id_reserva?: string
  responsavel_consumo?: string
  valor_unitario?: string
  justificativa_valor?: string
  id_forma_pagamento?: string
  codigo_autorizacao?: string
  is_prazo?: number
  registrar_sem_pagamento?: number
  cobrar_na_reserva?: number
}

type Props = {
  initialTipo?: EstoqueTipoMovimentacao
  initialItem?: string
  itens: EstoqueItemOption[]
  reservas: ReservaConsumoOption[]
  formasPagamento: FormaPagamento[]
  salvando: boolean
  erro: string
  onClose: () => void
  onSubmit: (payload: MovimentacaoFormPayload) => void
}

export default function EstoqueMovimentacaoModal({ initialTipo, initialItem, itens, reservas, formasPagamento, salvando, erro, onClose, onSubmit }: Props) {
  const { isAdmin, user } = useAuth()
  const [tentou, setTentou] = useState(false)
  const [tipo, setTipo] = useState<'' | EstoqueTipoMovimentacao>(initialTipo || '')
  const [idItem, setIdItem] = useState(initialItem || '')
  const [quantidade, setQuantidade] = useState('')
  const [observacao, setObservacao] = useState('')
  const [tipoConsumo, setTipoConsumo] = useState<'' | EstoqueTipoConsumo>('')
  const [idReserva, setIdReserva] = useState('')
  const [responsavelConsumo, setResponsavelConsumo] = useState('')
  const [valorUnitario, setValorUnitario] = useState('')
  const [justificativaValor, setJustificativaValor] = useState('')
  const [formaCobranca, setFormaCobranca] = useState<FormaCobranca>('PAGAR_AGORA')
  const [idFormaPagamento, setIdFormaPagamento] = useState('')
  const [codigoAutorizacao, setCodigoAutorizacao] = useState('')
  const [isPrazo, setIsPrazo] = useState(false)

  const item = useMemo(() => itens.find((entry) => String(entry.id_item) === idItem), [idItem, itens])
  const precoSugerido = Number(item?.preco_venda || 0)
  const valorAplicado = valorUnitario === '' ? precoSugerido : Number(valorUnitario)
  const valorAlterado = tipo === 'saida' && tipoConsumo !== 'DESCARTE' && Math.abs(valorAplicado - precoSugerido) >= 0.005
  const reserva = reservas.find((entry) => String(entry.id_reserva) === idReserva)
  const permitePrazo = tipoConsumo === 'CONSUMO_HOSPEDE' && Number(reserva?.has_pagamento_prazo || 0) === 1
  const prazoAtivo = isPrazo && permitePrazo
  const cobrarReserva = tipoConsumo === 'CONSUMO_HOSPEDE' && formaCobranca === 'COBRAR_NA_RESERVA' && !prazoAtivo
  const semPagamento = tipoConsumo === 'CONSUMO_HOSPEDE' && formaCobranca === 'REGISTRAR_SEM_PAGAMENTO' && !prazoAtivo
  const exigePagamento = tipo === 'saida' && tipoConsumo !== 'DESCARTE' && !prazoAtivo && !cobrarReserva && !semPagamento

  const selecionarItem = (value: string) => {
    setIdItem(value)
    const selecionado = itens.find((entry) => String(entry.id_item) === value)
    setValorUnitario(selecionado ? String(Number(selecionado.preco_venda || 0).toFixed(2)) : '')
    setJustificativaValor('')
  }

  const enviar = () => {
    setTentou(true)
    if (!tipo || !idItem || !Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) return
    if (tipo === 'saida') {
      if (!tipoConsumo) return
      if (tipoConsumo === 'CONSUMO_HOSPEDE' && !idReserva) return
      if (tipoConsumo === 'OUTRO_CONSUMO' && !responsavelConsumo.trim()) return
      if (tipoConsumo === 'DESCARTE' && !observacao.trim()) return
      if (tipoConsumo !== 'DESCARTE' && (!Number.isFinite(valorAplicado) || valorAplicado < 0)) return
      if (valorAlterado && (!isAdmin || !justificativaValor.trim())) return
      if (exigePagamento && !idFormaPagamento) return
    }

    onSubmit({
      tipo,
      id_item: Number(idItem),
      quantidade: Number(quantidade),
      observacao: observacao.trim(),
      tipo_consumo: tipo === 'saida' ? tipoConsumo : '',
      id_reserva: tipoConsumo === 'CONSUMO_HOSPEDE' ? idReserva : '',
      responsavel_consumo: tipoConsumo === 'OUTRO_CONSUMO' ? responsavelConsumo.trim() : '',
      valor_unitario: tipo === 'saida' && tipoConsumo !== 'DESCARTE' ? valorAplicado.toFixed(2) : '',
      justificativa_valor: valorAlterado ? justificativaValor.trim() : '',
      id_forma_pagamento: exigePagamento ? idFormaPagamento : '',
      codigo_autorizacao: exigePagamento ? codigoAutorizacao.trim() : '',
      is_prazo: prazoAtivo ? 1 : 0,
      registrar_sem_pagamento: semPagamento ? 1 : 0,
      cobrar_na_reserva: cobrarReserva ? 1 : 0
    })
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content EstoqueMovimentacaoModal-modal">
            <div className="modal-header">
              <h5 className="modal-title">Nova movimentação</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={salvando} />
            </div>
            <div className="modal-body">
              {erro ? <div className="alert alert-danger">{erro}</div> : null}
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Operação</label>
                  <select className={`form-select ${tentou && !tipo ? 'is-invalid' : ''}`} value={tipo} onChange={(event) => setTipo(event.target.value as '' | EstoqueTipoMovimentacao)}>
                    <option value="">Selecione...</option><option value="entrada">Entrada</option><option value="saida">Saída / consumo</option>
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label">Item</label>
                  <select className={`form-select ${tentou && !idItem ? 'is-invalid' : ''}`} value={idItem} onChange={(event) => selecionarItem(event.target.value)}>
                    <option value="">Selecione...</option>{itens.map((entry) => <option key={entry.id_item} value={entry.id_item}>{entry.nome}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Quantidade</label>
                  <input type="number" min="1" step="1" className={`form-control ${tentou && (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) ? 'is-invalid' : ''}`} value={quantidade} onChange={(event) => setQuantidade(event.target.value)} />
                </div>
              </div>

              {tipo === 'saida' ? (
                <div className="mt-4 border-top pt-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Tipo de consumo</label>
                      <select className={`form-select ${tentou && !tipoConsumo ? 'is-invalid' : ''}`} value={tipoConsumo} onChange={(event) => { setTipoConsumo(event.target.value as '' | EstoqueTipoConsumo); setIdReserva(''); setResponsavelConsumo(''); setIsPrazo(false) }}>
                        <option value="">Selecione...</option><option value="CONSUMO_HOSPEDE">Quarto / cliente</option><option value="OUTRO_CONSUMO">Outro consumo</option><option value="DESCARTE">Descarte</option>
                      </select>
                    </div>
                    {tipoConsumo === 'CONSUMO_HOSPEDE' ? (
                      <div className="col-md-6">
                        <label className="form-label">Reserva</label>
                        <select className={`form-select ${tentou && !idReserva ? 'is-invalid' : ''}`} value={idReserva} onChange={(event) => { setIdReserva(event.target.value); setIsPrazo(false) }}>
                          <option value="">Selecione...</option>{reservas.map((entry) => <option key={entry.id_reserva} value={entry.id_reserva}>{entry.codigo_reserva || `#${entry.id_reserva}`} — {entry.cliente_nome || entry.empresa_razao || 'Sem identificação'}</option>)}
                        </select>
                      </div>
                    ) : null}
                    {tipoConsumo === 'OUTRO_CONSUMO' ? (
                      <div className="col-md-6">
                        <label className="form-label">Responsável / descrição</label>
                        <input className={`form-control ${tentou && !responsavelConsumo.trim() ? 'is-invalid' : ''}`} maxLength={100} value={responsavelConsumo} onChange={(event) => setResponsavelConsumo(event.target.value)} />
                      </div>
                    ) : null}
                  </div>

                  {tipoConsumo && tipoConsumo !== 'DESCARTE' ? (
                    <div className="row g-3 mt-1">
                      <div className="col-md-4">
                        <label className="form-label">Valor unitário</label>
                        <input type="number" min="0" step="0.01" className={`form-control ${tentou && (!Number.isFinite(valorAplicado) || valorAplicado < 0 || (valorAlterado && !isAdmin)) ? 'is-invalid' : ''}`} value={valorUnitario} disabled={!isAdmin} onChange={(event) => setValorUnitario(event.target.value)} />
                        <small className="text-muted">Sugerido: {precoSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</small>
                      </div>
                      {valorAlterado ? (
                        <div className="col-md-8">
                          <label className="form-label">Justificativa da alteração</label>
                          <input className={`form-control ${tentou && !justificativaValor.trim() ? 'is-invalid' : ''}`} maxLength={255} value={justificativaValor} onChange={(event) => setJustificativaValor(event.target.value)} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {tipoConsumo === 'CONSUMO_HOSPEDE' ? (
                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">Cobrança</label>
                        <select className="form-select" value={formaCobranca} onChange={(event) => setFormaCobranca(event.target.value as FormaCobranca)}>
                          <option value="PAGAR_AGORA">Pagar agora</option><option value="COBRAR_NA_RESERVA">Cobrar na reserva</option><option value="REGISTRAR_SEM_PAGAMENTO">Deixar pendente</option>
                        </select>
                      </div>
                      {permitePrazo ? <div className="col-md-6 d-flex align-items-end"><label className="form-check mb-2"><input type="checkbox" className="form-check-input" checked={isPrazo} onChange={(event) => setIsPrazo(event.target.checked)} /> <span className="form-check-label">Pagamento corporativo a prazo</span></label></div> : null}
                    </div>
                  ) : null}

                  {exigePagamento ? (
                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">Forma de pagamento</label>
                        <select className={`form-select ${tentou && !idFormaPagamento ? 'is-invalid' : ''}`} value={idFormaPagamento} onChange={(event) => setIdFormaPagamento(event.target.value)}>
                          <option value="">Selecione...</option>{formasPagamento.map((forma) => <option key={forma.id_forma_pagamento} value={forma.id_forma_pagamento}>{forma.nome_forma_pagamento}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6"><label className="form-label">Código de autorização</label><input className="form-control" maxLength={30} value={codigoAutorizacao} onChange={(event) => setCodigoAutorizacao(event.target.value)} /></div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3">
                <label className="form-label">Observação {tipoConsumo === 'DESCARTE' ? '(obrigatória)' : '(opcional)'}</label>
                <textarea className={`form-control ${tentou && tipoConsumo === 'DESCARTE' && !observacao.trim() ? 'is-invalid' : ''}`} rows={3} maxLength={200} value={observacao} onChange={(event) => setObservacao(event.target.value)} />
              </div>
              <div className="small text-muted mt-2">Responsável pelo lançamento: {user?.nome || 'Usuário'}</div>
            </div>
            <div className="modal-footer"><BaseButton variant="outline-secondary" onClick={onClose} disabled={salvando}>Cancelar</BaseButton><BaseButton variant="primary" onClick={enviar} disabled={salvando}>{salvando ? 'Salvando...' : 'Registrar'}</BaseButton></div>
          </div>
        </div>
      </div>
    </>
  )
}
