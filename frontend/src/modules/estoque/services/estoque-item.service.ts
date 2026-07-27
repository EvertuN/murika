import { api } from '@/shared/services/api'

export type EstoqueItem = {
  id_item: number
  nome: string
  preco_venda: number | string
  id_categoria: number | string
  nome_categoria?: string | null
  quantidade_minima: number | string
  quantidade_atual: number | string
  is_deleted?: number | string
  deleted_at?: string | null
  deleted_by?: string | null
}

type EstoqueItemPayload = {
  nome: string
  id_categoria: number
  preco_venda: string
}

export const estoqueItemService = {
  listar(): Promise<EstoqueItem[]> {
    return api.get<EstoqueItem[]>('/item', { acao: 'listar' })
  },

  async cadastrar(payload: EstoqueItemPayload): Promise<void> {
    await api.post<void>('/item', { acao: 'cadastrar', ...payload })
  },

  async editar(id: number, payload: EstoqueItemPayload): Promise<void> {
    await api.post<void>('/item', { acao: 'editar', id, ...payload })
  },

  async deletar(id: number): Promise<void> {
    await api.post<void>('/item', { acao: 'deletar', id })
  },

  async ativar(id: number): Promise<void> {
    await api.post<void>('/item', { acao: 'ativar', id })
  },

  async atualizarMinimo(payload: { id_item: number; minimo: number }): Promise<void> {
    await api.post<void>('/movimentacao', { acao: 'atualizar_minimo', ...payload })
  }
}

export default estoqueItemService
