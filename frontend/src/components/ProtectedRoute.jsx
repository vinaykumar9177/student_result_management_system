import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const loginPathByRole = {
  admin: '/login/admin',
  faculty: '/login/teacher',
  student: '/login/student',
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="p-8 text-slate-600">Loading session...</div>
  }

  if (!user) {
    const loginPath = allowedRoles?.length ? loginPathByRole[allowedRoles[0]] || '/login' : '/login'
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }

  return children
}
