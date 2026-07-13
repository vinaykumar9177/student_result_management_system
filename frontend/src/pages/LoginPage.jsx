import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, Lock } from 'lucide-react'

const roleConfig = {
  student: { label: 'Student', backendRole: 'student', dashboardPath: '/student' },
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
  const [loading, setLoading] = useState(false)

  const heading = useMemo(() => selectedRole?.label ?? 'Student', [selectedRole])

  if (!selectedRole) {
    return <Navigate to="/login" replace />
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password, selectedRole.backendRole)
      if (result.user.must_reset_password) {
        toast.error('First-time login: Password reset required.', { duration: 5000 })
        navigate('/force-password-reset')
      } else {
        toast.success(`Welcome back, ${result.user.name || heading}!`)
        navigate(selectedRole.dashboardPath)
      }
    } catch (loginError) {
      setError(loginError.message === 'Role mismatch' ? `Use the correct ${heading.toLowerCase()} portal` : 'Invalid credentials')
      toast.error('Login failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password handler removed, we now link directly to /forgot-password

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md animate-slide-up">
        {/* Back link */}
        <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="h-4 w-4" />
          Back to portal choice
        </Link>

        <form className="glass-panel w-full space-y-5 p-8 mt-2" onSubmit={submit}>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Student Result System</div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{heading} Sign in</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Access the {heading.toLowerCase()} dashboard. Please check your credentials carefully.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                className="input-premium pl-11"
                placeholder="Email Address"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                className="input-premium pl-11"
                placeholder="Password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
              Role: <span className="font-semibold text-slate-800">{heading}</span>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-brand-700 hover:text-brand-800 transition"
            >
              Forgot Password?
            </Link>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          ) : null}

          <button className="btn-premium w-full shadow-lg shadow-brand-500/10" disabled={loading}>
            {loading ? 'Authenticating...' : `Login as ${heading}`}
          </button>
        </form>
      </div>
    </div>
  )
}
