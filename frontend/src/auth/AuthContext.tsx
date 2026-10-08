import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser } from '../api/client'

const STORAGE_KEY = 'campus-customs-user'

interface AuthContextValue {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Note: this only tracks "who's logged in" for the UI (nav bar greeting,
// showing Log Out instead of Log In). It is NOT a secure session — there's
// no server-issued token, just the public user fields saved to
// localStorage after a successful /api/auth/login or /api/auth/signup call.
// See output/harness.md for what this does and doesn't protect against.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  function setUser(next: AuthUser | null) {
    setUserState(next)
  }

  function logout() {
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}
