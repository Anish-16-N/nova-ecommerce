import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('nova_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('nova_token')
    if (!token) {
      setAuthLoading(false)
      return
    }
    authAPI
      .getMe()
      .then((res) => {
        setUser(res.data.user || res.data)
        localStorage.setItem('nova_user', JSON.stringify(res.data.user || res.data))
      })
      .catch(() => {
        localStorage.removeItem('nova_token')
        localStorage.removeItem('nova_user')
        setUser(null)
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const login = useCallback(
    async (credentials) => {
      setIsLoading(true)
      try {
        const res = await authAPI.login(credentials)
        const { token, user: userData } = res.data
        localStorage.setItem('nova_token', token)
        localStorage.setItem('nova_user', JSON.stringify(userData))
        setUser(userData)
        toast.success(`Welcome back, ${userData.name || userData.email}!`)
        navigate('/')
        return { success: true }
      } catch (err) {
        const message = err.response?.data?.message || 'Login failed. Please try again.'
        toast.error(message)
        return { success: false, error: message }
      } finally {
        setIsLoading(false)
      }
    },
    [navigate]
  )

  const register = useCallback(
    async (userData) => {
      setIsLoading(true)
      try {
        const res = await authAPI.register(userData)
        const { token, user: newUser } = res.data
        localStorage.setItem('nova_token', token)
        localStorage.setItem('nova_user', JSON.stringify(newUser))
        setUser(newUser)
        toast.success('Account created! Welcome to NOVA.')
        navigate('/')
        return { success: true }
      } catch (err) {
        const message = err.response?.data?.message || 'Registration failed.'
        toast.error(message)
        return { success: false, error: message }
      } finally {
        setIsLoading(false)
      }
    },
    [navigate]
  )

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('nova_token')
    localStorage.removeItem('nova_user')
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/login')
  }, [navigate])

  return { user, isLoading, authLoading, login, register, logout, isAuthenticated: !!user }
}
