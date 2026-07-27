import { api } from '@/shared/services/api'

export type EstoqueCategoria = {
  id_categoria: number
  nome_categoria: string
  is_deleted?: number | string
  deleted_at?: string | null
  deleted_by?: string | null
}

export const estoqueCategoriaService = {
  async listar(): Promise<EstoqueCategoria[]> {
    return api.get<EstoqueCategoria[]>('/categoria', { acao: 'listar' })
  },

  async cadastrar(payload: { nome_categoria: string }): Promise<void> {
    await api.post<void>('/categoria', { acao: 'cadastrar', ...payload })
  },

  async editar(id: number, payload: { nome_categoria: string }): Promise<void> {
    await api.post<void>('/categoria', { acao: 'editar', id, ...payload })
  },

  async deletar(id: number): Promise<void> {
    await api.post<void>('/categoria', { acao: 'deletar', id })
  },

  async ativar(id: number): Promise<void> {
    await api.post<void>('/categoria', { acao: 'ativar', id })
  }
}

export default estoqueCategoriaService
