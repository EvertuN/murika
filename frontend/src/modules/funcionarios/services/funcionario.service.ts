import { api } from '@/shared/services/api'

export type Funcionario = {
  id_funcionario: number
  nome: string
  id_cargo: number | null
  cargo?: string | null
}

export const funcionarioService = {
  async listar(): Promise<Funcionario[]> {
    return api.get<Funcionario[]>('/funcionarios', { acao: 'listar' })
  },

  async cadastrar(payload: { nome: string; id_cargo: number }): Promise<void> {
    await api.post<void>('/funcionarios', { acao: 'cadastrar', ...payload })
  },

  async editar(id: number, payload: { nome: string; id_cargo: number }): Promise<void> {
    await api.post<void>('/funcionarios', { acao: 'editar', id, ...payload })
  },

  async deletar(id: number): Promise<void> {
    await api.post<void>('/funcionarios', { acao: 'deletar', id })
  }
}

export default funcionarioService
