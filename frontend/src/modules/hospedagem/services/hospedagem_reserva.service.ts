import { api } from '@/shared/services/api'

export type Reserva = {
  id_reserva: number
  codigo_reserva?: string | null
  id_quarto: number
  id_cliente?: number | null
  id_empresa?: number | null
  origem: string
  data_checkin: string
  data_checkout?: string | null
  quantidade_diarias?: number | null
  valor_estadia?: number | null
  status: string
  sem_pagamento?: number | null
  pagamentos_count?: number | null
  observacao?: string | null
  quarto_numero?: string | null
  cliente_nome?: string | null
  empresa_razao?: string | null
  usuario_criacao_nome?: string | null
}

export type Pagamento = {
  id_pagamento: number
  id_forma_pagamento?: number | null
  nome_forma_pagamento?: string | null
  valor: number
  data_pagamento: string
  codigo_autorizacao?: string | null
  numero_nf?: string | null
  is_prazo?: number | null
  observacao?: string | null
  usuario_criacao_nome?: string | null
}

export type ReservaConsumo = {
  id_consumo: number
  tipo_consumo: string
  status_pagamento?: 'PAGO' | 'COBRADO_RESERVA' | 'PENDENTE' | 'A_PRAZO' | string | null
  id_reserva?: number | null
  id_item: number
  id_movimentacao?: number | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  valor_sugerido?: number | null
  valor_sobrescrito?: number | null
  justificativa_valor?: string | null
  id_forma_pagamento?: number | null
  nome_forma_pagamento?: string | null
  codigo_autorizacao?: string | null
  is_prazo?: number | null
  data_pagamento?: string | null
  observacao?: string | null
  created_at?: string | null
  data_formatada?: string | null
  nome_item?: string | null
  usuario_criacao_nome?: string | null
}

export type Quarto = {
  id_quarto: number
  numero: string
  tipo?: string | null
  status?: string | null
  preco_padrao?: number | string | null
  preco_2_pessoas?: number | string | null
}

export type Cliente = {
  id_cliente: number
  nome: string
  documento?: string | null
  telefone?: string | null
}

export type Empresa = {
  id_empresa: number
  razao_social: string
  cnpj?: string | null
  telefone?: string | null
}

export type FormaPagamento = {
  id_forma_pagamento: number
  nome_forma_pagamento: string
}

export type ReservaListResponse = {
  data: Reserva[]
  pagination: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
  alertas?: ReservaAlertas
}

export type ReservaAlertas = {
  abertas_sem_pagamento: number
  irao_fechar_sem_pagamento: number
  fechadas_sem_pagamento?: number
  consumos_pendentes_pagamento?: number
  fechadas_automaticamente?: number
}

export type ReservaTimelineItem = {
  id: number
  created_at?: string | null
  action: string
  entity: string
  target_id?: string | null
  user_name?: string | null
  ip?: string | null
  details?: Record<string, unknown> | null
}

type ServicePayload = Record<string, string | number | boolean | null | undefined>

export const hospedagemReservaService = {
  async listarReservas(params: ServicePayload = {}): Promise<ReservaListResponse> {
    return api.get<ReservaListResponse>('/hospedagem_reserva', { acao: 'listar', ...params })
  },

  async criarReserva(payload: ServicePayload): Promise<{ id_reserva: number }> {
    return api.post('/hospedagem_reserva', { acao: 'cadastrar', ...payload })
  },

  async atualizarStatusReserva(
    id_reserva: number,
    status: string,
    justificativa_admin = ''
  ): Promise<void> {
    await api.post('/hospedagem_reserva', {
      acao: 'atualizar_status',
      id_reserva,
      status,
      justificativa_admin
    })
  },

  async atualizarCheckoutReserva(id_reserva: number, data_checkout: string, motivo = ''): Promise<{ aumento_dias: number }> {
    return api.post('/hospedagem_reserva', {
      acao: 'atualizar_checkout',
      id_reserva,
      data_checkout,
      motivo
    })
  },

  async atualizarValorEstadia(id_reserva: number, valor_estadia: string, motivo: string): Promise<void> {
    await api.post('/hospedagem_reserva', { acao: 'atualizar_valor_estadia', id_reserva, valor_estadia, motivo })
  },

  async listarPagamentos(id_reserva: number): Promise<Pagamento[]> {
    return api.get<Pagamento[]>('/hospedagem_reserva', { acao: 'listar_pagamentos', id_reserva })
  },

  async adicionarPagamento(payload: ServicePayload): Promise<{ id_pagamento: number }> {
    return api.post('/hospedagem_reserva', { acao: 'adicionar_pagamento', ...payload })
  },

  async deletarPagamento(id_pagamento: number): Promise<void> {
    await api.post('/hospedagem_reserva', { acao: 'deletar_pagamento', id_pagamento })
  },

  async listarConsumos(id_reserva: number): Promise<ReservaConsumo[]> {
    return api.get<ReservaConsumo[]>('/hospedagem_reserva', { acao: 'listar_consumos', id_reserva })
  },

  async adicionarConsumo(payload: ServicePayload): Promise<{ id_consumo: number; id_movimentacao: number; valor_unitario: number; valor_total: number }> {
    return api.post('/hospedagem_reserva', { acao: 'adicionar_consumo', ...payload })
  },

  async quitarConsumo(payload: ServicePayload): Promise<{ id_consumo: number; status_pagamento: string }> {
    return api.post('/hospedagem_reserva', { acao: 'quitar_consumo', ...payload })
  },

  async deletarConsumo(id_consumo: number, motivo: string): Promise<void> {
    await api.post('/hospedagem_reserva', { acao: 'deletar_consumo', id_consumo, motivo })
  },

  async listarFormasPagamento(): Promise<FormaPagamento[]> {
    return api.get<FormaPagamento[]>('/hospedagem_reserva', { acao: 'listar_formas_pagamento' })
  },

  async listarQuartos(): Promise<Quarto[]> {
    return api.get<Quarto[]>('/hospedagem_reserva', { acao: 'listar_quartos' })
  },

  async listarClientes(): Promise<Cliente[]> {
    return api.get<Cliente[]>('/hospedagem_reserva', { acao: 'listar_clientes' })
  },

  async listarEmpresas(): Promise<Empresa[]> {
    return api.get<Empresa[]>('/hospedagem_reserva', { acao: 'listar_empresas' })
  },

  async listarTimeline(id_reserva: number): Promise<ReservaTimelineItem[]> {
    return api.get<ReservaTimelineItem[]>('/hospedagem_reserva', { acao: 'listar_timeline', id_reserva })
  },

  async deletarReserva(id_reserva: number): Promise<void> {
    await api.post('/hospedagem_reserva', { acao: 'deletar', id_reserva })
  },
}

export default hospedagemReservaService
