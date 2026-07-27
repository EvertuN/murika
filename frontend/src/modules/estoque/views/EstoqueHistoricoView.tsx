'use client'

import './EstoqueHistoricoView.css'
import { useCallback, useEffect, useState } from 'react'
import BasePagination from '@/shared/components/base/BasePagination'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import estoqueMovimentacaoService, { type HistoricoMovimentacao } from '@/modules/estoque/services/estoque-movimentacao.service'

export default function EstoqueHistoricoView() {
  const { isAdmin } = useAuth()
  const [historico, setHistorico] = useState<HistoricoMovimentacao[]>([])
  const [historicoLoading, setHistoricoLoading] = useState(false)
  const [historicoError, setHistoricoError] = useState('')
  const [historicoData, setHistoricoData] = useState('')
  const [historicoPaginaAtual, setHistoricoPaginaAtual] = useState(1)
  const [historicoTotalPaginas, setHistoricoTotalPaginas] = useState(1)
  const [observacaoModal, setObservacaoModal] = useState<HistoricoMovimentacao | null>(null)
  const [correcaoModal, setCorrecaoModal] = useState<HistoricoMovimentacao | null>(null)
  const [correcaoQuantidade, setCorrecaoQuantidade] = useState('')
  const [correcaoMotivo, setCorrecaoMotivo] = useState('')
  const [correcaoErro, setCorrecaoErro] = useState('')
  const [correcaoSalvando, setCorrecaoSalvando] = useState(false)

  const loadHistorico = useCallback(async (page = 1, data = historicoData) => {
    setHistoricoLoading(true)
    setHistoricoError('')
    try {
      const response = await estoqueMovimentacaoService.listarHistorico({
        data: data || undefined,
        pagina: page,
        limite: 30
      })
      setHistorico(response.data)
      setHistoricoPaginaAtual(response.paginacao?.pagina_atual || 1)
      setHistoricoTotalPaginas(response.paginacao?.total_paginas || 1)
    } catch (error) {
      setHistoricoError(error instanceof Error ? error.message : 'Erro ao carregar histórico.')
    } finally {
      setHistoricoLoading(false)
    }
  }, [historicoData])

  useEffect(() => {
    void loadHistorico(1)
  }, [loadHistorico])

  const renderTipoBadge = (tipo: string) => {
    const normalized = String(tipo || '').trim().toLowerCase()
    const isSaida = normalized === 'saida' || normalized === 'saída'
    const label = isSaida ? 'Saída' : 'Entrada'
    const badgeClass = isSaida ? 'EstoqueHistoricoView-tipoBadge--saida' : 'EstoqueHistoricoView-tipoBadge--entrada'

    return <span className={`EstoqueHistoricoView-tipoBadge ${badgeClass}`}>{label}</span>
  }

  const renderConsumoContexto = (mov: HistoricoMovimentacao) => {
    const tipo = mov.tipo_consumo
    if (!tipo) return <span className="text-muted">-</span>

    const labels: Record<string, string> = {
      CONSUMO_HOSPEDE: 'Quarto / cliente',
      OUTRO_CONSUMO: 'Outro consumo',
      DESCARTE: 'Descarte'
    }
    const reserva = mov.codigo_reserva ? `Reserva ${mov.codigo_reserva}` : ''
    const responsavel = mov.responsavel_consumo || ''
    const valor = mov.valor_total ? Number(mov.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''
    const isPrazo = Number(mov.is_prazo || 0) === 1
    const meta = [reserva, responsavel, isPrazo ? 'AP' : mov.nome_forma_pagamento, valor].filter(Boolean).join(' • ')

    return (
      <div>
        <span className="EstoqueHistoricoView-contextBadge">{labels[tipo] || tipo}</span>
        {isPrazo ? <span className="EstoqueHistoricoView-apBadge">AP</span> : null}
        {Number(mov.valor_sobrescrito || 0) === 1 ? <span className="EstoqueHistoricoView-apBadge">Valor alterado</span> : null}
        {meta ? <small className="EstoqueHistoricoView-contextMeta">{meta}</small> : null}
      </div>
    )
  }

  const abrirCorrecao = (mov: HistoricoMovimentacao) => {
    const quantidadeAtual = mov.quantidade_corrigida ?? mov.quantidade
    setCorrecaoModal(mov)
    setCorrecaoQuantidade(String(quantidadeAtual ?? ''))
    setCorrecaoMotivo('')
    setCorrecaoErro('')
  }

  const fecharCorrecao = () => {
    if (correcaoSalvando) return
    setCorrecaoModal(null)
    setCorrecaoQuantidade('')
    setCorrecaoMotivo('')
    setCorrecaoErro('')
  }

  const salvarCorrecao = async () => {
    if (!correcaoModal) return

    const quantidade = Number(correcaoQuantidade)
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      setCorrecaoErro('Informe uma quantidade válida.')
      return
    }

    if (!correcaoMotivo.trim()) {
      setCorrecaoErro('Informe o motivo da correção.')
      return
    }

    setCorrecaoSalvando(true)
    setCorrecaoErro('')
    try {
      await estoqueMovimentacaoService.corrigirMovimentacao({
        id_movimentacao: correcaoModal.id_movimentacao,
        quantidade_corrigida: quantidade,
        motivo: correcaoMotivo.trim()
      })
      setCorrecaoModal(null)
      await loadHistorico(historicoPaginaAtual)
    } catch (error) {
      setCorrecaoErro(error instanceof Error ? error.message : 'Erro ao corrigir movimentação.')
    } finally {
      setCorrecaoSalvando(false)
    }
  }

  const renderQuantidade = (mov: HistoricoMovimentacao) => {
    const isCorrigida = Number(mov.corrigida || 0) === 1 && mov.quantidade_corrigida !== null && mov.quantidade_corrigida !== undefined && mov.quantidade_corrigida !== ''
    if (!isCorrigida) return <span>{String(mov.quantidade)}</span>

    return (
      <span className="EstoqueHistoricoView-quantidadeCorrigida">
        <span className="EstoqueHistoricoView-quantidadeOriginal">{String(mov.quantidade)}</span>
        <span>{String(mov.quantidade_corrigida)}</span>
        <span className="EstoqueHistoricoView-corrigidaBadge">Corrigida</span>
      </span>
    )
  }

  const tableColSpan = isAdmin ? 8 : 7

  return (
    <div className="EstoqueHistoricoView-view card">
      <div className="EstoqueHistoricoView-header">
        <h4 className="mb-0">Histórico de Movimentações</h4>
        <input
          type="date"
          className="form-control EstoqueHistoricoView-date"
          value={historicoData}
          onChange={(event) => {
            const nextData = event.target.value
            setHistoricoData(nextData)
            void loadHistorico(1, nextData)
          }}
        />
      </div>
      <div className="table-responsive">
        <table className="table table-hover mb-0 EstoqueHistoricoView-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Tipo</th>
              <th>Item</th>
              <th>Contexto</th>
              <th className="text-center">Qtd</th>
              <th>Responsável</th>
              <th className="text-center">Observação</th>
              {isAdmin ? <th className="text-center">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {historicoLoading ? (
              <tr><td colSpan={tableColSpan} className="text-center">Carregando...</td></tr>
            ) : historicoError ? (
              <tr><td colSpan={tableColSpan} className="text-center text-danger">{historicoError}</td></tr>
            ) : historico.length === 0 ? (
              <tr><td colSpan={tableColSpan} className="text-center">Sem registros</td></tr>
            ) : historico.map((mov) => (
              <tr key={mov.id_movimentacao}>
                <td>{mov.data_formatada}</td>
                <td>{renderTipoBadge(mov.tipo)}</td>
                <td>{mov.nome_item}</td>
                <td>{renderConsumoContexto(mov)}</td>
                <td className="text-center">{renderQuantidade(mov)}</td>
                <td>{mov.responsavel || 'Sistema'}</td>
                <td className="text-center">
                  {mov.observacao?.trim() ? (
                    <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setObservacaoModal(mov)}>
                      <i className="fas fa-eye" />
                    </button>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                {isAdmin ? (
                  <td className="text-center">
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => abrirCorrecao(mov)}>
                      Corrigir
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <BasePagination page={historicoPaginaAtual} totalPages={historicoTotalPaginas} onChangePage={(page) => void loadHistorico(page)} />
      </div>

      {observacaoModal ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Observação</h5>
                  <button type="button" className="btn-close" onClick={() => setObservacaoModal(null)} />
                </div>
                <div className="modal-body">
                  <p className="EstoqueHistoricoView-observacaoText">{observacaoModal.observacao}</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setObservacaoModal(null)}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {correcaoModal ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Corrigir movimentação</h5>
                  <button type="button" className="btn-close" onClick={fecharCorrecao} disabled={correcaoSalvando} />
                </div>
                <div className="modal-body">
                  <div className="EstoqueHistoricoView-correcaoMeta">
                    <span>{correcaoModal.nome_item}</span>
                    <strong>{correcaoModal.data_formatada}</strong>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quantidade correta</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      value={correcaoQuantidade}
                      onChange={(event) => setCorrecaoQuantidade(event.target.value)}
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Motivo</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={correcaoMotivo}
                      onChange={(event) => setCorrecaoMotivo(event.target.value)}
                    />
                  </div>
                  {correcaoErro ? <div className="alert alert-danger mt-3 mb-0">{correcaoErro}</div> : null}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={fecharCorrecao} disabled={correcaoSalvando}>Cancelar</button>
                  <button type="button" className="btn btn-primary" onClick={() => void salvarCorrecao()} disabled={correcaoSalvando}>
                    {correcaoSalvando ? 'Salvando...' : 'Salvar correção'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
