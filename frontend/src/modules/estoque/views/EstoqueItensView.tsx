'use client'

import './EstoqueItensView.css'
import { useEffect, useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import estoqueCategoriaService, { type EstoqueCategoria } from '@/modules/estoque/services/estoque-categoria.service'
import estoqueItemService, { type EstoqueItem } from '@/modules/estoque/services/estoque-item.service'
import EstoqueDeleteConfirmModal from './EstoqueDeleteConfirmModal'
import EstoqueItemModal, { type EstoqueItemForm } from './EstoqueItemModal'

type Props = { sectionId: string }

const EMPTY_FORM: EstoqueItemForm = {
  nome: '',
  id_categoria: '',
  preco_venda: ''
}

function formatMoneyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const numeric = Number(digits) / 100
  return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatMoneyDisplay(value: number | string): string {
  const numeric = Number(String(value || '0').replace(',', '.'))
  return Number.isFinite(numeric) ? numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
}

function moneyInputToDecimal(value: string): string {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.')
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00'
}

export default function EstoqueItensView({ sectionId }: Props) {
  const { navigateTo } = useSectionRouter()
  const { isAdmin } = useAuth()
  const [categorias, setCategorias] = useState<EstoqueCategoria[]>([])
  const [itens, setItens] = useState<EstoqueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [formItem, setFormItem] = useState<EstoqueItemForm>(EMPTY_FORM)
  const [editItemId, setEditItemId] = useState<number | null>(null)
  const [editOnlyPrice, setEditOnlyPrice] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EstoqueItem | null>(null)

  const isCadastroSection = sectionId === 'cadastrar_item'

  const load = async () => {
    setLoading(true)
    setErro('')
    try {
      const [categoriasData, itensData] = await Promise.all([
        estoqueCategoriaService.listar(),
        estoqueItemService.listar()
      ])
      setCategorias(categoriasData)
      setItens(itensData)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar itens.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return itens
    return itens.filter((item) => {
      const nome = item.nome.toLowerCase()
      const categoria = String(item.nome_categoria || '').toLowerCase()
      return nome.includes(termo) || categoria.includes(termo)
    })
  }, [busca, itens])

  const closeModal = () => {
    setFormItem(EMPTY_FORM)
    setEditItemId(null)
    setEditOnlyPrice(false)
    navigateTo('lista_item')
  }

  const submitItem = async () => {
    if (!formItem.nome.trim() || !formItem.id_categoria || !formItem.preco_venda.trim()) return
    setErro('')
    const payload = {
      nome: formItem.nome.trim(),
      id_categoria: Number(formItem.id_categoria),
      preco_venda: moneyInputToDecimal(formItem.preco_venda)
    }
    try {
      if (editItemId) {
        await estoqueItemService.editar(editItemId, payload)
      } else {
        await estoqueItemService.cadastrar(payload)
      }
      emitEntityUpdated({ endpoint: '/item' })
      setFormItem(EMPTY_FORM)
      setEditItemId(null)
      setEditOnlyPrice(false)
      await load()
      navigateTo('lista_item')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar item.')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setErro('')
    try {
      await estoqueItemService.deletar(deleteTarget.id_item)
      emitEntityUpdated({ endpoint: '/item' })
      setDeleteTarget(null)
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir item.')
    }
  }

  const activateItem = async (item: EstoqueItem) => {
    setErro('')
    try {
      await estoqueItemService.ativar(item.id_item)
      emitEntityUpdated({ endpoint: '/item' })
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao ativar item.')
    }
  }

  const categoriasAtivas = useMemo(() => categorias.filter((categoria) => Number(categoria.is_deleted || 0) !== 1), [categorias])

  if (loading) return <div className="EstoqueItensView-view card">Carregando...</div>

  return (
    <div className="EstoqueItensView-view card">
      <div className="EstoqueItensView-header">
        <h4 className="mb-0">Itens de Estoque</h4>
        <div className="EstoqueItensView-actionsHeader">
          <BaseButton variant="primary" onClick={() => navigateTo('lista_item')}>Itens</BaseButton>
          <BaseButton variant="outline-secondary" onClick={() => navigateTo('lista_categoria_item')}>Categorias</BaseButton>
          {isAdmin ? <BaseButton variant="outline-primary" onClick={() => navigateTo('cadastrar_item')}>Novo</BaseButton> : null}
        </div>
      </div>
      {erro ? <div className="alert alert-danger">{erro}</div> : null}

      <div className="mb-3">
        <input className="form-control" placeholder="Buscar item..." value={busca} onChange={(event) => setBusca(event.target.value)} />
      </div>

      {isAdmin && (isCadastroSection || editItemId) ? (
        <EstoqueItemModal
          form={formItem}
          editId={editItemId}
          categorias={categoriasAtivas}
          editOnlyPrice={editOnlyPrice}
          onChange={(next) => setFormItem({ ...next, preco_venda: formatMoneyInput(next.preco_venda) })}
          onClose={closeModal}
          onSubmit={() => void submitItem()}
        />
      ) : null}

      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Preço sugerido</th>
              <th className="text-center">Saldo</th>
              <th className="text-center">Mínimo</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center">Sem itens</td></tr>
            ) : itensFiltrados.map((item) => {
              const isDeleted = Number(item.is_deleted || 0) === 1
              return (
              <tr key={item.id_item} className={isDeleted ? 'EstoqueItensView-row--deleted' : ''}>
                <td>{item.id_item}</td>
                <td>{item.nome} {isDeleted ? <span className="EstoqueItensView-badge">Inativo</span> : null}</td>
                <td>{item.nome_categoria || '-'}</td>
                <td>{formatMoneyDisplay(item.preco_venda)}</td>
                <td className="text-center">{item.quantidade_atual}</td>
                <td className="text-center">{item.quantidade_minima}</td>
                <td className="text-center">
                  {isAdmin ? <div className="d-inline-flex gap-1">
                    {isDeleted ? (
                      <BaseButton size="action" variant="outline-primary" onClick={() => void activateItem(item)}>
                        Ativar
                      </BaseButton>
                    ) : (
                    <>
                    <BaseButton size="action" variant="outline-primary" onClick={() => {
                      setEditItemId(item.id_item)
                      setEditOnlyPrice(false)
                      setFormItem({
                        nome: item.nome,
                        id_categoria: String(item.id_categoria || ''),
                        preco_venda: formatMoneyDisplay(item.preco_venda)
                      })
                      navigateTo('cadastrar_item')
                    }}>
                      Editar
                    </BaseButton>
                    <BaseButton size="action" variant="danger" onClick={() => setDeleteTarget(item)}>
                      Excluir
                    </BaseButton>
                    </>
                    )}
                  </div> : <span className="text-muted">Somente leitura</span>}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <EstoqueDeleteConfirmModal
          itemType="item"
          label={deleteTarget.nome}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  )
}
