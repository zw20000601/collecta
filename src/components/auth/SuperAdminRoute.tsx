import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import PageLoader from '../ui/PageLoader'

export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user || !isAdmin) return <Navigate to="/" replace />
  if (!isSuperAdmin) return <Navigate to="/admin/resources" replace />

  return <>{children}</>
}

