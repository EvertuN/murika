'use client'

import './FuncionariosView.css'
import { useEffect, useMemo, useState } from 'react'
import BaseButton from '@/shared/components/base/BaseButton'
import funcionarioService, { type Funcionario } from '@/modules/funcionarios/services/funcionario.service'
import cargoService, { type Cargo } from '@/modules/funcionarios/services/cargo.service'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'

type Props = { sectionId: string }

export default function FuncionariosView({ sectionId }: Props) {
  const { navigateTo } = useSectionRouter()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const [nome, setNome] = useState('')
  const [idCargo, setIdCargo] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Funcionario | null>(null)
  const isCadastro = sectionId === 'cadastrar_funcionario'

  const closeModal = () => {
    setEditId(null)
    setNome('')
    setIdCargo('')
    navigateTo('listar_funcionarios')
  }

  const load = async () => {
    setLoading(true)
    setErro('')
    try {
      const [funcData, cargoData] = await Promise.all([funcionarioService.listar(), cargoService.listar()])
      setFuncionarios(funcData)
      setCargos(cargoData)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar funcionários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return funcionarios
    return funcionarios.filter((entry) => {
      const nomeMatch = entry.nome.toLowerCase().includes(termo)
      const cargoMatch = String(entry.cargo || '').toLowerCase().includes(termo)
      return nomeMatch || cargoMatch
    })
  }, [busca, funcionarios])

  const submit = async () => {
    if (!nome.trim() || !idCargo) return
    setErro('')
    const payload = {
      nome: nome.trim(),
      id_cargo: Number(idCargo)
    }
    try {
      if (editId) {
        await funcionarioService.editar(editId, payload)
      } else {
        await funcionarioService.cadastrar(payload)
      }
      emitEntityUpdated({ endpoint: '/funcionarios' })
      setNome('')
      setIdCargo('')
      setEditId(null)
      await load()
      navigateTo('listar_funcionarios')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar funcionário.')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setErro('')
    try {
      await funcionarioService.deletar(deleteTarget.id_funcionario)
      emitEntityUpdated({ endpoint: '/funcionarios' })
      setDeleteTarget(null)
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir funcionário.')
    }
  }

  return (
    <div className="FuncionariosView-view card">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Funcionários</h4>
        <div className="d-flex gap-2">
          <BaseButton variant="outline-secondary" onClick={() => navigateTo('listar_cargos')}>Ver Cargos</BaseButton>
          <BaseButton variant="outline-primary" onClick={() => navigateTo('cadastrar_funcionario')}>Novo Funcionário</BaseButton>
        </div>
      </div>
      {erro ? <div className="alert alert-danger">{erro}</div> : null}

      <div className="mb-3">
        <input className="form-control" placeholder="Buscar funcionário..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {isCadastro || editId ? (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editId ? 'Editar Funcionário' : 'Novo Funcionário'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
          <div className="row g-2">
            <div className="col-12">
              <input className="form-control" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="col-12">
              <select className="form-select" value={idCargo} onChange={(e) => setIdCargo(e.target.value)}>
                <option value="">Cargo...</option>
                {cargos.map((cargo) => (
                  <option key={cargo.id_cargo} value={String(cargo.id_cargo)}>{cargo.cargo}</option>
                ))}
              </select>
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
              <th>Nome</th>
              <th>Cargo</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center">Carregando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={4} className="text-center">Sem funcionários</td></tr>
            ) : filtrados.map((entry) => (
              <tr key={entry.id_funcionario}>
                <td>{entry.id_funcionario}</td>
                <td>{entry.nome}</td>
                <td>{entry.cargo || '-'}</td>
                <td className="text-center">
                  <div className="d-inline-flex gap-1">
                    <BaseButton size="action" variant="outline-primary" onClick={() => {
                      setEditId(entry.id_funcionario)
                      setNome(entry.nome)
                      setIdCargo(entry.id_cargo ? String(entry.id_cargo) : '')
                      navigateTo('cadastrar_funcionario')
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
                  Deseja excluir o funcionário <strong>{deleteTarget.nome}</strong>?
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


