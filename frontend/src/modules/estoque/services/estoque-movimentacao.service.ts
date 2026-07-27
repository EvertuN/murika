import { BASE_URL, api, requestEnvelope } from '@/shared/services/api'

export type EstoqueTipoMovimentacao = 'entrada' | 'saida'
export type EstoqueTipoConsumo = 'CONSUMO_HOSPEDE' | 'OUTRO_CONSUMO' | 'DESCARTE'

export type EstoqueResumo = {
  entradas_hoje: number
  saidas_hoje: number
  total_itens: number
}

export type EstoqueItemSaldo = {
  id_item: number | string
  nome: string
  nome_categoria?: string | null
  quantidade_atual: number | string
  quantidade_minima: number | string
  status: string
  preco_venda?: number | string
}

export type EstoqueItemOption = {
  id_item: number | string
  nome: string
  preco_venda?: number | string
  nome_categoria?: string | null
}

export type HistoricoMovimentacao = {
  id_movimentacao: number | string
  tipo: EstoqueTipoMovimentacao
  quantidade: number | string
  quantidade_corrigida?: number | string | null
  quantidade_efetiva?: number | string | null
  corrigida?: number | string | null
  motivo_correcao?: string | null
  corrigida_em?: string | null
  corrigida_por_nome?: string | null
  quantidade_anterior?: number | string
  quantidade_posterior?: number | string
  observacao?: string | null
  responsavel?: string | null
  data_formatada: string
  data_movimentacao?: string
  nome_item: string
  tipo_consumo?: EstoqueTipoConsumo | null
  id_reserva?: number | string | null
  valor_sugerido?: number | string | null
  valor_unitario?: number | string | null
  valor_total?: number | string | null
  valor_sobrescrito?: number | string | null
  justificativa_valor?: string | null
  responsavel_consumo?: string | null
  codigo_autorizacao?: string | null
  is_prazo?: number | string | null
  status_pagamento?: string | null
  nome_forma_pagamento?: string | null
  codigo_reserva?: string | null
  cliente_nome?: string | null
}

export type ReservaConsumoOption = {
  id_reserva: number
  codigo_reserva?: string | null
  data_checkin?: string | null
  data_checkout?: string | null
  quarto_numero?: string | null
  cliente_nome?: string | null
  empresa_razao?: string | null
  status?: string | null
  has_pagamento_prazo?: number | string | null
}

export type HistoricoPaginacao = {
  pagina_atual: number
  total_paginas: number
  total_registros: number
}

export const estoqueMovimentacaoService = {
  obterResumo(): Promise<EstoqueResumo> {
    return api.get<EstoqueResumo>('/movimentacao', { acao: 'resumo' })
  },

  listarEstoque(): Promise<EstoqueItemSaldo[]> {
    return api.get<EstoqueItemSaldo[]>('/movimentacao', { acao: 'listar_estoque' })
  },

  async listarHistorico(params?: {
    data?: string
    pagina?: number
    limite?: number
  }): Promise<{ data: HistoricoMovimentacao[]; paginacao: HistoricoPaginacao | null }> {
    const query = new URLSearchParams({
      acao: 'listar_historico',
      pagina: String(params?.pagina ?? 1),
      limite: String(params?.limite ?? 10)
    })
    if (params?.data) query.set('data', params.data)

    const payload = await requestEnvelope<HistoricoMovimentacao[]>(`${BASE_URL}/movimentacao?${query}`)
    const raw = payload.paginacao as Partial<HistoricoPaginacao> | undefined
    return {
      data: payload.data || [],
      paginacao: raw
        ? {
            pagina_atual: Number(raw.pagina_atual || 1),
            total_paginas: Number(raw.total_paginas || 1),
            total_registros: Number(raw.total_registros || 0)
          }
        : null
    }
  },

  listarItens(): Promise<EstoqueItemOption[]> {
    return api.get<EstoqueItemOption[]>('/movimentacao', { acao: 'listar_itens_por_local' })
  },

  async registrarMovimentacao(payload: {
    tipo: EstoqueTipoMovimentacao
    id_item: number
    quantidade: number
    observacao?: string
    tipo_consumo?: EstoqueTipoConsumo | ''
    id_reserva?: number | string
    responsavel_consumo?: string
    valor_unitario?: number | string
    justificativa_valor?: string
    id_forma_pagamento?: number | string
    codigo_autorizacao?: string
    is_prazo?: number | string
    registrar_sem_pagamento?: number | string
    cobrar_na_reserva?: number | string
  }): Promise<void> {
    await api.post<void>('/movimentacao', {
      acao: 'registrar',
      ...payload,
      observacao: payload.observacao || '',
      tipo_consumo: payload.tipo_consumo || '',
      id_reserva: payload.id_reserva || '',
      responsavel_consumo: payload.responsavel_consumo || '',
      valor_unitario: payload.valor_unitario ?? '',
      justificativa_valor: payload.justificativa_valor || '',
      id_forma_pagamento: payload.id_forma_pagamento || '',
      codigo_autorizacao: payload.codigo_autorizacao || '',
      is_prazo: payload.is_prazo || 0,
      registrar_sem_pagamento: payload.registrar_sem_pagamento || 0,
      cobrar_na_reserva: payload.cobrar_na_reserva || 0
    })
  },

  async corrigirMovimentacao(payload: {
    id_movimentacao: number | string
    quantidade_corrigida: number
    motivo: string
  }): Promise<void> {
    await api.post<void>('/movimentacao', { acao: 'corrigir_movimentacao', ...payload })
  },

  listarReservasParaConsumo(): Promise<ReservaConsumoOption[]> {
    return api.get<ReservaConsumoOption[]>('/hospedagem_reserva', { acao: 'listar_reservas_consumo' })
  },

  buildRelatorioUrl(params: { data_inicio: string; data_fim: string; hora_inicio?: string; hora_fim?: string }): string {
    const query = new URLSearchParams({ data_inicio: params.data_inicio, data_fim: params.data_fim })
    if (params.hora_inicio) query.set('hora_inicio', params.hora_inicio)
    if (params.hora_fim) query.set('hora_fim', params.hora_fim)
    return `${BASE_URL}/relatorio?${query}`
  }
}

export default estoqueMovimentacaoService
