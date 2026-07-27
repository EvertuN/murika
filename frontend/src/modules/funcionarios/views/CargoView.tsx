'use client'

import './CargoView.css'
import { useEffect, useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import cargoService, { type Cargo } from '@/modules/funcionarios/services/cargo.service'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'

type Props = { sectionId: string }

export default function CargoView({ sectionId }: Props) {
  const { navigateTo } = useSectionRouter()
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [busca, setBusca] = useState('')
  const [cargo, setCargo] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cargo | null>(null)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const isCadastro = sectionId === 'cadastrar_cargo'

  const closeModal = () => {
    setEditId(null)
    setCargo('')
    navigateTo('listar_cargos')
  }

  const load = async () => {
    setLoading(true)
    setErro('')
    try {
      setCargos(await cargoService.listar())
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar cargos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return cargos
    return cargos.filter((entry) => entry.cargo.toLowerCase().includes(termo))
  }, [busca, cargos])

  const submit = async () => {
    if (!cargo.trim()) return
    setErro('')
    try {
      if (editId) {
        await cargoService.editar(editId, { cargo: cargo.trim() })
      } else {
        await cargoService.cadastrar({ cargo: cargo.trim() })
      }
      emitEntityUpdated({ endpoint: '/cargo' })
      setCargo('')
      setEditId(null)
      await load()
      navigateTo('listar_cargos')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar cargo.')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setErro('')
    try {
      await cargoService.deletar(deleteTarget.id_cargo)
      emitEntityUpdated({ endpoint: '/cargo' })
      setDeleteTarget(null)
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir cargo.')
    }
  }

  return (
    <div className="CargoView-view card">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Cargos</h4>
        <BaseButton variant="outline-primary" onClick={() => navigateTo('cadastrar_cargo')}>Novo Cargo</BaseButton>
      </div>
      {erro ? <div className="alert alert-danger">{erro}</div> : null}

      <div className="mb-3">
        <input className="form-control" placeholder="Buscar cargo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {isCadastro || editId ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editId ? 'Editar Cargo' : 'Novo Cargo'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
          <div className="row g-2">
            <div className="col-12">
              <input className="form-control" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Nome do cargo" />
            </div>
          </div>
                </div>
                <div className="modal-footer">
                  <BaseButton variant="outline-secondary" onClick={closeModal}>Cancelar</BaseButton>
                  <BaseButton onClick={() => void submit()}>{editId ? 'Salvar' : 'Cadastrar'}</BaseButton>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cargo</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center">Carregando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={3} className="text-center">Sem cargos</td></tr>
            ) : filtrados.map((entry) => (
              <tr key={entry.id_cargo}>
                <td>{entry.id_cargo}</td>
                <td>{entry.cargo}</td>
                <td className="text-center">
                  <div className="d-inline-flex gap-1">
                    <BaseButton size="action" variant="outline-primary" onClick={() => {
                      setEditId(entry.id_cargo)
                      setCargo(entry.cargo)
                      navigateTo('cadastrar_cargo')
                    }}>
                      Editar
                    </BaseButton>
                    <BaseButton size="action" variant="danger" onClick={() => setDeleteTarget(entry)}>
                      Excluir
                    </BaseButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteTarget ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar exclusão</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
                </div>
                <div className="modal-body">
                  Deseja excluir o cargo <strong>{deleteTarget.cargo}</strong>?
                </div>
                <div className="modal-footer">
                  <BaseButton variant="outline-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</BaseButton>
                  <BaseButton variant="danger" onClick={() => void confirmDelete()}>Excluir</BaseButton>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}


