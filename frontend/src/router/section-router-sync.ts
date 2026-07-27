import { type SectionId, getPathBySectionId, getSectionIdByPath, DEFAULT_SECTION_ID } from './section-routes'
import { emitSectionChanged } from '@/shared/services/app-events.service'

function resolveCurrentSectionId(): SectionId {
  if (typeof window === 'undefined') {
    return DEFAULT_SECTION_ID
  }
  return getSectionIdByPath(window.location.pathname) ?? DEFAULT_SECTION_ID
}

export function navigateToSection(sectionId: string, replace = false): boolean {
  const path = getPathBySectionId(sectionId)
  if (!path || typeof window === 'undefined') {
    emitSectionChanged({ sectionId })
    return false
  }

  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }

  emitSectionChanged({ sectionId })
  return true
}

export function initSectionRouterSync(): void {
  if (typeof window === 'undefined') return

  const initialSection = resolveCurrentSectionId()
  emitSectionChanged({ sectionId: initialSection })
}
