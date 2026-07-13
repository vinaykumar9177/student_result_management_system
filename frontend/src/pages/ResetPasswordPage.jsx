import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react'

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
      <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Blur Backgrounds */}
        <div className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-violet-400/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 h-72 w-72 rounded-full bg-indigo-400/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel w-full max-w-md p-8 text-center space-y-6 border-slate-200/60 bg-white/70 shadow-premium relative z-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-100">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 heading-premium">Invalid or Expired Link</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              This password reset link is invalid or has expired. Please request a new link.
            </p>
          </div>
          <button className="btn-premium w-full shadow-lg shadow-brand-500/10" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </motion.div>
      </div>
    )
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
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full space-y-6 p-8 border-slate-200/60 bg-white/70 shadow-premium text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-bounce">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 heading-premium">Success!</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Your password has been successfully reset. You are being redirected to the login page...
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full space-y-6 p-8 border-slate-200/60 bg-white/70 shadow-premium"
              onSubmit={handleSubmit}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Account Recovery</div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Reset Password</h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Please enter your email and set a strong new password for your account.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
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
                    <Lock className="h-4 w-4" />
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
                    <Lock className="h-4 w-4" />
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
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button className="btn-premium w-full shadow-lg shadow-brand-500/10 inline-flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Resetting password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 py-1 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
