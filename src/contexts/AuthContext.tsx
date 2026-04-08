import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  login: (email: string, password: string) => Promise<{ error: Error | null }>
  register: (email: string, password: string) => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  loginAsGuest: () => void
  isGuest: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  const normalizeEmail = (email?: string | null) => (email || '').trim().toLowerCase()
  const getSuperAdminEmail = () =>
    normalizeEmail(import.meta.env.VITE_SUPER_ADMIN_EMAIL || import.meta.env.VITE_ADMIN_EMAIL)

  const isUserBanned = async (userId?: string) => {
    if (!userId) return false

    const { data, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[auth] Failed to read profile status:', error.message)
      return false
    }

    return data?.status === 'banned'
  }

  const promoteConfiguredAdmin = async (currentSession: Session) => {
    const configuredAdminEmail = getSuperAdminEmail()
    const currentEmail = normalizeEmail(currentSession.user?.email)

    if (!configuredAdminEmail || !currentEmail || configuredAdminEmail !== currentEmail) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin', email: currentSession.user.email || null })
      .eq('id', currentSession.user.id)

    if (error) {
      console.warn('[auth] Failed to sync admin role from configured admin email:', error.message)
    }
  }

  const checkAdmin = async (currentSession: Session) => {
    await promoteConfiguredAdmin(currentSession)

    const configuredAdminEmail = getSuperAdminEmail()
    const currentEmail = normalizeEmail(currentSession.user?.email)

    const [{ data: rpcIsAdmin }, { data: profile }] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase
      .from('profiles')
      .select('role')
      .eq('id', currentSession.user.id)
      .maybeSingle(),
    ])

    const profileRole = profile?.role
    const jwtRole = currentSession.user?.app_metadata?.role

    const adminByRpc = Boolean(rpcIsAdmin)
    const adminByProfile = profileRole === 'admin'
    const adminByJwt = jwtRole === 'admin'
    const adminByEmail = Boolean(configuredAdminEmail && currentEmail && configuredAdminEmail === currentEmail)
    const superAdminByEmail = Boolean(configuredAdminEmail && currentEmail && configuredAdminEmail === currentEmail)

    setIsAdmin(adminByRpc || adminByProfile || adminByJwt || adminByEmail)
    setIsSuperAdmin(superAdminByEmail)
  }

  useEffect(() => {
    let mounted = true

    const syncSession = async (currentSession: Session | null) => {
      if (!mounted) return

      // If account is banned after login, force sign-out on next session sync.
      if (currentSession?.user) {
        const banned = await isUserBanned(currentSession.user.id)
        if (banned) {
          await supabase.auth.signOut()
          if (!mounted) return
          setSession(null)
          setUser(null)
          setIsAdmin(false)
          setIsSuperAdmin(false)
          setIsGuest(false)
          setLoading(false)
          return
        }
      }

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        await checkAdmin(currentSession)
        if (mounted) setIsGuest(false)
      } else {
        setIsAdmin(false)
        setIsSuperAdmin(false)
      }

      if (mounted) setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      void syncSession(currentSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error as Error | null }
    }

    const userId = data?.user?.id
    const banned = await isUserBanned(userId)

    if (banned) {
      await supabase.auth.signOut()
      return { error: new Error('该账号已被禁用，请联系管理员') }
    }

    return { error: null }
  }

  const register = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error as Error | null }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsGuest(false)
  }

  const loginAsGuest = () => {
    setIsGuest(true)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isSuperAdmin, login, register, logout, loginAsGuest, isGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
