'use client'

import { useEffect } from 'react'
import { startSessionTimer } from '@/shared/services/session-timer.service'

function hasPhpAuthBootstrap(): boolean {
  return (
    typeof window.MURIKA_AUTH_USER !== 'undefined' ||
    typeof window.MURIKA_AUTH_STATUS !== 'undefined' ||
    typeof window.MURIKA_IS_ADMIN !== 'undefined'
  )
}

export function useSessionTimer(): void {
  useEffect(() => {
    if (hasPhpAuthBootstrap()) {
      return startSessionTimer()
    }
  }, [])
}
