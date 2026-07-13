import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react'

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
          <span>Back to Login</span>
        </Link>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full space-y-6 p-8 border-slate-200/60 bg-white/70 shadow-premium text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 heading-premium">Check your email</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  We've sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>. Please click the link in the email to reset your password.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="input-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full space-y-6 p-8 border-slate-200/60 bg-white/70 shadow-premium"
              onSubmit={handleSubmit}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Account Recovery</div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Forgot Password</h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Enter the email address associated with your account and we will send you a link to reset your password.
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
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <button className="btn-premium w-full shadow-lg shadow-brand-500/10 inline-flex items-center justify-center gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
