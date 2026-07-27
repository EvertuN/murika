import type { AuthBootstrapPayload, AuthenticatedUser, SessionStatus } from '@/modules/auth/types/auth'

declare global {
  interface Window {
    MURIKA_IS_ADMIN?: boolean
    SERVER_TIME_NOW?: number
    MURIKA_APP_TIMEZONE?: string
    MURIKA_AUTH_STATUS?: SessionStatus
    MURIKA_AUTH_USER?: Partial<AuthenticatedUser> | null
    MURIKA_AUTH_BOOTSTRAP?: AuthBootstrapPayload
    MURIKA_CSRF_TOKEN?: string
    MURIKA_SESSION_TIMEOUT?: number
    MURIKA_LOGIN_MESSAGE?: string | null
    MURIKA_LOGIN_ERROR?: string | null
    MURIKA_BASE_URL?: string
    MURIKA_PAGE_MODE?: 'login' | 'app' | 'password-change'
    TableToCards?: {
      updateTable: (tableElement: HTMLTableElement) => void
      updateAllTables: () => void
    }
  }
}

export {}
