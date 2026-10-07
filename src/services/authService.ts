import { dataSource } from '@/services/datasource'
import type { AuthSession, SessionUser } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function makeToken(user: SessionUser): string {
  return `local.${user.id}.${Date.now().toString(36)}`
}

export const authService = {
  async login(identifier: string, password: string): Promise<AuthSession> {
    const user = await dataSource.authenticate(identifier, password)
    const session: AuthSession = { token: makeToken(user), user, issuedAt: new Date().toISOString() }
    try {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
    } catch {
      // storage may be unavailable; session still valid for this tab
    }
    return session
  },

  getSession(): AuthSession | null {
    return readSession()
  },

  logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.session)
    } catch {
      // ignore
    }
  },
}
