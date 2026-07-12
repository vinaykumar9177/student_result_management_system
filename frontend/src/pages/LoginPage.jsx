import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const tokenPair = await login(email, password)
      navigate(`/${tokenPair.role || 'student'}`)
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="glass-panel w-full max-w-md space-y-5 p-8" onSubmit={submit}>
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-brand-700">Student Result System</div>
          <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Access admin, faculty, or student dashboards with role-based routing.</p>
        </div>
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white">Login</button>
      </form>
    </div>
  )
}
