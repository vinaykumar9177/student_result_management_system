import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleConfig = {
  student: { label: 'Student', backendRole: 'student', dashboardPath: '/student' },
  teacher: { label: 'Teacher', backendRole: 'faculty', dashboardPath: '/teacher' },
  admin: { label: 'Admin', backendRole: 'admin', dashboardPath: '/admin' },
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { role } = useParams()
  const selectedRole = roleConfig[role]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const heading = useMemo(() => selectedRole?.label ?? 'Student', [selectedRole])

  if (!selectedRole) {
    return <Navigate to="/login" replace />
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const tokenPair = await login(email, password, selectedRole.backendRole)
      const destination = tokenPair.role === 'faculty' ? '/teacher' : `/${tokenPair.role || selectedRole.dashboardPath.replace('/', '')}`
      navigate(destination)
    } catch {
      setError(`Invalid ${heading.toLowerCase()} credentials`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="glass-panel w-full max-w-md space-y-5 p-8" onSubmit={submit}>
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-brand-700">Student Result System</div>
          <h1 className="mt-3 text-3xl font-semibold">{heading} Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use your {heading.toLowerCase()} account to access the matching dashboard.</p>
        </div>
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Role: <span className="font-medium text-slate-900">{heading}</span></div>
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white">Login as {heading}</button>
      </form>
    </div>
  )
}
