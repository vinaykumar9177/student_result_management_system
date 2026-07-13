import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)

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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-violet-400/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-72 w-72 rounded-full bg-indigo-400/5 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to portal choice</span>
        </Link>

        <form className="glass-panel w-full space-y-6 p-8 border-slate-200/60 bg-white/70 shadow-premium" onSubmit={submit}>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Student Result System</div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">{heading} Sign in</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Access the {heading.toLowerCase()} dashboard. Please check your credentials carefully.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
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
                <Lock className="h-4 w-4" />
              </span>
              <input
                className="input-premium pl-11 pr-11"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 border border-slate-100 rounded-lg px-2.5 py-1 bg-slate-50/50 font-medium">
              Role: <span className="font-semibold text-slate-700">{heading}</span>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {error ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium"
            >
              {error}
            </motion.div>
          ) : null}

          <button className="btn-premium w-full shadow-lg shadow-brand-500/10 inline-flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login as {heading}</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
