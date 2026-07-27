import { api } from '@/shared/services/api'

export type FinanceiroResumo = {
  total_murika: number
  total_sem_prazo: number
  total_prazo: number
  pagamentos: number
  reservas_pagas: number
  reservas_fechadas_sem_pagamento: number
  reservas_abertas: number
  reservas_fechadas: number
  reservas_canceladas: number
}

export type FinanceiroPagamentoForma = {
  forma: string
  total: number | string
  quantidade: number | string
}

export type FinanceiroQuarto = {
  numero: string
  tipo: string
  total: number | string
  reservas: number | string
  media_reserva: number | string
}

export type FinanceiroEstoqueCategoria = {
  categoria: string
  quantidade_entrada: number | string
  quantidade_saida: number | string
  valor_saida: number | string
}

export type FinanceiroEstoqueItem = {
  nome: string
  categoria: string
  quantidade_saida: number | string
  valor_saida: number | string
}

export type FinanceiroDashboard = {
  periodo: {
    inicio: string
    fim: string
    label: string
    mes: number
    ano: number
  }
  resumo: FinanceiroResumo
  pagamentos: FinanceiroPagamentoForma[]
  quartos: FinanceiroQuarto[]
  tipos_quarto: FinanceiroQuarto[]
  estoque: {
    geral: {
      quantidade_entrada: number
      quantidade_saida: number
      movimentos_entrada: number
      movimentos_saida: number
      valor_saida: number
    }
    por_categoria: FinanceiroEstoqueCategoria[]
    por_item: FinanceiroEstoqueItem[]
  }
}

export type FinanceiroFiltro = {
  mes?: number
  ano?: number
  data_inicio?: string
  data_fim?: string
}

const cache = new Map<string, FinanceiroDashboard>()

function cacheKey(filtro: FinanceiroFiltro): string {
  return JSON.stringify(filtro)
}

export const financeiroService = {
  async dashboard(filtro: FinanceiroFiltro): Promise<FinanceiroDashboard> {
    const key = cacheKey(filtro)
    const cached = cache.get(key)
    if (cached) return cached

    const data = await api.get<FinanceiroDashboard>('/financeiro', { acao: 'dashboard', ...filtro })
    cache.set(key, data)
    return data
  },

  clearCache() {
    cache.clear()
  }
}

export default financeiroService
