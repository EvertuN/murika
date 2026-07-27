'use client'

import './AuthUsersView.css'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  authUserService,
  type AuthUser,
  type AuthUserList
} from '@/modules/auth/services/auth-user.service'
import type { AuthRole } from '@/modules/auth/types/auth'

type UserForm = {
  id: string
  nome: string
  email: string
  role: AuthRole
  idFuncionario: string
  senha: string
}

const EMPTY_FORM: UserForm = {
  id: '',
  nome: '',
  email: '',
  role: 'recepcao',
  idFuncionario: '',
  senha: ''
}

const ROLE_LABELS: Record<AuthRole, string> = {
  admin: 'Administrador',
  recepcao: 'Recepção',
  financeiro: 'Financeiro'
}

export default function AuthUsersView() {
  const [data, setData] = useState<AuthUserList | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await authUserService.list())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const editing = form.id !== ''
  const passwordMinimum = data?.passwordMinimumLength ?? 8
  const users = useMemo(() => data?.users ?? [], [data])

  const showSuccess = (text: string) => {
    setMessage(text)
    setError('')
  }

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true)
    setError('')
    try {
      await action()
      showSuccess(success)
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível concluir a operação.')
    } finally {
      setSaving(false)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runAction(
      () => authUserService.save({
        id: form.id || undefined,
        nome: form.nome,
        email: form.email,
        role: form.role,
        idFuncionario: form.idFuncionario,
        senha: editing ? undefined : form.senha
      }),
      editing ? 'Usuário atualizado.' : 'Usuário criado.'
    )
    setForm(EMPTY_FORM)
  }

  const edit = (user: AuthUser) => {
    setForm({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      idFuncionario: user.id_funcionario ? String(user.id_funcionario) : '',
      senha: ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetPassword = async (user: AuthUser) => {
    const password = window.prompt(
      `Informe a nova senha temporária de ${user.nome} (mínimo ${passwordMinimum} caracteres):`
    )
    if (!password) return
    await runAction(
      () => authUserService.resetPassword(user.id, password),
      'Senha temporária definida e sessões anteriores encerradas.'
    )
  }

  return (
    <section className="auth-users-view">
      <header>
        <div>
          <span className="auth-users-eyebrow">Administração</span>
          <h1>Usuários e permissões</h1>
          <p>Gerencie acessos locais, perfis, bloqueios e troca obrigatória de senha.</p>
        </div>
      </header>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <form className="auth-user-form" onSubmit={submit}>
        <h2>{editing ? 'Editar usuário' : 'Novo usuário'}</h2>
        <div className="auth-user-form-grid">
          <label>
            Nome
            <input
              className="form-control"
              value={form.nome}
              maxLength={100}
              onChange={(event) => setForm({ ...form, nome: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              className="form-control"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Perfil
            <select
              className="form-select"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as AuthRole })}
            >
              {(data?.roles ?? ['admin', 'recepcao', 'financeiro']).map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </label>
          <label>
            ID do funcionário (opcional)
            <input
              className="form-control"
              type="number"
              min={1}
              value={form.idFuncionario}
              onChange={(event) => setForm({ ...form, idFuncionario: event.target.value })}
            />
          </label>
          {!editing ? (
            <label>
              Senha temporária
              <input
                className="form-control"
                type="password"
                minLength={passwordMinimum}
                value={form.senha}
                onChange={(event) => setForm({ ...form, senha: event.target.value })}
                required
              />
            </label>
          ) : null}
        </div>
        <div className="auth-user-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : (editing ? 'Salvar alterações' : 'Criar usuário')}
          </button>
          {editing ? (
            <button className="btn btn-outline-secondary" type="button" onClick={() => setForm(EMPTY_FORM)}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="auth-users-table-wrap">
        {loading ? <p>Carregando usuários...</p> : (
          <table className="table auth-users-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Último login</th>
                <th>Segurança</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.nome}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{ROLE_LABELS[user.role]}</td>
                  <td>
                    <span className={`auth-user-status ${user.ativo ? 'active' : 'inactive'}`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>{user.last_login_at || 'Nunca acessou'}</td>
                  <td>
                    {user.bloqueado ? <span className="badge text-bg-danger">Bloqueado</span> : null}
                    {user.precisa_trocar_senha ? <span className="badge text-bg-warning">Troca pendente</span> : null}
                    {!user.bloqueado && !user.precisa_trocar_senha ? 'Regular' : null}
                  </td>
                  <td>
                    <div className="auth-user-actions">
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => edit(user)}>Editar</button>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => void resetPassword(user)}>Redefinir senha</button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        type="button"
                        onClick={() => void runAction(
                          () => authUserService.forcePasswordChange(user.id, !user.precisa_trocar_senha),
                          user.precisa_trocar_senha ? 'Troca obrigatória removida.' : 'Troca obrigatória ativada.'
                        )}
                      >
                        {user.precisa_trocar_senha ? 'Remover troca' : 'Forçar troca'}
                      </button>
                      {user.bloqueado ? (
                        <button className="btn btn-sm btn-outline-warning" type="button" onClick={() => void runAction(() => authUserService.unlock(user.id), 'Usuário desbloqueado.')}>
                          Desbloquear
                        </button>
                      ) : null}
                      <button
                        className={`btn btn-sm ${user.ativo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        type="button"
                        onClick={() => void runAction(
                          () => authUserService.setStatus(user.id, !user.ativo),
                          user.ativo ? 'Usuário desativado.' : 'Usuário ativado.'
                        )}
                      >
                        {user.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <tr><td colSpan={6}>Nenhum usuário cadastrado.</td></tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
