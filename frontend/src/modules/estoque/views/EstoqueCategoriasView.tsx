'use client'

import './EstoqueCategoriasView.css'
import { useEffect, useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import estoqueCategoriaService, { type EstoqueCategoria } from '@/modules/estoque/services/estoque-categoria.service'
import EstoqueCategoriaModal from './EstoqueCategoriaModal'
import EstoqueDeleteConfirmModal from './EstoqueDeleteConfirmModal'

type Props = { sectionId: string }

export default function EstoqueCategoriasView({ sectionId }: Props) {
  const { navigateTo } = useSectionRouter()
  const { isAdmin } = useAuth()
  const [categorias, setCategorias] = useState<EstoqueCategoria[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [formCategoria, setFormCategoria] = useState('')
  const [editCategoriaId, setEditCategoriaId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EstoqueCategoria | null>(null)

  const isCadastroSection = sectionId === 'cadastrar_categoria_item'

  const load = async () => {
    setLoading(true)
    setErro('')
    try {
      setCategorias(await estoqueCategoriaService.listar())
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return categorias
    return categorias.filter((item) => item.nome_categoria.toLowerCase().includes(termo))
  }, [busca, categorias])

  const closeModal = () => {
    setFormCategoria('')
    setEditCategoriaId(null)
    navigateTo('lista_categoria_item')
  }

  const submitCategoria = async () => {
    const nome = formCategoria.trim()
    if (!nome) return
    setErro('')
    try {
      if (editCategoriaId) {
        await estoqueCategoriaService.editar(editCategoriaId, { nome_categoria: nome })
      } else {
        await estoqueCategoriaService.cadastrar({ nome_categoria: nome })
      }
      emitEntityUpdated({ endpoint: '/categoria' })
      setFormCategoria('')
      setEditCategoriaId(null)
      await load()
      navigateTo('lista_categoria_item')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar categoria.')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setErro('')
    try {
      await estoqueCategoriaService.deletar(deleteTarget.id_categoria)
      emitEntityUpdated({ endpoint: '/categoria' })
      setDeleteTarget(null)
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir categoria.')
    }
  }

  const activateCategoria = async (categoria: EstoqueCategoria) => {
    setErro('')
    try {
      await estoqueCategoriaService.ativar(categoria.id_categoria)
      emitEntityUpdated({ endpoint: '/categoria' })
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao ativar categoria.')
    }
  }

  if (loading) return <div className="EstoqueCategoriasView-view card">Carregando...</div>

  return (
    <div className="EstoqueCategoriasView-view card">
      <div className="EstoqueCategoriasView-header">
        <h4 className="mb-0">Categorias de Estoque</h4>
        <div className="EstoqueCategoriasView-actionsHeader">
          <BaseButton variant="outline-secondary" onClick={() => navigateTo('lista_item')}>Itens</BaseButton>
          <BaseButton variant="primary" onClick={() => navigateTo('lista_categoria_item')}>Categorias</BaseButton>
          {isAdmin ? <BaseButton variant="outline-primary" onClick={() => navigateTo('cadastrar_categoria_item')}>Novo</BaseButton> : null}
        </div>
      </div>
      {erro ? <div className="alert alert-danger">{erro}</div> : null}

      <div className="mb-3">
        <input className="form-control" placeholder="Buscar categoria..." value={busca} onChange={(event) => setBusca(event.target.value)} />
      </div>

      {isAdmin && (isCadastroSection || editCategoriaId) ? (
        <EstoqueCategoriaModal
          value={formCategoria}
          editId={editCategoriaId}
          onChange={setFormCategoria}
          onClose={closeModal}
          onSubmit={() => void submitCategoria()}
        />
      ) : null}

      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Categoria</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categoriasFiltradas.length === 0 ? (
              <tr><td colSpan={3} className="text-center">Sem categorias</td></tr>
            ) : categoriasFiltradas.map((categoria) => {
              const isDeleted = Number(categoria.is_deleted || 0) === 1
              return (
              <tr key={categoria.id_categoria} className={isDeleted ? 'EstoqueCategoriasView-row--deleted' : ''}>
                <td>{categoria.id_categoria}</td>
                <td>{categoria.nome_categoria} {isDeleted ? <span className="EstoqueCategoriasView-badge">Inativo</span> : null}</td>
                <td className="text-center">
                  {isAdmin ? (
                    <div className="d-inline-flex gap-1">
                      {isDeleted ? (
                        <BaseButton size="action" variant="outline-primary" onClick={() => void activateCategoria(categoria)}>
                          Ativar
                        </BaseButton>
                      ) : (
                        <>
                          <BaseButton size="action" variant="outline-primary" onClick={() => {
                            setEditCategoriaId(categoria.id_categoria)
                            setFormCategoria(categoria.nome_categoria)
                            navigateTo('cadastrar_categoria_item')
                          }}>
                            Editar
                          </BaseButton>
                          <BaseButton size="action" variant="danger" onClick={() => setDeleteTarget(categoria)}>
                            Excluir
                          </BaseButton>
                        </>
                      )}
                    </div>
                  ) : <span className="text-muted">Somente admin</span>}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <EstoqueDeleteConfirmModal
          itemType="categoria"
          label={deleteTarget.nome_categoria}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  )
}
