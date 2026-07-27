'use client'

import { useEffect, useState } from 'react'
import LoginView from '@/modules/auth/views/LoginView'
import PasswordChangeView from '@/modules/auth/views/PasswordChangeView'
import AppShell from '@/core/layout/AppShell'
import { SectionRouterProvider } from '@/core/hooks/useSectionRouter'
import { initSectionRouterSync } from '@/router/section-router-sync'
import { hasWindowAuthBootstrap, loadPhpAuthSession } from '@/modules/auth/services/auth-session.service'

type RenderMode = 'none' | 'login' | 'password-change' | 'app'

function AppRoot() {
  return (
    <SectionRouterProvider>
      <AppShell />
    </SectionRouterProvider>
  )
}

export default function RootPage() {
  const [mode, setMode] = useState<RenderMode>('none')

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const pageMode = window.MURIKA_PAGE_MODE
      if (pageMode === 'login' || window.location.pathname === '/login') {
        if (!cancelled) setMode('login')
        return
      }
      if (pageMode === 'password-change' || window.location.pathname === '/nova-senha') {
        if (!cancelled) setMode('password-change')
        return
      }

      if (!hasWindowAuthBootstrap()) {
        try {
          await loadPhpAuthSession()
        } catch {
          window.location.assign('/login?msg=expirou')
          return
        }
      }

      initSectionRouterSync()
      if (!cancelled) setMode('app')
    }

    void boot()

    return () => {
      cancelled = true
    }
  }, [])

  if (mode === 'login') return <LoginView />
  if (mode === 'password-change') return <PasswordChangeView />
  return mode === 'app' ? <AppRoot /> : null
}
