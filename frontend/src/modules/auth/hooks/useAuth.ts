'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  getBootstrapAuthState,
  redirectToLogout
} from '@/modules/auth/services/auth-session.service'
import type { AuthState } from '@/modules/auth/types/auth'

export function useAuth() {
  const [state, setState] = useState<AuthState>(getBootstrapAuthState)

  const setAuthState = useCallback((nextState: AuthState) => {
    setState(nextState)
  }, [])

  const clearAuthState = useCallback(() => {
    setState({
      status: 'anonymous',
      user: null,
      serverTimeNow: null,
      sessionTimeoutSeconds: 43200,
      permissions: {
        manageUsers: false,
        manageEmployees: false,
        viewFinancial: false,
        viewReports: false,
        operationalWrite: false
      }
    })
  }, [])

  const logout = useCallback((path = '/logout') => {
    redirectToLogout(path)
  }, [])

  return {
    ...state,
    isAuthenticated: state.status === 'authenticated' && state.user !== null,
    isAdmin: state.user?.role === 'admin',
    isRecepcao: state.user?.role === 'recepcao',
    isFinanceiro: state.user?.role === 'financeiro',
    requiresPasswordChange: Boolean(state.user?.requiresPasswordChange),
    setAuthState,
    clearAuthState,
    logout,
    role: useMemo(() => state.user?.role ?? null, [state.user])
  }
}
