import { api } from '@/shared/services/api'
import type { AuthRole } from '@/modules/auth/types/auth'

export type AuthUser = {
  id: string
  nome: string
  email: string
  role: AuthRole
  id_funcionario: number | null
  ativo: boolean
  precisa_trocar_senha: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null
  failed_attempts: number
  last_attempt: string | null
  bloqueado: boolean
}

export type AuthUserList = {
  users: AuthUser[]
  roles: AuthRole[]
  passwordMinimumLength: number
  maxAttempts: number
  lockoutSeconds: number
}

export const authUserService = {
  list(): Promise<AuthUserList> {
    return api.get<AuthUserList>('/auth_users', { acao: 'listar' })
  },

  save(input: {
    id?: string
    nome: string
    email: string
    role: AuthRole
    idFuncionario?: string
    senha?: string
  }): Promise<{ id?: string }> {
    return api.post('/auth_users', {
      acao: 'salvar',
      id: input.id,
      nome: input.nome,
      email: input.email,
      role: input.role,
      id_funcionario: input.idFuncionario,
      senha: input.senha
    })
  },

  setStatus(id: string, active: boolean): Promise<void> {
    return api.post('/auth_users', {
      acao: 'alterar_status',
      id,
      ativo: active
    })
  },

  resetPassword(id: string, password: string): Promise<void> {
    return api.post('/auth_users', {
      acao: 'redefinir_senha',
      id,
      senha: password
    })
  },

  forcePasswordChange(id: string, force: boolean): Promise<void> {
    return api.post('/auth_users', {
      acao: 'forcar_troca',
      id,
      forcar: force
    })
  },

  unlock(id: string): Promise<void> {
    return api.post('/auth_users', {
      acao: 'desbloquear',
      id
    })
  }
}
