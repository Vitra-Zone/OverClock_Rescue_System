import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTouristAuth } from './TouristAuthContext'

interface ProtectedTouristRouteProps {
  children: React.ReactNode
}

export function ProtectedTouristRoute({ children }: ProtectedTouristRouteProps) {
  const { user, loading } = useTouristAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
