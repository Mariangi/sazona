import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { UserResponse } from '@sasona/shared'
import { api } from '../api/client'
import { getToken, clearToken } from '../api/storage'

interface AuthContextType {
  user: UserResponse | null
  loading: boolean
  setUser: (user: UserResponse | null) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getToken().then((token) => {
      if (!token) {
        setLoading(false)
        return
      }
      api.me()
        .then(setUser)
        .catch(() => {
          clearToken()
          setUser(null)
        })
        .finally(() => setLoading(false))
    })
  }, [])

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
