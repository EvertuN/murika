'use client'

import './EstoqueDiaView.css'
import { useEffect, useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import hospedagemReservaService, { type FormaPagamento } from '@/modules/hospedagem/services/hospedagem_reserva.service'
import estoqueMovimentacaoService, {
  type EstoqueItemOption,
  type EstoqueItemSaldo,
  type EstoqueTipoMovimentacao,
  type ReservaConsumoOption
} from '@/modules/estoque/services/estoque-movimentacao.service'
import EstoqueMovimentacaoModal, { type MovimentacaoFormPayload } from './EstoqueMovimentacaoModal'
import EstoqueRelatorioButton from './EstoqueRelatorioButton'

export default function EstoqueDiaView() {
  const { navigateTo } = useSectionRouter()
  const { permissions } = useAuth()
  const [busca, setBusca] = useState('')
  const [estoque, setEstoque] = useState<EstoqueItemSaldo[]>([])
  const [itens, setItens] = useState<EstoqueItemOption[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [reservas, setReservas] = useState<ReservaConsumoOption[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [modal, setModal] = useState<{ tipo?: EstoqueTipoMovimentacao; idItem?: string } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState('')

  const carregarEstoque = async () => {
    setLoading(true)
    setErro('')
    try {
      setEstoque(await estoqueMovimentacaoService.listarEstoque())
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void carregarEstoque()
    void Promise.all([
      estoqueMovimentacaoService.listarItens().then(setItens),
      estoqueMovimentacaoService.listarReservasParaConsumo().then(setReservas),
      hospedagemReservaService.listarFormasPagamento().then(setFormasPagamento)
    ])
  }, [])

  const estoqueFiltrado = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return estoque
    return estoque.filter((item) => `${item.nome} ${item.nome_categoria || ''}`.toLocaleLowerCase('pt-BR').includes(termo))
  }, [busca, estoque])

  const registrar = async (payload: MovimentacaoFormPayload) => {
    setSalvando(true)
    setErroModal('')
    try {
      await estoqueMovimentacaoService.registrarMovimentacao(payload)
      emitEntityUpdated({ endpoint: '/movimentacao' })
      setModal(null)
      setSucesso('Movimentação registrada com sucesso.')
      await carregarEstoque()
    } catch (error) {
      setErroModal(error instanceof Error ? error.message : 'Erro ao registrar movimentação.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirModal = (tipo?: EstoqueTipoMovimentacao, idItem?: string) => {
    setSucesso('')
    setErroModal('')
    setModal({ tipo, idItem })
  }

  return (
    <div className="EstoqueDiaView-view card">
      <div className="EstoqueDiaView-header">
        <div>
          <h4 className="mb-1">Estoque</h4>
          <small className="text-muted">Quantidade única por item</small>
        </div>
        <div className="EstoqueDiaView-toolbar">
          <BaseButton variant="outline-secondary" size="toolbar" className="EstoqueDiaView-toolbarButton" onClick={() => navigateTo('historico')}>
            <i className="fas fa-clock" aria-hidden="true" /> Histórico
          </BaseButton>
          {permissions.viewReports ? <EstoqueRelatorioButton /> : null}
          {permissions.operationalWrite ? (
            <BaseButton variant="primary" size="toolbar" className="EstoqueDiaView-toolbarButton EstoqueDiaView-toolbarButton--primary" onClick={() => abrirModal()}>
              <i className="fas fa-plus" aria-hidden="true" /> Nova movimentação
            </BaseButton>
          ) : null}
        </div>
      </div>

      <div className="EstoqueDiaView-content">
        {sucesso ? <div className="alert alert-success">{sucesso}</div> : null}
        <div className="EstoqueDiaView-search">
          <input className="form-control" placeholder="Buscar item ou categoria..." value={busca} onChange={(event) => setBusca(event.target.value)} />
        </div>
        <div className="table-responsive EstoqueDiaView-tableWrap">
          <table className="table mb-0 EstoqueDiaView-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Categoria</th>
                <th className="text-center">Quantidade</th>
                <th className="text-center">Mínimo</th>
                <th className="text-center">Status</th>
                {permissions.operationalWrite ? <th className="text-center">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={permissions.operationalWrite ? 6 : 5} className="text-center">Carregando...</td></tr> : null}
              {!loading && erro ? <tr><td colSpan={permissions.operationalWrite ? 6 : 5} className="text-center text-danger">{erro}</td></tr> : null}
              {!loading && !erro && estoqueFiltrado.length === 0 ? <tr><td colSpan={permissions.operationalWrite ? 6 : 5} className="text-center">Nenhum item encontrado.</td></tr> : null}
              {!loading && !erro ? estoqueFiltrado.map((item) => (
                <tr key={item.id_item}>
                  <td className="EstoqueDiaView-itemCell">{item.nome}</td>
                  <td>{item.nome_categoria || '-'}</td>
                  <td className="text-center"><span className="EstoqueDiaView-quantityBadge">{item.quantidade_atual}</span></td>
                  <td className="text-center">{item.quantidade_minima}</td>
                  <td className="text-center">
                    <span className={`EstoqueDiaView-statusBadge ${String(item.status).toLowerCase() === 'ok' ? 'EstoqueDiaView-statusBadge--ok' : 'EstoqueDiaView-statusBadge--baixo'}`}>{item.status}</span>
                  </td>
                  {permissions.operationalWrite ? (
                    <td className="text-center">
                      <div className="EstoqueDiaView-actions">
                        <BaseButton variant="outline-primary" size="action" className="EstoqueDiaView-actionButton EstoqueDiaView-actionButton--entrada" onClick={() => abrirModal('entrada', String(item.id_item))}>Entrada</BaseButton>
                        <BaseButton variant="danger" size="action" className="EstoqueDiaView-actionButton EstoqueDiaView-actionButton--saida" onClick={() => abrirModal('saida', String(item.id_item))}>Saída</BaseButton>
                      </div>
                    </td>
                  ) : null}
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modal && permissions.operationalWrite ? (
        <EstoqueMovimentacaoModal
          initialTipo={modal.tipo}
          initialItem={modal.idItem}
          itens={itens}
          reservas={reservas}
          formasPagamento={formasPagamento}
          salvando={salvando}
          erro={erroModal}
          onClose={() => setModal(null)}
          onSubmit={(payload) => void registrar(payload)}
        />
      ) : null}
    </div>
  )
}
