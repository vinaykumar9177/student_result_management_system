import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import toast from 'react-hot-toast'
import { Lock, Mail, ShieldAlert, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset link. Token is missing.')
      toast.error('Token is missing.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token: token,
        new_password: newPassword,
      })
      toast.success('Password reset successfully!')
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to reset password. The link may have expired.'
      setError(detail)
      toast.error('Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
          <h2 className="text-xl font-bold">Invalid or Expired Link</h2>
          <p className="text-sm text-slate-500">
            This password reset link is invalid or has expired. Please request a new link.
          </p>
          <button className="btn-premium w-full" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md animate-slide-up">
        {success ? (
          <div className="glass-panel w-full space-y-6 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Success!</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Your password has been successfully reset. You are being redirected to the login page...
              </p>
            </div>
          </div>
        ) : (
          <form className="glass-panel w-full space-y-5 p-8" onSubmit={handleSubmit}>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Account Recovery</div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Reset Password</h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Please enter your email and set a strong new password for your account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  className="input-premium pl-11"
                  placeholder="Verify Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  className="input-premium pl-11"
                  placeholder="New Password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  className="input-premium pl-11"
                  placeholder="Confirm New Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button className="btn-premium w-full shadow-lg shadow-brand-500/10" disabled={loading}>
                {loading ? 'Resetting password...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 transition"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
