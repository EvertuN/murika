const DEFAULT_SESSION_TIMEOUT_SECONDS = 12 * 60 * 60
const SERVER_TOUCH_INTERVAL_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['click', 'keydown', 'touchstart', 'scroll']

type SessionEnvelope = {
  success?: boolean
  data?: {
    csrfToken?: string
    serverTimeNow?: number
    sessionTimeoutSeconds?: number
  }
}

export function startSessionTimer(): () => void {
  let logoutTimer: number | null = null
  let lastServerTouch = Date.now()
  let touching = false

  const scheduleLogout = () => {
    if (logoutTimer !== null) {
      window.clearTimeout(logoutTimer)
    }

    const timeoutSeconds = window.MURIKA_SESSION_TIMEOUT || DEFAULT_SESSION_TIMEOUT_SECONDS
    logoutTimer = window.setTimeout(() => {
      window.location.assign('/logout?msg=expirou')
    }, timeoutSeconds * 1000)
  }

  const touchServerSession = async () => {
    if (touching || Date.now() - lastServerTouch < SERVER_TOUCH_INTERVAL_MS) return
    touching = true
    try {
      const response = await fetch('/api/auth_session', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      })
      if (!response.ok) {
        window.location.assign('/login?msg=expirou')
        return
      }

      const payload = await response.json() as SessionEnvelope
      if (payload.data?.csrfToken) window.MURIKA_CSRF_TOKEN = payload.data.csrfToken
      if (payload.data?.serverTimeNow) window.SERVER_TIME_NOW = payload.data.serverTimeNow
      if (payload.data?.sessionTimeoutSeconds) {
        window.MURIKA_SESSION_TIMEOUT = payload.data.sessionTimeoutSeconds
      }
      lastServerTouch = Date.now()
    } finally {
      touching = false
    }
  }

  const onActivity = () => {
    scheduleLogout()
    void touchServerSession()
  }

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, onActivity, { passive: true })
  })
  scheduleLogout()

  return () => {
    if (logoutTimer !== null) window.clearTimeout(logoutTimer)
    ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, onActivity))
  }
}
