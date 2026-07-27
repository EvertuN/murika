'use client'

import './ClientesListView.css'
import BaseButton from '@/shared/components/base/BaseButton'
import BasePagination from '@/shared/components/base/BasePagination'
import type { Cliente } from '@/modules/hospedagem/services/cliente.service'

type Props = {
  clientes: Cliente[]
  loading: boolean
  page: number
  totalPages: number
  busca: string
  onChangeBusca: (value: string) => void
  onChangePage: (page: number) => void
  onNew: () => void
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onActivate: (cliente: Cliente) => void
  isAdmin: boolean
  canCreate: boolean
}

export default function ClientesListView({
  clientes,
  loading,
  page,
  totalPages,
  busca,
  onChangeBusca,
  onChangePage,
  onNew,
  onEdit,
  onDelete,
  onActivate,
  isAdmin,
  canCreate
}: Props) {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Clientes</h4>
        {canCreate ? <BaseButton variant="outline-primary" onClick={onNew}>Novo Cliente</BaseButton> : null}
      </div>
      <div className="mb-3">
        <input className="form-control" placeholder="Buscar cliente..." value={busca} onChange={(event) => onChangeBusca(event.target.value)} />
      </div>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Documento</th>
              <th>Telefone</th>
              <th>Email</th>
              {isAdmin ? <th className="text-center">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="text-center">Carregando...</td></tr>
            ) : clientes.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="text-center">Sem clientes</td></tr>
            ) : clientes.map((entry) => {
              const isDeleted = Number(entry.is_deleted || 0) === 1
              return (
              <tr key={entry.id_cliente} className={isDeleted ? 'ClientesListView-row--deleted' : ''}>
                <td>{entry.id_cliente}</td>
                <td>{entry.nome} {isDeleted ? <span className="ClientesListView-badge">Inativo</span> : null}</td>
                <td>{entry.documento || '-'}</td>
                <td>{entry.telefone || '-'}</td>
                <td>{entry.email || '-'}</td>
                {isAdmin ? (
                  <td className="text-center">
                    <div className="d-inline-flex gap-1">
                      {isDeleted ? (
                        <BaseButton size="action" variant="outline-primary" onClick={() => onActivate(entry)}>Ativar</BaseButton>
                      ) : (
                        <>
                          <BaseButton size="action" variant="outline-primary" onClick={() => onEdit(entry)}>Editar</BaseButton>
                          <BaseButton size="action" variant="danger" onClick={() => onDelete(entry)}>Excluir</BaseButton>
                        </>
                      )}
                    </div>
                  </td>
                ) : null}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <BasePagination page={page} totalPages={totalPages} onChangePage={onChangePage} />
      </div>
    </>
  )
}
