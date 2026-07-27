'use client'

import { useEffect } from 'react'
import { initInputMaskService, refreshInputMasks } from '@/shared/services/input-mask.service'

export function useInputMask(): void {
  useEffect(() => {
    initInputMaskService()
    refreshInputMasks()
  }, [])
}
