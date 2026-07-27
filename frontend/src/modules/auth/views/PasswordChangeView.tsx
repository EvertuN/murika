'use client'

import './PasswordChangeView.css'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '@/shared/services/api'
import { loadPhpAuthSession } from '@/modules/auth/services/auth-session.service'

export default function PasswordChangeView() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    if (window.MURIKA_CSRF_TOKEN) {
      setSessionReady(true)
      return
    }
    void loadPhpAuthSession()
      .then(() => setSessionReady(true))
      .catch(() => window.location.assign('/login?msg=expirou'))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setMessage('')
    setError('')
    if (newPassword !== confirmation) {
      setError('A confirmação da senha não confere.')
      return
    }

    setSubmitting(true)
    try {
      const result = await api.postEnvelope('/auth_password', {
        senha_atual: currentPassword,
        nova_senha: newPassword,
        confirmacao_senha: confirmation
      })
      setMessage(result.message || 'Senha alterada com sucesso.')
      window.setTimeout(() => window.location.assign('/'), 800)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível alterar a senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="password-change-page">
      <section className="password-change-card">
        <div className="password-change-icon"><i className="fas fa-key" /></div>
        <h1>Cadastre uma nova senha</h1>
        <p>Por segurança, você precisa trocar a senha temporária antes de acessar o sistema.</p>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {message ? <div className="alert alert-success">{message}</div> : null}

        <form onSubmit={handleSubmit}>
          <label>
            Senha atual
            <input
              className="form-control"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label>
            Nova senha
            <input
              className="form-control"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              className="form-control"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting || !sessionReady}>
            {!sessionReady ? 'Validando sessão...' : (submitting ? 'Salvando...' : 'Salvar nova senha')}
          </button>
        </form>

        <a href="/logout" className="password-change-logout">Sair da conta</a>
      </section>
    </main>
  )
}
