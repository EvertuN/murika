'use client'

import './AppClientes.css'
import { useEffect, useMemo, useState } from 'react'
import clienteService, { type Cliente } from '@/modules/hospedagem/services/cliente.service'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import ClienteFormModal, { type ClienteForm } from './ClienteFormModal'
import ClientesListView from './ClientesListView'

type Props = { sectionId: string }

const EMPTY_FORM: ClienteForm = {
  nome: '',
  email: '',
  telefone: '',
  tipo_documento: 'CPF',
  documento: ''
}

export default function AppClientes({ sectionId }: Props) {
  const { navigateTo } = useSectionRouter()
  const { isAdmin, permissions } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [formError, setFormError] = useState('')
  const [page, setPage] = useState(1)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ClienteForm>(EMPTY_FORM)

  const isCadastro = sectionId === 'cadastrar_cliente'

  const closeModal = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    navigateTo('listar_clientes')
  }

  const load = async () => {
    setLoading(true)
    setErro('')
    try {
      setClientes(await clienteService.listar())
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter((entry) => (
      entry.nome.toLowerCase().includes(termo) ||
      String(entry.documento || '').toLowerCase().includes(termo) ||
      String(entry.telefone || '').toLowerCase().includes(termo)
    ))
  }, [busca, clientes])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / 20))
  const clientesPaginados = useMemo(() => {
    const normalizedPage = Math.min(Math.max(1, page), totalPages)
    return filtrados.slice((normalizedPage - 1) * 20, normalizedPage * 20)
  }, [filtrados, page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [busca])

  const submit = async () => {
    if (!form.nome.trim()) {
      setFormError('Informe o nome do cliente.')
      return
    }
    if (!form.documento.trim()) {
      setFormError('Informe o documento do cliente.')
      return
    }
    setErro('')
    setFormError('')
    const payload = {
      nome: form.nome.trim().toUpperCase(),
      email: form.email.trim(),
      telefone: form.telefone.trim(),
      tipo_documento: form.tipo_documento,
      documento: form.documento.trim()
    }
    try {
      if (editId) {
        await clienteService.editar(editId, payload)
      } else {
        await clienteService.cadastrar(payload)
      }
      emitEntityUpdated({ endpoint: '/cliente' })
      setEditId(null)
      setForm(EMPTY_FORM)
      await load()
      navigateTo('listar_clientes')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar cliente.')
    }
  }

  const editCliente = (entry: Cliente) => {
    setEditId(entry.id_cliente)
    setForm({
      nome: entry.nome,
      email: String(entry.email || ''),
      telefone: String(entry.telefone || ''),
      tipo_documento: String(entry.tipo_documento || 'CPF'),
      documento: String(entry.documento || '')
    })
    setFormError('')
    navigateTo('cadastrar_cliente')
  }

  const deleteCliente = async (entry: Cliente) => {
    setErro('')
    try {
      await clienteService.deletar(entry.id_cliente)
      emitEntityUpdated({ endpoint: '/cliente' })
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir cliente.')
    }
  }

  const activateCliente = async (entry: Cliente) => {
    setErro('')
    try {
      await clienteService.ativar(entry.id_cliente)
      emitEntityUpdated({ endpoint: '/cliente' })
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao ativar cliente.')
    }
  }

  return (
    <div className="AppClientes-view card">
      {erro ? <div className="alert alert-danger">{erro}</div> : null}
      <ClientesListView
        clientes={clientesPaginados}
        loading={loading}
        page={page}
        totalPages={totalPages}
        busca={busca}
        onChangeBusca={setBusca}
        onChangePage={setPage}
        onNew={() => navigateTo('cadastrar_cliente')}
        onEdit={editCliente}
        onDelete={(entry) => void deleteCliente(entry)}
        onActivate={(entry) => void activateCliente(entry)}
        isAdmin={isAdmin}
        canCreate={permissions.operationalWrite}
      />
      {permissions.operationalWrite && (isCadastro || editId) ? (
        <ClienteFormModal
          form={form}
          editId={editId}
          error={formError}
          onChange={setForm}
          onClose={closeModal}
          onSubmit={() => void submit()}
        />
      ) : null}
    </div>
  )
}
