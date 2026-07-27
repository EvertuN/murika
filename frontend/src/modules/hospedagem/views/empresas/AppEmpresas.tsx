'use client'

import './AppEmpresas.css'
import { useEffect, useMemo, useState } from 'react'
import empresaService, { type Empresa } from '@/modules/hospedagem/services/empresa.service'
import { emitEntityUpdated } from '@/shared/services/app-events.service'
import { useSectionRouter } from '@/core/hooks/useSectionRouter'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import EmpresaFormModal, { type EmpresaForm } from './EmpresaFormModal'
import EmpresasListView from './EmpresasListView'

type Props = { sectionId: string }

const EMPTY_FORM: EmpresaForm = {
  razao_social: '',
  cnpj: '',
  telefone: '',
  email: ''
}

export default function AppEmpresas({ sectionId }: Props) {
  const { navigateTo } = useSectionRouter()
  const { isAdmin, permissions } = useAuth()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<EmpresaForm>(EMPTY_FORM)

  const isCadastro = sectionId === 'cadastrar_empresa'

  const closeModal = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    navigateTo('listar_empresas')
  }

  const load = async () => {
    setLoading(true)
    setErro('')
    try {
      setEmpresas(await empresaService.listar())
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar empresas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return empresas
    return empresas.filter((entry) => (
      entry.razao_social.toLowerCase().includes(termo) ||
      String(entry.cnpj || '').toLowerCase().includes(termo) ||
      String(entry.telefone || '').toLowerCase().includes(termo)
    ))
  }, [busca, empresas])

  const submit = async () => {
    if (!form.razao_social.trim()) return
    setErro('')
    const payload = {
      razao_social: form.razao_social.trim().toUpperCase(),
      cnpj: form.cnpj.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim()
    }
    try {
      if (editId) {
        await empresaService.editar(editId, payload)
      } else {
        await empresaService.cadastrar(payload)
      }
      emitEntityUpdated({ endpoint: '/empresa' })
      setEditId(null)
      setForm(EMPTY_FORM)
      await load()
      navigateTo('listar_empresas')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar empresa.')
    }
  }

  const editEmpresa = (entry: Empresa) => {
    setEditId(entry.id_empresa)
    setForm({
      razao_social: entry.razao_social,
      cnpj: String(entry.cnpj || ''),
      telefone: String(entry.telefone || ''),
      email: ''
    })
    navigateTo('cadastrar_empresa')
  }

  const deleteEmpresa = async (entry: Empresa) => {
    setErro('')
    try {
      await empresaService.deletar(entry.id_empresa)
      emitEntityUpdated({ endpoint: '/empresa' })
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir empresa.')
    }
  }

  const activateEmpresa = async (entry: Empresa) => {
    setErro('')
    try {
      await empresaService.ativar(entry.id_empresa)
      emitEntityUpdated({ endpoint: '/empresa' })
      await load()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao ativar empresa.')
    }
  }

  return (
    <div className="AppEmpresas-view card">
      {erro ? <div className="alert alert-danger">{erro}</div> : null}
      <EmpresasListView
        empresas={filtrados}
        loading={loading}
        busca={busca}
        onChangeBusca={setBusca}
        onNew={() => navigateTo('cadastrar_empresa')}
        onEdit={editEmpresa}
        onDelete={(entry) => void deleteEmpresa(entry)}
        onActivate={(entry) => void activateEmpresa(entry)}
        isAdmin={isAdmin}
        canCreate={permissions.operationalWrite}
      />
      {permissions.operationalWrite && (isCadastro || editId) ? (
        <EmpresaFormModal
          form={form}
          editId={editId}
          onChange={setForm}
          onClose={closeModal}
          onSubmit={() => void submit()}
        />
      ) : null}
    </div>
  )
}
