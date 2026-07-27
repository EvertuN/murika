'use client'

import './HospedagemCadastrosView.css'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  hospedagemCadastrosService,
  type FormaPagamentoCadastro,
  type HospedagemCadastrosData,
  type QuartoCadastro,
  type TipoQuarto
} from '@/modules/hospedagem/services/hospedagem-cadastros.service'

type TipoForm = {
  original: string
  tipo: string
  precoPadrao: string
  precoDuasPessoas: string
}

type QuartoForm = {
  id: number | null
  numero: string
  tipo: string
}

type PagamentoForm = {
  id: number | null
  nome: string
}

const EMPTY_TYPE: TipoForm = { original: '', tipo: '', precoPadrao: '', precoDuasPessoas: '' }
const EMPTY_ROOM: QuartoForm = { id: null, numero: '', tipo: '' }
const EMPTY_PAYMENT: PagamentoForm = { id: null, nome: '' }
const SUCCESS_MESSAGE_DURATION_MS = 4000

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type HospedagemCadastroSection = 'quartos' | 'tipos_quarto' | 'formas_pagamento'

type Props = {
  section: HospedagemCadastroSection
}

const SECTION_DETAILS: Record<HospedagemCadastroSection, { title: string; description: string }> = {
  quartos: {
    title: 'Quartos',
    description: 'Cadastre e organize as unidades disponíveis para reserva.'
  },
  tipos_quarto: {
    title: 'Tipos de quarto',
    description: 'Configure os tipos de acomodação e seus preços de referência.'
  },
  formas_pagamento: {
    title: 'Formas de pagamento',
    description: 'Defina as opções disponíveis no check-in e nos consumos.'
  }
}

export default function HospedagemCadastrosView({ section }: Props) {
  const [data, setData] = useState<HospedagemCadastrosData | null>(null)
  const [typeForm, setTypeForm] = useState<TipoForm>(EMPTY_TYPE)
  const [roomForm, setRoomForm] = useState<QuartoForm>(EMPTY_ROOM)
  const [paymentForm, setPaymentForm] = useState<PagamentoForm>(EMPTY_PAYMENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await hospedagemCadastrosService.listar())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os cadastros.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!message) return

    const timeoutId = window.setTimeout(() => {
      setMessage('')
    }, SUCCESS_MESSAGE_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [message])

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(success)
      await load()
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível concluir a operação.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const submitType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const updated = await runAction(
      () => hospedagemCadastrosService.salvarTipoQuarto({
        tipoOriginal: typeForm.original || undefined,
        tipo: typeForm.tipo.trim(),
        precoPadrao: typeForm.precoPadrao,
        precoDuasPessoas: typeForm.precoDuasPessoas
      }),
      typeForm.original ? 'Tipo de quarto atualizado.' : 'Tipo de quarto criado.'
    )
    if (updated) setTypeForm(EMPTY_TYPE)
  }

  const submitRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const updated = await runAction(
      () => hospedagemCadastrosService.salvarQuarto({
        id: roomForm.id || undefined,
        numero: roomForm.numero.trim(),
        tipo: roomForm.tipo
      }),
      roomForm.id ? 'Quarto atualizado.' : 'Quarto criado.'
    )
    if (updated) setRoomForm(EMPTY_ROOM)
  }

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const updated = await runAction(
      () => hospedagemCadastrosService.salvarFormaPagamento({
        id: paymentForm.id || undefined,
        nome: paymentForm.nome.trim()
      }),
      paymentForm.id ? 'Forma de pagamento atualizada.' : 'Forma de pagamento criada.'
    )
    if (updated) setPaymentForm(EMPTY_PAYMENT)
  }

  const editType = (entry: TipoQuarto) => {
    setTypeForm({
      original: entry.tipo,
      tipo: entry.tipo,
      precoPadrao: String(entry.preco_padrao),
      precoDuasPessoas: String(entry.preco_2_pessoas)
    })
  }

  const editRoom = (entry: QuartoCadastro) => {
    setRoomForm({ id: entry.id_quarto, numero: entry.numero, tipo: entry.tipo })
  }

  const editPayment = (entry: FormaPagamentoCadastro) => {
    setPaymentForm({ id: entry.id_forma_pagamento, nome: entry.nome_forma_pagamento })
  }

  const removeType = async (entry: TipoQuarto) => {
    if (!window.confirm(`Excluir o tipo ${entry.tipo}?`)) return
    await runAction(() => hospedagemCadastrosService.excluirTipoQuarto(entry.tipo), 'Tipo de quarto excluído.')
  }

  const removeRoom = async (entry: QuartoCadastro) => {
    if (!window.confirm(`Excluir o quarto ${entry.numero}?`)) return
    await runAction(() => hospedagemCadastrosService.excluirQuarto(entry.id_quarto), 'Quarto excluído.')
  }

  const removePayment = async (entry: FormaPagamentoCadastro) => {
    if (!window.confirm(`Excluir a forma de pagamento ${entry.nome_forma_pagamento}?`)) return
    await runAction(
      () => hospedagemCadastrosService.excluirFormaPagamento(entry.id_forma_pagamento),
      'Forma de pagamento excluída.'
    )
  }

  if (loading && !data) {
    return <div className='hotel-catalogs-loading'>Carregando cadastros da hospedagem...</div>
  }

  const types = data?.tiposQuarto ?? []
  const rooms = data?.quartos ?? []
  const paymentMethods = data?.formasPagamento ?? []
  const page = SECTION_DETAILS[section]

  return (
    <section className='hotel-catalogs-view'>
      <header className='hotel-catalogs-header'>
        <div>
          <span>Cadastros · Hospedagem</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </header>

      {error ? <div className='alert alert-danger'>{error}</div> : null}
      {message ? <div className='alert alert-success'>{message}</div> : null}

      <div className='hotel-catalogs-grid'>
        {section === 'tipos_quarto' ? <article className='hotel-catalog-card hotel-catalog-card--wide'>
          <div className='hotel-catalog-card-title'>
            <div><h2>Tipos de quarto</h2><p>Valores sugeridos para novas reservas.</p></div>
            <span>{types.length} cadastrados</span>
          </div>
          <form className='hotel-catalog-form hotel-catalog-form--type' onSubmit={submitType}>
            <label>Nome do tipo<input className='form-control' maxLength={50} value={typeForm.tipo} onChange={(event) => setTypeForm({ ...typeForm, tipo: event.target.value })} placeholder='Ex.: Suíte família' required /></label>
            <label>Preço padrão<input className='form-control' type='number' min={0} step='0.01' value={typeForm.precoPadrao} onChange={(event) => setTypeForm({ ...typeForm, precoPadrao: event.target.value })} required /></label>
            <label>Preço para 2 pessoas<input className='form-control' type='number' min={0} step='0.01' value={typeForm.precoDuasPessoas} onChange={(event) => setTypeForm({ ...typeForm, precoDuasPessoas: event.target.value })} required /></label>
            <div className='hotel-catalog-form-actions'><button className='btn btn-primary' disabled={saving}>{typeForm.original ? 'Salvar tipo' : 'Adicionar tipo'}</button>{typeForm.original ? <button className='btn btn-outline-secondary' type='button' onClick={() => setTypeForm(EMPTY_TYPE)}>Cancelar</button> : null}</div>
          </form>
          <div className='table-responsive'>
            <table className='table align-middle'>
              <thead><tr><th>Tipo</th><th>Preço padrão</th><th>2 pessoas</th><th>Quartos</th><th>Ações</th></tr></thead>
              <tbody>{types.map((entry) => <tr key={entry.tipo}><td><strong>{entry.tipo}</strong></td><td>{money.format(entry.preco_padrao)}</td><td>{money.format(entry.preco_2_pessoas)}</td><td>{entry.quantidade_quartos}</td><td><div className='hotel-catalog-actions'><button className='btn btn-sm btn-outline-primary' type='button' onClick={() => editType(entry)}>Editar</button><button className='btn btn-sm btn-outline-danger' type='button' disabled={entry.quantidade_quartos > 0} onClick={() => void removeType(entry)}>Excluir</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </article> : null}

        {section === 'quartos' ? <article className='hotel-catalog-card hotel-catalog-card--wide'>
          <div className='hotel-catalog-card-title'>
            <div><h2>Quartos</h2><p>Unidades disponíveis para reserva.</p></div>
            <span>{rooms.length} cadastrados</span>
          </div>
          <form className='hotel-catalog-form' onSubmit={submitRoom}>
            <label>Número ou identificação<input className='form-control' maxLength={20} value={roomForm.numero} onChange={(event) => setRoomForm({ ...roomForm, numero: event.target.value })} placeholder='Ex.: 101' required /></label>
            <label>Tipo<select className='form-select' value={roomForm.tipo} onChange={(event) => setRoomForm({ ...roomForm, tipo: event.target.value })} required><option value=''>Selecione...</option>{types.map((entry) => <option key={entry.tipo} value={entry.tipo}>{entry.tipo}</option>)}</select></label>
            <div className='hotel-catalog-form-actions'><button className='btn btn-primary' disabled={saving || types.length === 0}>{roomForm.id ? 'Salvar quarto' : 'Adicionar quarto'}</button>{roomForm.id ? <button className='btn btn-outline-secondary' type='button' onClick={() => setRoomForm(EMPTY_ROOM)}>Cancelar</button> : null}</div>
          </form>
          <div className='table-responsive'>
            <table className='table align-middle'>
              <thead><tr><th>Quarto</th><th>Tipo</th><th>Reservas</th><th>Ações</th></tr></thead>
              <tbody>{rooms.map((entry) => <tr key={entry.id_quarto}><td><strong>{entry.numero}</strong></td><td>{entry.tipo}</td><td>{entry.quantidade_reservas}</td><td><div className='hotel-catalog-actions'><button className='btn btn-sm btn-outline-primary' type='button' onClick={() => editRoom(entry)}>Editar</button><button className='btn btn-sm btn-outline-danger' type='button' disabled={entry.quantidade_reservas > 0} onClick={() => void removeRoom(entry)}>Excluir</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </article> : null}

        {section === 'formas_pagamento' ? <article className='hotel-catalog-card hotel-catalog-card--wide'>
          <div className='hotel-catalog-card-title'>
            <div><h2>Formas de pagamento</h2><p>Opções exibidas no check-in e nos consumos.</p></div>
            <span>{paymentMethods.length} cadastradas</span>
          </div>
          <form className='hotel-catalog-form' onSubmit={submitPayment}>
            <label>Nome da forma de pagamento<input className='form-control' maxLength={60} value={paymentForm.nome} onChange={(event) => setPaymentForm({ ...paymentForm, nome: event.target.value })} placeholder='Ex.: Transferência bancária' required /></label>
            <div className='hotel-catalog-form-actions'><button className='btn btn-primary' disabled={saving}>{paymentForm.id ? 'Salvar forma' : 'Adicionar forma'}</button>{paymentForm.id ? <button className='btn btn-outline-secondary' type='button' onClick={() => setPaymentForm(EMPTY_PAYMENT)}>Cancelar</button> : null}</div>
          </form>
          <div className='table-responsive'>
            <table className='table align-middle'>
              <thead><tr><th>Forma</th><th>Usos</th><th>Ações</th></tr></thead>
              <tbody>{paymentMethods.map((entry) => <tr key={entry.id_forma_pagamento}><td><strong>{entry.nome_forma_pagamento}</strong></td><td>{entry.quantidade_usos}</td><td><div className='hotel-catalog-actions'><button className='btn btn-sm btn-outline-primary' type='button' onClick={() => editPayment(entry)}>Editar</button><button className='btn btn-sm btn-outline-danger' type='button' disabled={entry.quantidade_usos > 0} onClick={() => void removePayment(entry)}>Excluir</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </article> : null}
      </div>
    </section>
  )
}
