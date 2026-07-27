import { api } from '@/shared/services/api'

export type Empresa = {
  id_empresa: number
  razao_social: string
  cnpj?: string | null
  telefone?: string | null
  is_deleted?: number | string
  deleted_at?: string | null
  deleted_by?: string | null
}

type EmpresaPayload = Record<string, string | number | boolean | null | undefined>
type CreateResult = { id: number | string }

export const empresaService = {
  async listar(): Promise<Empresa[]> {
    return api.get<Empresa[]>('/empresa', { acao: 'listar' })
  },

  async cadastrar(payload: EmpresaPayload): Promise<CreateResult> {
    const response = await api.postEnvelope<Empresa[]>('/empresa', { acao: 'cadastrar', ...payload })
    return { id: response.id as number | string }
  },

  async editar(id: number, payload: EmpresaPayload): Promise<void> {
    await api.post<void>('/empresa', { acao: 'editar', id, ...payload })
  },

  async deletar(id: number): Promise<void> {
    await api.post<void>('/empresa', { acao: 'deletar', id })
  },

  async ativar(id: number): Promise<void> {
    await api.post<void>('/empresa', { acao: 'ativar', id })
  }
}

export default empresaService
