import { api } from '@/shared/services/api'

export type Cliente = {
  id_cliente: number
  nome: string
  telefone?: string | null
  email?: string | null
  tipo_documento?: string | null
  documento?: string | null
  credito?: string | number | null
  is_deleted?: number | string
  deleted_at?: string | null
  deleted_by?: string | null
}

type ClientePayload = Record<string, string | number | boolean | null | undefined>
type CreateResult = { id: number | string }

export const clienteService = {
  async listar(): Promise<Cliente[]> {
    return api.get<Cliente[]>('/cliente', { acao: 'listar' })
  },

  async cadastrar(payload: ClientePayload): Promise<CreateResult> {
    const response = await api.postEnvelope<Cliente[]>('/cliente', { acao: 'cadastrar', ...payload })
    return { id: response.id as number | string }
  },

  async editar(id: number, payload: ClientePayload): Promise<void> {
    await api.post<void>('/cliente', { acao: 'editar', id, ...payload })
  },

  async deletar(id: number): Promise<void> {
    await api.post<void>('/cliente', { acao: 'deletar', id })
  },

  async ativar(id: number): Promise<void> {
    await api.post<void>('/cliente', { acao: 'ativar', id })
  }
}

export default clienteService
