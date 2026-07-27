'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { emitSectionChanged } from '@/shared/services/app-events.service'
import {
  DEFAULT_SECTION_ID,
  getPathBySectionId,
  getSectionIdByPath,
  isSectionId,
  type SectionId
} from '@/router/section-routes'

type SectionRouterState = {
  currentSectionId: SectionId
  currentPath: string
  navigateTo: (sectionId: string, replace?: boolean) => boolean
}

const SectionRouterContext = createContext<SectionRouterState | null>(null)

function resolveInitialSection(): SectionId {
  if (typeof window === 'undefined') {
    return DEFAULT_SECTION_ID
  }
  return getSectionIdByPath(window.location.pathname) ?? DEFAULT_SECTION_ID
}

function resolveInitialPath(sectionId: SectionId): string {
  if (typeof window === 'undefined') {
    return getPathBySectionId(sectionId) ?? '/estoque/dia'
  }
  return window.location.pathname || getPathBySectionId(sectionId) || '/estoque/dia'
}

export function SectionRouterProvider({ children }: { children: ReactNode }) {
  const [currentSectionId, setCurrentSectionId] = useState<SectionId>(resolveInitialSection)
  const [currentPath, setCurrentPath] = useState<string>(() =>
    resolveInitialPath(resolveInitialSection())
  )

  const navigateTo = useCallback((sectionId: string, replace = false): boolean => {
    const path = getPathBySectionId(sectionId)
    if (!path) {
      emitSectionChanged({ sectionId })
      return false
    }

    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState({}, '', path)
      } else {
        window.history.pushState({}, '', path)
      }
    }

    const typedSectionId = isSectionId(sectionId) ? sectionId : DEFAULT_SECTION_ID
    setCurrentSectionId(typedSectionId)
    setCurrentPath(path)
    emitSectionChanged({ sectionId: typedSectionId })
    return true
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onPopState = () => {
      const nextSectionId = getSectionIdByPath(window.location.pathname) ?? DEFAULT_SECTION_ID
      setCurrentSectionId(nextSectionId)
      setCurrentPath(window.location.pathname)
      emitSectionChanged({ sectionId: nextSectionId })
    }

    window.addEventListener('popstate', onPopState)
    emitSectionChanged({ sectionId: currentSectionId })
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [currentSectionId])

  const value = useMemo<SectionRouterState>(
    () => ({
      currentSectionId,
      currentPath,
      navigateTo
    }),
    [currentSectionId, currentPath, navigateTo]
  )

  return <SectionRouterContext.Provider value={value}>{children}</SectionRouterContext.Provider>
}

export function useSectionRouter(): SectionRouterState {
  const context = useContext(SectionRouterContext)
  if (!context) {
    throw new Error('useSectionRouter must be used within SectionRouterProvider')
  }
  return context
}
