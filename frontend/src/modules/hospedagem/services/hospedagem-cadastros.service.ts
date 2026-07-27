import { api } from '@/shared/services/api'

export type TipoQuarto = {
  tipo: string
  preco_padrao: number
  preco_2_pessoas: number
  quantidade_quartos: number
}

export type QuartoCadastro = {
  id_quarto: number
  numero: string
  tipo: string
  preco_padrao: number
  preco_2_pessoas: number
  quantidade_reservas: number
}

export type FormaPagamentoCadastro = {
  id_forma_pagamento: number
  nome_forma_pagamento: string
  quantidade_usos: number
}

export type HospedagemCadastrosData = {
  tiposQuarto: TipoQuarto[]
  quartos: QuartoCadastro[]
  formasPagamento: FormaPagamentoCadastro[]
}

export const hospedagemCadastrosService = {
  listar(): Promise<HospedagemCadastrosData> {
    return api.get<HospedagemCadastrosData>('/hospedagem_cadastros', { acao: 'listar' })
  },

  salvarTipoQuarto(input: {
    tipoOriginal?: string
    tipo: string
    precoPadrao: string
    precoDuasPessoas: string
  }): Promise<unknown> {
    return api.post('/hospedagem_cadastros', {
      acao: 'salvar_tipo_quarto',
      tipo_original: input.tipoOriginal,
      tipo: input.tipo,
      preco_padrao: input.precoPadrao,
      preco_2_pessoas: input.precoDuasPessoas
    })
  },

  excluirTipoQuarto(tipo: string): Promise<unknown> {
    return api.post('/hospedagem_cadastros', { acao: 'excluir_tipo_quarto', tipo })
  },

  salvarQuarto(input: { id?: number; numero: string; tipo: string }): Promise<unknown> {
    return api.post('/hospedagem_cadastros', {
      acao: 'salvar_quarto',
      id_quarto: input.id,
      numero: input.numero,
      tipo: input.tipo
    })
  },

  excluirQuarto(id: number): Promise<unknown> {
    return api.post('/hospedagem_cadastros', { acao: 'excluir_quarto', id_quarto: id })
  },

  salvarFormaPagamento(input: { id?: number; nome: string }): Promise<unknown> {
    return api.post('/hospedagem_cadastros', {
      acao: 'salvar_forma_pagamento',
      id_forma_pagamento: input.id,
      nome_forma_pagamento: input.nome
    })
  },

  excluirFormaPagamento(id: number): Promise<unknown> {
    return api.post('/hospedagem_cadastros', { acao: 'excluir_forma_pagamento', id_forma_pagamento: id })
  }
}
