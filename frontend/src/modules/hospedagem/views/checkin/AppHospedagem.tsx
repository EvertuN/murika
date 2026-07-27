'use client'

import './AppHospedagem.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  hospedagemReservaService,
  type Cliente,
  type Empresa,
  type FormaPagamento,
  type Pagamento,
  type Quarto,
  type Reserva,
  type ReservaAlertas,
  type ReservaConsumo,
  type ReservaTimelineItem
} from '@/modules/hospedagem/services/hospedagem_reserva.service'
import estoqueMovimentacaoService from '@/modules/estoque/services/estoque-movimentacao.service'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import { refreshInputMasks } from '@/shared/services/input-mask.service'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import clienteService from '@/modules/hospedagem/services/cliente.service'
import empresaService from '@/modules/hospedagem/services/empresa.service'
import DeletePaymentModal from './DeletePaymentModal'
import DeleteConsumptionModal from './DeleteConsumptionModal'
import QuitarConsumoModal, { type QuitarConsumoForm } from './QuitarConsumoModal'
import ClienteFormModal, { type ClienteForm } from '@/modules/hospedagem/views/clientes/ClienteFormModal'
import EmpresaFormModal, { type EmpresaForm } from '@/modules/hospedagem/views/empresas/EmpresaFormModal'
import { type PagamentoForm } from './PagamentoFormView'
import { type ConsumoForm } from './ConsumoFormView'
import ReservaDetailView from './ReservaDetailView'
import ReservaExtendModal from './ReservaExtendModal'
import ReservaFormView, { type ReservaForm } from './ReservaFormView'
import ReservaListView from './ReservaListView'
import ReservaStatusModal from './ReservaStatusModal'
import ReservaTimelineModal from './ReservaTimelineModal'
import { formatMoneyInput, parseMoneyToDecimal } from './checkin-utils'

type ViewMode = 'lista' | 'nova' | 'detalhe'

const EMPTY_RESERVA_FORM: ReservaForm = {
  id_quarto: '',
  id_cliente: '',
  id_empresa: '',
  origem: 'BALCAO',
  data_checkin: '',
  data_checkout: '',
  valor_estadia: '',
  diarias: [],
  sem_pagamento_inicial: false,
  observacao: ''
}

const createPagamentoForm = (): PagamentoForm => ({
  id_forma_pagamento: '',
  valor: '',
  data_pagamento: new Date().toISOString().slice(0, 10),
  codigo_autorizacao: '',
  numero_nf: '',
  is_prazo: false,
  observacao: ''
})

const createConsumoForm = (): ConsumoForm => ({
  id_item: '',
  quantidade: '',
  valor_unitario: '',
  justificativa_valor: '',
  forma_cobranca: 'PAGAR_AGORA',
  id_forma_pagamento: '',
  codigo_autorizacao: '',
  is_prazo: false,
  observacao: ''
})

const createQuitarConsumoForm = (): QuitarConsumoForm => ({
  forma_quitacao: 'PAGAR_AGORA',
  id_forma_pagamento: '',
  codigo_autorizacao: '',
  observacao: ''
})

const createClienteForm = (): ClienteForm => ({
  nome: '',
  email: '',
  telefone: '',
  tipo_documento: 'CPF',
  documento: ''
})

const createEmpresaForm = (): EmpresaForm => ({
  razao_social: '',
  cnpj: '',
  telefone: '',
  email: ''
})

const sortQuartosCrescente = (quartos: Quarto[]): Quarto[] => (
  [...quartos].sort((a, b) => String(a.numero).localeCompare(String(b.numero), 'pt-BR', { numeric: true }))
)

const formatLocalDateInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (value: Date, days: number): Date => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

const addYears = (value: Date, years: number): Date => {
  const date = new Date(value)
  date.setFullYear(date.getFullYear() + years)
  return date
}

const formatDateInputBr = (value: string): string => {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

const addDaysToDateInput = (value: string, days: number): string => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return ''

  return formatLocalDateInput(addDays(new Date(year, month - 1, day), days))
}

export default function AppHospedagem() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [consumos, setConsumos] = useState<ReservaConsumo[]>([])
  const [selectedReservaId, setSelectedReservaId] = useState<number | null>(null)
  const [statusModalReserva, setStatusModalReserva] = useState<Reserva | null>(null)
  const [novoStatus, setNovoStatus] = useState('ABERTA')
  const [actionsOpenId, setActionsOpenId] = useState<number | null>(null)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [timeline, setTimeline] = useState<ReservaTimelineItem[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [extendCheckout, setExtendCheckout] = useState('')
  const [extendMotivo, setExtendMotivo] = useState('')
  const [valorEstadiaModalOpen, setValorEstadiaModalOpen] = useState(false)
  const [novoValorEstadia, setNovoValorEstadia] = useState('')
  const [motivoValorEstadia, setMotivoValorEstadia] = useState('')
  const [valorEstadiaSalvando, setValorEstadiaSalvando] = useState(false)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Pagamento | null>(null)
  const [deleteConsumptionTarget, setDeleteConsumptionTarget] = useState<ReservaConsumo | null>(null)
  const [deleteConsumptionReason, setDeleteConsumptionReason] = useState('')
  const [quitarConsumoTarget, setQuitarConsumoTarget] = useState<ReservaConsumo | null>(null)
  const [quitarConsumoForm, setQuitarConsumoForm] = useState<QuitarConsumoForm>(createQuitarConsumoForm)
  const [quitarConsumoTentouEnviar, setQuitarConsumoTentouEnviar] = useState(false)
  const [quitarConsumoSalvando, setQuitarConsumoSalvando] = useState(false)
  const [clienteModalOpen, setClienteModalOpen] = useState(false)
  const [clienteForm, setClienteForm] = useState<ClienteForm>(createClienteForm)
  const [clienteFormError, setClienteFormError] = useState('')
  const [empresaModalOpen, setEmpresaModalOpen] = useState(false)
  const [empresaForm, setEmpresaForm] = useState<EmpresaForm>(createEmpresaForm)
  const [empresaFormError, setEmpresaFormError] = useState('')

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reservaAlertas, setReservaAlertas] = useState<ReservaAlertas | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroCodigo, setFiltroCodigo] = useState('')
  const [filtroClienteEmpresa, setFiltroClienteEmpresa] = useState('')
  const [filtroSemPagamento, setFiltroSemPagamento] = useState('')

  const [view, setView] = useState<ViewMode>('lista')
  const [mostrarPagamentoForm, setMostrarPagamentoForm] = useState(false)
  const [mostrarConsumoForm, setMostrarConsumoForm] = useState(false)
  const [reservaTentouEnviar, setReservaTentouEnviar] = useState(false)
  const [pagamentoTentouEnviar, setPagamentoTentouEnviar] = useState(false)
  const [reservaForm, setReservaForm] = useState<ReservaForm>(EMPTY_RESERVA_FORM)
  const [clienteBusca, setClienteBusca] = useState('')
  const [empresaBusca, setEmpresaBusca] = useState('')
  const [clienteBuscaAberta, setClienteBuscaAberta] = useState(false)
  const [empresaBuscaAberta, setEmpresaBuscaAberta] = useState(false)
  const clienteBuscaRef = useRef<HTMLDivElement | null>(null)
  const empresaBuscaRef = useRef<HTMLDivElement | null>(null)
  const [pagamentoForm, setPagamentoForm] = useState<PagamentoForm>(createPagamentoForm)
  const [consumoForm, setConsumoForm] = useState<ConsumoForm>(createConsumoForm)
  const [consumoItens, setConsumoItens] = useState<Array<{ id_item: number | string; nome: string; preco_venda?: number | string }>>([])
  const [consumoTentouEnviar, setConsumoTentouEnviar] = useState(false)
  const [consumoSalvando, setConsumoSalvando] = useState(false)

  const { isAdmin, permissions } = useAuth()
  const minCheckinInput = useMemo(() => formatLocalDateInput(addDays(new Date(), -30)), [])
  const maxCheckoutInput = useMemo(() => formatLocalDateInput(addYears(new Date(), 1)), [])

  const loadReservas = useCallback(async (nextPage = 1) => {
    setLoading(true)
    setErro('')
    try {
      const response = await hospedagemReservaService.listarReservas({
        page: nextPage,
        per_page: 20,
        status: filtroStatus,
        origem: filtroOrigem,
        data_inicio: filtroDataInicio,
        data_fim: filtroDataFim,
        codigo: filtroCodigo,
        cliente_empresa: filtroClienteEmpresa,
        sem_pagamento: filtroSemPagamento
      })
      setReservas(response.data || [])
      setPage(response.pagination?.page || 1)
      setTotalPages(response.pagination?.total_pages || 1)
      setReservaAlertas(response.alertas || null)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar reservas.')
    } finally {
      setLoading(false)
    }
  }, [filtroClienteEmpresa, filtroCodigo, filtroDataFim, filtroDataInicio, filtroOrigem, filtroSemPagamento, filtroStatus])

  const loadBase = useCallback(async () => {
    const [quartosData, clientesData, empresasData, formasData] = await Promise.all([
      hospedagemReservaService.listarQuartos(),
      hospedagemReservaService.listarClientes(),
      hospedagemReservaService.listarEmpresas(),
      hospedagemReservaService.listarFormasPagamento()
    ])
    setQuartos(sortQuartosCrescente(quartosData))
    setClientes(clientesData)
    setEmpresas(empresasData)
    setFormasPagamento(formasData)
  }, [])

  useEffect(() => {
    void Promise.all([loadBase(), loadReservas(1)])
  }, [loadBase, loadReservas])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (clienteBuscaRef.current && !clienteBuscaRef.current.contains(target)) setClienteBuscaAberta(false)
      if (empresaBuscaRef.current && !empresaBuscaRef.current.contains(target)) setEmpresaBuscaAberta(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedReserva = useMemo(
    () => reservas.find((entry) => entry.id_reserva === selectedReservaId) || null,
    [reservas, selectedReservaId]
  )

  const clientesFiltrados = useMemo(() => {
    const termo = clienteBusca.trim().toLowerCase()
    if (!termo) return clientes.slice(0, 10)
    return clientes.filter((cliente) => cliente.nome.toLowerCase().includes(termo) || String(cliente.documento || '').toLowerCase().includes(termo))
  }, [clienteBusca, clientes])

  const empresasFiltradas = useMemo(() => {
    const termo = empresaBusca.trim().toLowerCase()
    if (!termo) return empresas.slice(0, 10)
    return empresas.filter((empresa) => empresa.razao_social.toLowerCase().includes(termo) || String(empresa.cnpj || '').toLowerCase().includes(termo))
  }, [empresaBusca, empresas])

  const formaPagamentoSelecionada = useMemo(
    () => formasPagamento.find((forma) => String(forma.id_forma_pagamento) === pagamentoForm.id_forma_pagamento) || null,
    [formasPagamento, pagamentoForm.id_forma_pagamento]
  )

  const formaPagamentoNome = (formaPagamentoSelecionada?.nome_forma_pagamento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const exigeCodigoPagamento = formaPagamentoNome.includes('CREDITO') || formaPagamentoNome.includes('DEBITO') || formaPagamentoNome.includes('PIX')
  const codigoPagamentoPlaceholder = formaPagamentoNome.includes('PIX') ? 'ID/Transação' : 'Código AUT'
  const reservaErrors = [
    !reservaForm.id_cliente ? 'Selecione o cliente.' : '',
    !reservaForm.data_checkin ? 'Informe a data de check-in.' : '',
    !reservaForm.data_checkout ? 'Informe a data de check-out.' : '',
    !isAdmin && reservaForm.data_checkin && reservaForm.data_checkin < minCheckinInput
      ? `Check-in deve ser no máximo 30 dias antes de hoje (${formatDateInputBr(minCheckinInput)}).`
      : '',
    !isAdmin && reservaForm.data_checkout && reservaForm.data_checkout > maxCheckoutInput
      ? `Checkout deve ser no máximo 1 ano à frente (${formatDateInputBr(maxCheckoutInput)}).`
      : '',
    reservaForm.data_checkin && reservaForm.data_checkout && reservaForm.data_checkout <= reservaForm.data_checkin
      ? 'Checkout deve ser pelo menos 1 dia posterior ao check-in.' : '',
    reservaForm.diarias.length === 0 ? 'Informe o período da reserva.' : '',
    reservaForm.diarias.some((diaria) => !parseMoneyToDecimal(diaria.valor)) ? 'Informe um valor válido para todas as diárias.' : '',
    !parseMoneyToDecimal(reservaForm.valor_estadia) ? 'O total da reserva deve ser maior que zero.' : ''
  ].filter(Boolean)
  const pagamentoErrors = [
    !parseMoneyToDecimal(pagamentoForm.valor) ? 'Informe o valor total da hospedagem.' : '',
    !pagamentoForm.is_prazo && !pagamentoForm.id_forma_pagamento ? 'Selecione a forma de pagamento.' : '',
    !pagamentoForm.is_prazo && exigeCodigoPagamento && !pagamentoForm.codigo_autorizacao.trim() ? `Informe ${codigoPagamentoPlaceholder}.` : '',
    pagamentoForm.codigo_autorizacao.trim().length > 6 ? 'Código deve ter no máximo 6 caracteres.' : ''
  ].filter(Boolean)

  const consumoFormaSelecionada = formasPagamento.find((forma) => String(forma.id_forma_pagamento) === consumoForm.id_forma_pagamento) || null
  const consumoFormaNome = (consumoFormaSelecionada?.nome_forma_pagamento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const consumoExigeCodigo = consumoFormaNome.includes('CREDITO') || consumoFormaNome.includes('DEBITO') || consumoFormaNome.includes('PIX')
  const reservaTemPagamentoPrazo = pagamentos.some((pagamento) => Number(pagamento.is_prazo || 0) === 1)
  const consumoPagamentoCorporativo = reservaTemPagamentoPrazo && consumoForm.is_prazo
  const consumoPagarAgora = consumoForm.forma_cobranca === 'PAGAR_AGORA' && !consumoPagamentoCorporativo
  const consumoItemSelecionado = consumoItens.find((item) => String(item.id_item) === consumoForm.id_item)
  const consumoValorSugerido = Number(consumoItemSelecionado?.preco_venda || 0)
  const consumoValorAplicado = consumoForm.valor_unitario === '' ? consumoValorSugerido : Number(consumoForm.valor_unitario)
  const consumoValorAlterado = Math.abs(consumoValorAplicado - consumoValorSugerido) >= 0.005
  const consumoErrors = [
    !consumoForm.id_item ? 'Selecione o item.' : '',
    Number(consumoForm.quantidade) <= 0 ? 'Informe uma quantidade maior que zero.' : '',
    !Number.isFinite(consumoValorAplicado) || consumoValorAplicado < 0 ? 'Informe um valor unitário válido.' : '',
    consumoValorAlterado && !isAdmin ? 'Somente administradores podem alterar o valor do consumo.' : '',
    consumoValorAlterado && !consumoForm.justificativa_valor.trim() ? 'Justifique a alteração do valor.' : '',
    consumoPagarAgora && !consumoForm.id_forma_pagamento ? 'Selecione a forma de pagamento.' : '',
    consumoPagarAgora && consumoExigeCodigo && !consumoForm.codigo_autorizacao.trim() ? 'Informe o código para esta forma.' : '',
    consumoForm.codigo_autorizacao.trim().length > 6 ? 'Código deve ter no máximo 6 caracteres.' : ''
  ].filter(Boolean)

  const quitarConsumoFormaSelecionada = formasPagamento.find((forma) => String(forma.id_forma_pagamento) === quitarConsumoForm.id_forma_pagamento) || null
  const quitarConsumoFormaNome = (quitarConsumoFormaSelecionada?.nome_forma_pagamento || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const quitarConsumoExigeCodigo = quitarConsumoFormaNome.includes('CREDITO') || quitarConsumoFormaNome.includes('DEBITO') || quitarConsumoFormaNome.includes('PIX')
  const quitarConsumoErrors = [
    quitarConsumoForm.forma_quitacao === 'PAGAR_AGORA' && !quitarConsumoForm.id_forma_pagamento ? 'Selecione a forma de pagamento.' : '',
    quitarConsumoForm.forma_quitacao === 'PAGAR_AGORA' && quitarConsumoExigeCodigo && !quitarConsumoForm.codigo_autorizacao.trim() ? 'Informe o código para esta forma.' : '',
    quitarConsumoForm.codigo_autorizacao.trim().length > 6 ? 'Código deve ter no máximo 6 caracteres.' : ''
  ].filter(Boolean)

  const resetReservaForm = () => {
    setReservaForm(EMPTY_RESERVA_FORM)
    setClienteBusca('')
    setEmpresaBusca('')
    setClienteBuscaAberta(false)
    setEmpresaBuscaAberta(false)
    setReservaTentouEnviar(false)
  }

  const abrirClienteModal = () => {
    setClienteForm(createClienteForm())
    setClienteFormError('')
    setClienteBuscaAberta(false)
    setClienteModalOpen(true)
  }

  const abrirEmpresaModal = () => {
    setEmpresaForm(createEmpresaForm())
    setEmpresaFormError('')
    setEmpresaBuscaAberta(false)
    setEmpresaModalOpen(true)
  }

  useEffect(() => {
    if (clienteModalOpen || empresaModalOpen) {
      window.requestAnimationFrame(() => refreshInputMasks())
    }
  }, [clienteModalOpen, empresaModalOpen])

  const cadastrarClienteRapido = async () => {
    if (!clienteForm.nome.trim()) {
      setClienteFormError('Informe o nome do cliente.')
      return
    }
    if (!clienteForm.documento.trim()) {
      setClienteFormError('Informe o documento do cliente.')
      return
    }

    setClienteFormError('')
    try {
      const result = await clienteService.cadastrar({
        nome: clienteForm.nome.trim().toUpperCase(),
        email: clienteForm.email.trim(),
        telefone: clienteForm.telefone.trim(),
        tipo_documento: clienteForm.tipo_documento,
        documento: clienteForm.documento.trim()
      })
      const clientesAtualizados = await hospedagemReservaService.listarClientes()
      const novoId = Number(result.id)
      const novoCliente = clientesAtualizados.find((cliente) => Number(cliente.id_cliente) === novoId)

      setClientes(clientesAtualizados)
      if (novoCliente) {
        setReservaForm((current) => ({ ...current, id_cliente: String(novoCliente.id_cliente) }))
        setClienteBusca(`${novoCliente.nome} - ${novoCliente.documento || ''}`.trim())
      }
      emitEntityUpdated({ endpoint: '/cliente' })
      setClienteModalOpen(false)
      setClienteForm(createClienteForm())
    } catch (error) {
      setClienteFormError(error instanceof Error ? error.message : 'Erro ao salvar cliente.')
    }
  }

  const cadastrarEmpresaRapida = async () => {
    if (!empresaForm.cnpj.trim()) {
      setEmpresaFormError('Informe o CNPJ da empresa.')
      return
    }

    setEmpresaFormError('')
    try {
      const result = await empresaService.cadastrar({
        razao_social: empresaForm.razao_social.trim().toUpperCase(),
        cnpj: empresaForm.cnpj.trim(),
        telefone: empresaForm.telefone.trim(),
        email: empresaForm.email.trim()
      })
      const empresasAtualizadas = await hospedagemReservaService.listarEmpresas()
      const novoId = Number(result.id)
      const novaEmpresa = empresasAtualizadas.find((empresa) => Number(empresa.id_empresa) === novoId)

      setEmpresas(empresasAtualizadas)
      if (novaEmpresa) {
        setReservaForm((current) => ({ ...current, id_empresa: String(novaEmpresa.id_empresa) }))
        setEmpresaBusca(`${novaEmpresa.razao_social} - ${novaEmpresa.cnpj || ''}`.trim())
      }
      emitEntityUpdated({ endpoint: '/empresa' })
      setEmpresaModalOpen(false)
      setEmpresaForm(createEmpresaForm())
    } catch (error) {
      setEmpresaFormError(error instanceof Error ? error.message : 'Erro ao salvar empresa.')
    }
  }

  const resetPagamentoForm = () => {
    setPagamentoForm(createPagamentoForm())
    setPagamentoTentouEnviar(false)
  }

  const resetConsumoForm = () => {
    setConsumoForm(createConsumoForm())
    setConsumoTentouEnviar(false)
    setConsumoItens([])
  }

  const abrirConsumoForm = async () => {
    resetPagamentoForm()
    setMostrarPagamentoForm(false)
    setConsumoItens(await estoqueMovimentacaoService.listarItens())
    setMostrarConsumoForm(true)
  }

  const voltarLista = () => {
    setView('lista')
    setSelectedReservaId(null)
    setPagamentos([])
    setConsumos([])
    setMostrarPagamentoForm(false)
    setMostrarConsumoForm(false)
    setActionsOpenId(null)
    resetConsumoForm()
  }

  const abrirStatusModal = (reserva: Reserva) => {
    setActionsOpenId(null)
    setStatusModalReserva(reserva)
    setNovoStatus(String(reserva.status || 'ABERTA').toUpperCase())
    setErro('')
  }

  const abrirTimelineModal = async (reserva: Reserva) => {
    setErro('')
    setTimelineModalOpen(true)
    setTimelineLoading(true)
    try {
      setTimeline(await hospedagemReservaService.listarTimeline(reserva.id_reserva))
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar histórico da reserva.')
      setTimeline([])
    } finally {
      setTimelineLoading(false)
    }
  }

  const abrirExtendModal = (reserva: Reserva) => {
    setErro('')
    setExtendCheckout(reserva.data_checkout ? reserva.data_checkout.split(' ')[0] : '')
    setExtendMotivo('')
    setExtendModalOpen(true)
  }

  const abrirValorEstadiaModal = (reserva: Reserva) => {
    setNovoValorEstadia(formatMoneyInput(String(Math.round(Number(reserva.valor_estadia || 0) * 100))))
    setMotivoValorEstadia('')
    setErro('')
    setValorEstadiaModalOpen(true)
  }

  const openDetalheReserva = async (idReserva: number, forcePaymentForm = false) => {
    setErro('')
    try {
      setActionsOpenId(null)
      setSelectedReservaId(idReserva)
      const [pagamentosData, consumosData] = await Promise.all([
        hospedagemReservaService.listarPagamentos(idReserva),
        hospedagemReservaService.listarConsumos(idReserva)
      ])
      const reservaAtual = reservas.find((entry) => entry.id_reserva === idReserva)
      const pagamentoBloqueado = reservaAtual?.status === 'FECHADA' && !isAdmin
      setPagamentos(pagamentosData)
      setConsumos(consumosData)
      setMostrarPagamentoForm(!pagamentoBloqueado && (forcePaymentForm || pagamentosData.length === 0))
      setMostrarConsumoForm(false)
      setView('detalhe')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar pagamentos.')
      setView('lista')
    }
  }

  const submitReserva = async () => {
    setReservaTentouEnviar(true)
    if (!reservaForm.id_quarto || !reservaForm.origem || reservaErrors.length > 0 || (!reservaForm.sem_pagamento_inicial && pagamentoErrors.length > 0)) return
    setErro('')
    try {
      await hospedagemReservaService.criarReserva({
        id_quarto: Number(reservaForm.id_quarto),
        id_cliente: Number(reservaForm.id_cliente),
        id_empresa: reservaForm.id_empresa ? Number(reservaForm.id_empresa) : '',
        origem: reservaForm.origem,
        data_checkin: reservaForm.data_checkin,
        data_checkout: reservaForm.data_checkout,
        valor_estadia: parseMoneyToDecimal(reservaForm.valor_estadia),
        diarias_valores: JSON.stringify(reservaForm.diarias.map((diaria) => ({
          data: diaria.data,
          valor: parseMoneyToDecimal(diaria.valor)
        }))),
        sem_pagamento_inicial: reservaForm.sem_pagamento_inicial ? 1 : 0,
        valor_pagamento_inicial: reservaForm.sem_pagamento_inicial ? '' : parseMoneyToDecimal(pagamentoForm.valor),
        data_pagamento_inicial: pagamentoForm.data_pagamento,
        pagamento_inicial_prazo: pagamentoForm.is_prazo ? 1 : 0,
        id_forma_pagamento_inicial: pagamentoForm.id_forma_pagamento,
        codigo_autorizacao_inicial: pagamentoForm.codigo_autorizacao.trim(),
        observacao_pagamento_inicial: pagamentoForm.observacao.trim(),
        observacao: reservaForm.observacao.trim()
      })
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      resetReservaForm()
      resetPagamentoForm()
      setView('lista')
      await loadReservas(1)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao cadastrar reserva.')
    }
  }

  const atualizarStatus = async (idReserva: number, status: string) => {
    setErro('')
    if (status === 'FECHADA' && statusModalReserva && !isAdmin && Number(statusModalReserva.sem_pagamento ?? 1) === 1 && Number(statusModalReserva.pagamentos_count ?? 0) === 0) {
      setErro('Somente admin pode fechar uma reserva sem pagamento.')
      return
    }
    if (status === 'FECHADA' && !isAdmin) {
      try {
        const consumosReserva = await hospedagemReservaService.listarConsumos(idReserva)
        const temConsumoPendente = consumosReserva.some((consumo) => String(consumo.status_pagamento || '').toUpperCase() === 'PENDENTE')
        if (temConsumoPendente) {
          setErro('Resolva os consumos pendentes antes de fechar a reserva.')
          return
        }
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro ao verificar consumos pendentes.')
        return
      }
    }
    try {
      await hospedagemReservaService.atualizarStatusReserva(idReserva, status)
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      setStatusModalReserva(null)
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar status.')
    }
  }

  const deletarReserva = async (idReserva: number) => {
    setErro('')
    try {
      await hospedagemReservaService.deletarReserva(idReserva)
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir reserva.')
    }
  }

  const submitPagamento = async () => {
    setPagamentoTentouEnviar(true)
    if (!selectedReservaId || pagamentoErrors.length > 0) return
    if (selectedReserva?.status === 'FECHADA' && !isAdmin) {
      setErro('Somente admin pode adicionar pagamento em uma reserva fechada.')
      return
    }
    setErro('')
    try {
      await hospedagemReservaService.adicionarPagamento({
        id_reserva: selectedReservaId,
        id_forma_pagamento: pagamentoForm.is_prazo ? '' : Number(pagamentoForm.id_forma_pagamento),
        valor: parseMoneyToDecimal(pagamentoForm.valor),
        data_pagamento: pagamentoForm.data_pagamento,
        codigo_autorizacao: pagamentoForm.is_prazo ? '' : pagamentoForm.codigo_autorizacao.trim(),
        numero_nf: '',
        is_prazo: pagamentoForm.is_prazo ? 1 : 0,
        observacao: pagamentoForm.observacao.trim()
      })
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      resetPagamentoForm()
      setMostrarPagamentoForm(false)
      setPagamentos(await hospedagemReservaService.listarPagamentos(selectedReservaId))
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao adicionar pagamento.')
    }
  }

  const submitConsumo = async () => {
    setConsumoTentouEnviar(true)
    if (!selectedReservaId || consumoErrors.length > 0) return

    setConsumoSalvando(true)
    setErro('')
    try {
      await hospedagemReservaService.adicionarConsumo({
        id_reserva: selectedReservaId,
        id_item: Number(consumoForm.id_item),
        quantidade: Number(consumoForm.quantidade),
        valor_unitario: consumoValorAplicado.toFixed(2),
        justificativa_valor: consumoValorAlterado ? consumoForm.justificativa_valor.trim() : '',
        cobrar_na_reserva: consumoForm.forma_cobranca === 'COBRAR_NA_RESERVA' && !consumoForm.is_prazo ? 1 : 0,
        registrar_sem_pagamento: consumoForm.forma_cobranca === 'REGISTRAR_SEM_PAGAMENTO' && !consumoForm.is_prazo ? 1 : 0,
        is_prazo: consumoForm.is_prazo ? 1 : 0,
        id_forma_pagamento: (consumoForm.forma_cobranca !== 'PAGAR_AGORA' || consumoForm.is_prazo) ? null : Number(consumoForm.id_forma_pagamento),
        codigo_autorizacao: (consumoForm.forma_cobranca !== 'PAGAR_AGORA' || consumoForm.is_prazo) ? '' : consumoForm.codigo_autorizacao.trim(),
        observacao: consumoForm.observacao.trim()
      })
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      emitEntityUpdated({ endpoint: '/movimentacao' })
      resetConsumoForm()
      setMostrarConsumoForm(false)
      setConsumos(await hospedagemReservaService.listarConsumos(selectedReservaId))
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao adicionar consumo.')
    } finally {
      setConsumoSalvando(false)
    }
  }

  const deletarPagamento = async (idPagamento: number) => {
    if (!selectedReservaId) return
    setErro('')
    try {
      await hospedagemReservaService.deletarPagamento(idPagamento)
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      const pagamentosAtualizados = await hospedagemReservaService.listarPagamentos(selectedReservaId)
      setPagamentos(pagamentosAtualizados)
      setMostrarPagamentoForm(pagamentosAtualizados.length === 0)
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir pagamento.')
    }
  }

  const confirmDeletePagamento = async () => {
    if (!deletePaymentTarget) return
    await deletarPagamento(deletePaymentTarget.id_pagamento)
    setDeletePaymentTarget(null)
  }

  const abrirDeleteConsumo = (consumo: ReservaConsumo) => {
    setDeleteConsumptionTarget(consumo)
    setDeleteConsumptionReason('')
  }

  const abrirQuitarConsumo = (consumo: ReservaConsumo) => {
    setQuitarConsumoTarget(consumo)
    setQuitarConsumoForm(createQuitarConsumoForm())
    setQuitarConsumoTentouEnviar(false)
  }

  const confirmarQuitarConsumo = async () => {
    setQuitarConsumoTentouEnviar(true)
    if (!quitarConsumoTarget || !selectedReservaId || quitarConsumoErrors.length > 0) return

    setQuitarConsumoSalvando(true)
    setErro('')
    try {
      await hospedagemReservaService.quitarConsumo({
        id_consumo: quitarConsumoTarget.id_consumo,
        forma_quitacao: quitarConsumoForm.forma_quitacao,
        id_forma_pagamento: quitarConsumoForm.forma_quitacao === 'PAGAR_AGORA' ? Number(quitarConsumoForm.id_forma_pagamento) : '',
        codigo_autorizacao: quitarConsumoForm.forma_quitacao === 'PAGAR_AGORA' ? quitarConsumoForm.codigo_autorizacao.trim() : '',
        observacao: quitarConsumoForm.observacao.trim()
      })
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      setQuitarConsumoTarget(null)
      setQuitarConsumoForm(createQuitarConsumoForm())
      setConsumos(await hospedagemReservaService.listarConsumos(selectedReservaId))
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao quitar consumo.')
    } finally {
      setQuitarConsumoSalvando(false)
    }
  }

  const confirmDeleteConsumo = async () => {
    if (!deleteConsumptionTarget || !selectedReservaId) return
    const motivo = deleteConsumptionReason.trim()
    if (!motivo) return
    setErro('')
    try {
      await hospedagemReservaService.deletarConsumo(deleteConsumptionTarget.id_consumo, motivo)
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      emitEntityUpdated({ endpoint: '/movimentacao' })
      setDeleteConsumptionTarget(null)
      setDeleteConsumptionReason('')
      setConsumos(await hospedagemReservaService.listarConsumos(selectedReservaId))
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir consumo.')
    }
  }

  const submitExtendCheckout = async () => {
    if (!selectedReservaId || !extendCheckout) return
    setErro('')
    try {
      await hospedagemReservaService.atualizarCheckoutReserva(selectedReservaId, extendCheckout, extendMotivo.trim())
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      setExtendModalOpen(false)
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao estender estadia.')
    }
  }

  const submitValorEstadia = async () => {
    if (!selectedReservaId) return
    const valor = parseMoneyToDecimal(novoValorEstadia)
    if (!valor || !motivoValorEstadia.trim()) {
      setErro('Informe o novo valor e o motivo da alteração.')
      return
    }
    setValorEstadiaSalvando(true)
    setErro('')
    try {
      await hospedagemReservaService.atualizarValorEstadia(selectedReservaId, valor, motivoValorEstadia.trim())
      emitEntityUpdated({ endpoint: '/hospedagem_reserva' })
      setValorEstadiaModalOpen(false)
      await loadReservas(page)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar o valor da estadia.')
    } finally {
      setValorEstadiaSalvando(false)
    }
  }

  const clearFilters = () => {
    setFiltroStatus('')
    setFiltroOrigem('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setFiltroCodigo('')
    setFiltroClienteEmpresa('')
    setFiltroSemPagamento('')
    void loadReservas(1)
  }

  return (
    <div className="AppHospedagem-view card">
      {erro ? <div className="alert alert-danger">{erro}</div> : null}

      {view === 'lista' ? (
        <ReservaListView
          reservas={reservas}
          loading={loading}
          isAdmin={isAdmin}
          canWrite={permissions.operationalWrite}
          page={page}
          totalPages={totalPages}
          alertas={reservaAlertas}
          actionsOpenId={actionsOpenId}
          filtroStatus={filtroStatus}
          filtroOrigem={filtroOrigem}
          filtroDataInicio={filtroDataInicio}
          filtroDataFim={filtroDataFim}
          filtroCodigo={filtroCodigo}
          filtroClienteEmpresa={filtroClienteEmpresa}
          filtroSemPagamento={filtroSemPagamento}
          onSetActionsOpenId={setActionsOpenId}
          onChangeFiltroStatus={setFiltroStatus}
          onChangeFiltroOrigem={setFiltroOrigem}
          onChangeFiltroDataInicio={setFiltroDataInicio}
          onChangeFiltroDataFim={setFiltroDataFim}
          onChangeFiltroCodigo={setFiltroCodigo}
          onChangeFiltroClienteEmpresa={setFiltroClienteEmpresa}
          onChangeFiltroSemPagamento={setFiltroSemPagamento}
          onRefresh={() => void loadReservas(page)}
          onNew={() => { resetReservaForm(); resetPagamentoForm(); setView('nova') }}
          onClearFilters={clearFilters}
          onPageChange={(next) => void loadReservas(next)}
          onEditStatus={abrirStatusModal}
          onOpenPayments={(idReserva) => void openDetalheReserva(idReserva)}
          onDelete={(idReserva) => void deletarReserva(idReserva)}
        />
      ) : null}

      {view === 'nova' && permissions.operationalWrite ? (
        <ReservaFormView
          form={reservaForm}
          quartos={quartos}
          clientesFiltrados={clientesFiltrados}
          empresasFiltradas={empresasFiltradas}
          clienteBusca={clienteBusca}
          empresaBusca={empresaBusca}
          clienteBuscaAberta={clienteBuscaAberta}
          empresaBuscaAberta={empresaBuscaAberta}
          clienteBuscaRef={clienteBuscaRef}
          empresaBuscaRef={empresaBuscaRef}
          tentouEnviar={reservaTentouEnviar}
          errors={reservaErrors}
          pagamentoForm={pagamentoForm}
          formasPagamento={formasPagamento}
          pagamentoErrors={reservaForm.sem_pagamento_inicial ? [] : pagamentoErrors}
          exigeCodigoPagamento={exigeCodigoPagamento}
          codigoPagamentoPlaceholder={codigoPagamentoPlaceholder}
          minCheckin={!isAdmin ? minCheckinInput : undefined}
          maxCheckout={!isAdmin ? maxCheckoutInput : undefined}
          minCheckout={reservaForm.data_checkin ? addDaysToDateInput(reservaForm.data_checkin, 1) : undefined}
          onChangeForm={setReservaForm}
          onChangePagamentoForm={setPagamentoForm}
          onChangeClienteBusca={setClienteBusca}
          onChangeEmpresaBusca={setEmpresaBusca}
          onSetClienteBuscaAberta={setClienteBuscaAberta}
          onSetEmpresaBuscaAberta={setEmpresaBuscaAberta}
          onNavigateCliente={abrirClienteModal}
          onNavigateEmpresa={abrirEmpresaModal}
          onBack={() => { resetReservaForm(); resetPagamentoForm(); voltarLista() }}
          onSubmit={() => void submitReserva()}
        />
      ) : null}

      {view === 'detalhe' && selectedReserva ? (
        <ReservaDetailView
          reserva={selectedReserva}
          pagamentos={pagamentos}
          consumos={consumos}
          formasPagamento={formasPagamento}
          pagamentoForm={pagamentoForm}
          consumoForm={consumoForm}
          consumoItens={consumoItens}
          mostrarPagamentoForm={mostrarPagamentoForm}
          mostrarConsumoForm={mostrarConsumoForm}
          pagamentoTentouEnviar={pagamentoTentouEnviar}
          consumoTentouEnviar={consumoTentouEnviar}
          pagamentoErrors={pagamentoErrors}
          consumoErrors={consumoErrors}
          consumoSalvando={consumoSalvando}
          permitePagamentoCorporativo={reservaTemPagamentoPrazo}
          exigeCodigoPagamento={exigeCodigoPagamento}
          codigoPagamentoPlaceholder={codigoPagamentoPlaceholder}
          isAdmin={isAdmin}
          canWrite={permissions.operationalWrite}
          onChangePagamentoForm={setPagamentoForm}
          onChangeConsumoForm={setConsumoForm}
          onSubmitPagamento={() => void submitPagamento()}
          onSubmitConsumo={() => void submitConsumo()}
          onShowPagamentoForm={() => { resetConsumoForm(); setMostrarConsumoForm(false); setMostrarPagamentoForm(true) }}
          onShowConsumoForm={() => void abrirConsumoForm()}
          onBack={voltarLista}
          onOpenTimeline={() => void abrirTimelineModal(selectedReserva)}
          onOpenExtend={() => abrirExtendModal(selectedReserva)}
          onUpdateStayValue={() => abrirValorEstadiaModal(selectedReserva)}
          onDeletePagamento={setDeletePaymentTarget}
          onDeleteConsumo={abrirDeleteConsumo}
          onQuitarConsumo={abrirQuitarConsumo}
        />
      ) : null}

      {statusModalReserva && permissions.operationalWrite ? (
        <ReservaStatusModal
          reserva={statusModalReserva}
          status={novoStatus}
          isAdmin={isAdmin}
          onChangeStatus={setNovoStatus}
          onClose={() => setStatusModalReserva(null)}
          onSubmit={() => void atualizarStatus(statusModalReserva.id_reserva, novoStatus)}
        />
      ) : null}

      {timelineModalOpen ? (
        <ReservaTimelineModal
          timeline={timeline}
          loading={timelineLoading}
          onClose={() => setTimelineModalOpen(false)}
        />
      ) : null}

      {extendModalOpen && permissions.operationalWrite ? (
        <ReservaExtendModal
          checkout={extendCheckout}
          motivo={extendMotivo}
          onChangeCheckout={setExtendCheckout}
          onChangeMotivo={setExtendMotivo}
          onClose={() => setExtendModalOpen(false)}
          onSubmit={() => void submitExtendCheckout()}
        />
      ) : null}

      {valorEstadiaModalOpen && isAdmin ? <>
        <div className="modal-backdrop fade show" />
        <div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-dialog-centered"><div className="modal-content">
          <div className="modal-header"><h5 className="modal-title">Alterar valor da estadia</h5><button type="button" className="btn-close" onClick={() => setValorEstadiaModalOpen(false)} disabled={valorEstadiaSalvando} /></div>
          <div className="modal-body">
            <label className="form-label">Novo valor</label><div className="input-group mb-3"><span className="input-group-text">R$</span><input className="form-control" inputMode="decimal" value={novoValorEstadia} onChange={(event) => setNovoValorEstadia(formatMoneyInput(event.target.value))} /></div>
            <label className="form-label">Motivo</label><textarea className="form-control" rows={3} value={motivoValorEstadia} onChange={(event) => setMotivoValorEstadia(event.target.value)} />
          </div>
          <div className="modal-footer"><button className="btn btn-outline-secondary" type="button" onClick={() => setValorEstadiaModalOpen(false)} disabled={valorEstadiaSalvando}>Cancelar</button><button className="btn btn-primary" type="button" onClick={() => void submitValorEstadia()} disabled={valorEstadiaSalvando}>{valorEstadiaSalvando ? 'Salvando...' : 'Salvar alteração'}</button></div>
        </div></div></div>
      </> : null}

      {deletePaymentTarget && permissions.operationalWrite ? (
        <DeletePaymentModal
          pagamento={deletePaymentTarget}
          onClose={() => setDeletePaymentTarget(null)}
          onConfirm={() => void confirmDeletePagamento()}
        />
      ) : null}

      {deleteConsumptionTarget && permissions.operationalWrite ? (
        <DeleteConsumptionModal
          consumo={deleteConsumptionTarget}
          motivo={deleteConsumptionReason}
          onChangeMotivo={setDeleteConsumptionReason}
          onClose={() => setDeleteConsumptionTarget(null)}
          onConfirm={() => void confirmDeleteConsumo()}
        />
      ) : null}

      {quitarConsumoTarget && permissions.operationalWrite ? (
        <QuitarConsumoModal
          consumo={quitarConsumoTarget}
          form={quitarConsumoForm}
          formasPagamento={formasPagamento}
          errors={quitarConsumoErrors}
          tentouEnviar={quitarConsumoTentouEnviar}
          salvando={quitarConsumoSalvando}
          onChange={setQuitarConsumoForm}
          onClose={() => setQuitarConsumoTarget(null)}
          onConfirm={() => void confirmarQuitarConsumo()}
        />
      ) : null}

      {clienteModalOpen && permissions.operationalWrite ? (
        <ClienteFormModal
          form={clienteForm}
          editId={null}
          error={clienteFormError}
          onChange={setClienteForm}
          onClose={() => setClienteModalOpen(false)}
          onSubmit={() => void cadastrarClienteRapido()}
        />
      ) : null}

      {empresaModalOpen && permissions.operationalWrite ? (
        <EmpresaFormModal
          form={empresaForm}
          editId={null}
          error={empresaFormError}
          onChange={setEmpresaForm}
          onClose={() => setEmpresaModalOpen(false)}
          onSubmit={() => void cadastrarEmpresaRapida()}
        />
      ) : null}
    </div>
  )
}
