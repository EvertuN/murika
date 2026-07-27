import { api } from '@/shared/services/api'

export type Cargo = {
  id_cargo: number
  cargo: string
}

export const cargoService = {
  async listar(): Promise<Cargo[]> {
    return api.get<Cargo[]>('/cargo', { acao: 'listar' })
  },

  async cadastrar(payload: { cargo: string }): Promise<void> {
    await api.post<void>('/cargo', { acao: 'cadastrar', ...payload })
  },

  async editar(id: number, payload: { cargo: string }): Promise<void> {
    await api.post<void>('/cargo', { acao: 'editar', id, ...payload })
  },

  async deletar(id: number): Promise<void> {
    await api.post<void>('/cargo', { acao: 'deletar', id })
  }
}

export default cargoService
