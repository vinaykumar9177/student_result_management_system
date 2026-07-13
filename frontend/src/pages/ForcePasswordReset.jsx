import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Lock, ShieldAlert, Loader2 } from 'lucide-react'

export default function ForcePasswordReset() {
  const { user, updateMustResetPassword, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 border border-rose-100 shadow-sm">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 heading-premium">Access Denied</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">You must be logged in to reset your password.</p>
          </div>
          <button className="btn-premium w-full shadow-lg shadow-brand-500/10" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </motion.div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Password updated successfully!')
      updateMustResetPassword(false)
      const destination = user.role === 'student' ? '/student' : '/admin'
      navigate(destination)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to change password. Please check your current password.'
      setError(detail)
      toast.error('Failed to change password.')
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
        <form className="glass-panel w-full space-y-6 p-8 border-slate-200/60 bg-white/70 shadow-premium" onSubmit={handleSubmit}>
          <div>
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Forced Password Change Required</span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 heading-premium">Choose a new password</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              For security reasons, you must update your temporary password before you can access the platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                className="input-premium pl-11"
                placeholder="Current / Temporary Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password & Continue</span>
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 py-1 transition-colors"
            >
              Cancel and Logout
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
