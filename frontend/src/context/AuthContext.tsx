import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

export interface User {
  id: string
  name: string
  email: string
  role: 'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'ASSET_MANAGER' | 'ADMIN'
  departmentId?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // On mount, load token and user from localStorage, and verify with /auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('assetflow_token')
      const storedUser = localStorage.getItem('assetflow_user')

      if (storedToken) {
        setToken(storedToken)
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch {
            setUser(null)
          }
        }

        try {
          // Verify token against current /auth/me endpoint
          const response = await api.get('/auth/me')
          const userData = response.data?.data
          if (userData) {
            setUser(userData)
            localStorage.setItem('assetflow_user', JSON.stringify(userData))
          }
        } catch (error) {
          console.error('Failed to verify token on startup:', error)
          // Clean up if invalid
          localStorage.removeItem('assetflow_token')
          localStorage.removeItem('assetflow_user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const getApprovals = (): any[] => {
    const data = localStorage.getItem('assetflow_approvals')
    if (!data) {
      const initialSeed = [
        {
          id: 'app-1',
          name: 'Arjun Mehta',
          email: 'arjun.mehta@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        },
        {
          id: 'app-2',
          name: 'Sara Khan',
          email: 'sara.khan@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        },
        {
          id: 'app-3',
          name: 'Rohan Sharma',
          email: 'rohan.sharma@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'APPROVED'
        },
        {
          id: 'app-4',
          name: 'Neha Gupta',
          email: 'neha.gupta@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'REJECTED'
        }
      ]
      localStorage.setItem('assetflow_approvals', JSON.stringify(initialSeed))
      return initialSeed
    }
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  const getUserApprovalStatus = (email: string): 'PENDING' | 'APPROVED' | 'REJECTED' => {
    const list = getApprovals()
    const found = list.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!found) {
      return 'APPROVED'
    }
    return found.status
  }

  const addUserToApprovals = (name: string, email: string) => {
    const list = getApprovals()
    const exists = list.some((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!exists) {
      const newUser = {
        id: 'app-' + Math.random().toString(36).substring(2, 9),
        name,
        email,
        role: 'EMPLOYEE',
        createdAt: new Date().toISOString(),
        status: 'PENDING'
      }
      list.unshift(newUser)
      localStorage.setItem('assetflow_approvals', JSON.stringify(list))
    }
  }

  const login = async (email: string, password: string): Promise<User> => {
    // Intercept with approvals check
    const status = getUserApprovalStatus(email)
    if (status === 'PENDING') {
      throw new Error('AWAITING_APPROVAL')
    }
    if (status === 'REJECTED') {
      throw new Error('REJECTED')
    }

    try {
      const response = await api.post('/auth/login', { email, password })
      // Response shape: { data: { token: "...", user: { ... } } }
      const authData = response.data?.data
      if (authData && authData.token && authData.user) {
        setToken(authData.token)
        setUser(authData.user)
        localStorage.setItem('assetflow_token', authData.token)
        localStorage.setItem('assetflow_user', JSON.stringify(authData.user))
        return authData.user
      } else {
        throw new Error('Invalid login response structure')
      }
    } catch (error) {
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      await api.post('/auth/signup', { name, email, password })
      // Record user request status to Pending Approvals queue
      addUserToApprovals(name, email)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('assetflow_token')
    localStorage.removeItem('assetflow_user')
  }

  const forgotPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email })
    } catch (error) {
      throw error
    }
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        signup,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
