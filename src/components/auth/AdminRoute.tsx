import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import PageLoader from '../ui/PageLoader'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user || !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
