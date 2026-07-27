'use client'
/* eslint-disable @next/next/no-img-element */

import './LoginView.css'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '@/shared/services/api'

type LoginMessageCode = 'logout' | 'expirou'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [baseUrl, setBaseUrl] = useState('/')
  const [loginMessageCode, setLoginMessageCode] = useState<LoginMessageCode | ''>('')
  const [loginError, setLoginError] = useState('')
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlMsg = searchParams.get('msg') || ''
    const urlErro = searchParams.get('erro') || ''
    const messageCode = ((urlMsg || window.MURIKA_LOGIN_MESSAGE || '').trim() as LoginMessageCode | '')
    const errorMessage = (urlErro || window.MURIKA_LOGIN_ERROR || '').trim()
    const rawBaseUrl = (window.MURIKA_BASE_URL || '/').trim()
    const normalizedBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`

    setLoginMessageCode(messageCode)
    setLoginError(errorMessage)
    setBaseUrl(normalizedBaseUrl)
    setCsrfToken(window.MURIKA_CSRF_TOKEN || '')

    if (!window.MURIKA_CSRF_TOKEN) {
      void fetch('/api/auth_csrf', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      })
        .then((response) => response.json())
        .then((payload: { data?: { csrfToken?: string } }) => {
          const token = payload.data?.csrfToken || ''
          window.MURIKA_CSRF_TOKEN = token
          setCsrfToken(token)
        })
        .catch(() => setLoginError('Não foi possível iniciar uma sessão segura. Atualize a página.'))
    }
  }, [])

  const loginMessage = useMemo(() => {
    if (loginMessageCode === 'logout') {
      return { type: 'info', text: 'Você foi desconectado com sucesso.' }
    }
    if (loginMessageCode === 'expirou') {
      return { type: 'warning', text: 'Sua sessão foi encerrada. Faça login novamente.' }
    }
    return null
  }, [loginMessageCode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    const form = event.currentTarget
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    setLoginError('')
    setIsSubmitting(true)

    try {
      const result = await api.postEnvelope<{ requiresPasswordChange: boolean }>('/auth_login', {
        email,
        senha
      })
      window.location.assign(result.data?.requiresPasswordChange ? '/nova-senha' : '/')
    } catch (requestError) {
      setLoginError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível autenticar no momento. Tente novamente.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <section className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src={`${baseUrl}assets/image/icon.svg`} width={56} height={56} alt="Símbolo Murika" />
            <h2>MURIKA</h2>
            <p>Gestão hoteleira</p>
          </div>
          {loginMessage ? (
            <div className={`alert alert-${loginMessage.type}`}>
              <i className={loginMessage.type === 'info' ? 'fas fa-info-circle' : 'fas fa-exclamation-triangle'} /> {loginMessage.text}
            </div>
          ) : null}
          {loginError ? (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle" /> {loginError}
            </div>
          ) : null}
          <form id="formLogin" method="post" action="/login" onSubmit={handleSubmit}>
            <input type="hidden" name="csrf_token" value={csrfToken} />
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: 600}}>Email</label>
              <input type="email" name="email" className="form-control" value={email} 
              onChange={(event) => setEmail(event.target.value)} autoComplete="username" required autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: 600}}>Senha</label>
              <input type="password" name="senha" className="form-control" value={senha}
              onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 login-submit-btn" disabled={isSubmitting || !csrfToken}>
              <i className="fas fa-sign-in-alt" /> {!csrfToken ? 'Preparando...' : (isSubmitting ? 'Entrando...' : 'Entrar')}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
