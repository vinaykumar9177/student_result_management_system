import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, CheckCircle, ShieldAlert } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      toast.success('Reset email sent successfully!')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to send password reset request.'
      setError(detail)
      toast.error('Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md animate-slide-up">
        {/* Back link */}
        <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {submitted ? (
          <div className="glass-panel w-full space-y-6 p-8 mt-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Check your email</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                We've sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>. Please click the link in the email to reset your password.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition"
              >
                Didn't receive the email? Try again
              </button>
            </div>
          </div>
        ) : (
          <form className="glass-panel w-full space-y-5 p-8 mt-2" onSubmit={handleSubmit}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Account Recovery</div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Forgot Password</h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Enter the email address associated with your account and we will send you a link to reset your password.
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
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <button className="btn-premium w-full shadow-lg shadow-brand-500/10" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
