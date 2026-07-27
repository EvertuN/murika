'use client'

import './EmpresasListView.css'
import BaseButton from '@/shared/components/base/BaseButton'
import type { Empresa } from '@/modules/hospedagem/services/empresa.service'

type Props = {
  empresas: Empresa[]
  loading: boolean
  busca: string
  onChangeBusca: (value: string) => void
  onNew: () => void
  onEdit: (empresa: Empresa) => void
  onDelete: (empresa: Empresa) => void
  onActivate: (empresa: Empresa) => void
  isAdmin: boolean
  canCreate: boolean
}

export default function EmpresasListView({ empresas, loading, busca, onChangeBusca, onNew, onEdit, onDelete, onActivate, isAdmin, canCreate }: Props) {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Empresas</h4>
        {canCreate ? <BaseButton variant="outline-primary" onClick={onNew}>Nova Empresa</BaseButton> : null}
      </div>
      <div className="mb-3">
        <input className="form-control" placeholder="Buscar empresa..." value={busca} onChange={(event) => onChangeBusca(event.target.value)} />
      </div>
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Razão social</th>
              <th>CNPJ</th>
              <th>Telefone</th>
              {isAdmin ? <th className="text-center">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="text-center">Carregando...</td></tr>
            ) : empresas.length === 0 ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="text-center">Sem empresas</td></tr>
            ) : empresas.map((entry) => {
              const isDeleted = Number(entry.is_deleted || 0) === 1
              return (
              <tr key={entry.id_empresa} className={isDeleted ? 'EmpresasListView-row--deleted' : ''}>
                <td>{entry.id_empresa}</td>
                <td>{entry.razao_social} {isDeleted ? <span className="EmpresasListView-badge">Inativo</span> : null}</td>
                <td>{entry.cnpj || '-'}</td>
                <td>{entry.telefone || '-'}</td>
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
    </>
  )
}
