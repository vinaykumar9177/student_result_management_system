import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Mail, ShieldAlert, Award, FileText, Loader2 } from 'lucide-react'

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const response = await api.get('/student/profile')
      setProfile(response.data)
    } catch (err) {
      toast.error('Failed to load profile details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setFormError('')

    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to update password. Please check your credentials.')
      toast.error('Failed to change password.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="text-slate-500 font-medium text-sm animate-pulse">Loading profile details...</span>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">My Profile</h1>
        <p className="text-sm text-slate-500">View registered academic details and manage security settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-2 glass-panel p-6 space-y-6 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 shadow-sm shrink-0">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 heading-premium">{profile?.name}</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Official Registered Student Record</p>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 pt-6 border-t border-slate-100"
          >
            {[
              { label: 'Roll Number', value: profile?.roll_number, icon: FileText },
              { label: 'Email Address', value: profile?.email, icon: Mail },
              { label: 'Academic Program', value: profile?.course_name, icon: Award },
              { label: 'Department / Branch', value: `${profile?.department_code} - ${profile?.department_name}`, icon: ShieldAlert },
              { label: 'Current Semester', value: `Semester ${profile?.current_semester}`, icon: Award },
              { label: 'Program Duration', value: `${profile?.course_duration} Years`, icon: FileText },
            ].map((field, i) => {
              const Icon = field.icon
              return (
                <motion.div
                  variants={fieldVariants}
                  key={i}
                  className="flex items-start gap-3 bg-white/50 border border-slate-200/40 rounded-xl p-3.5 hover:border-slate-200 hover:shadow-soft transition-all duration-300"
                >
                  <span className="rounded-lg p-2 bg-slate-50 text-slate-400 border border-slate-100 shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{field.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{field.value}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Change Password Form */}
        <div className="glass-panel p-6 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              <Lock className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-800 heading-premium">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Current Password</label>
              <input
                required
                type="password"
                className="input-premium"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">New Password</label>
              <input
                required
                type="password"
                className="input-premium"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Confirm New Password</label>
              <input
                required
                type="password"
                className="input-premium"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-[11px] text-red-750 font-medium leading-relaxed"
                >
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={submitting} className="btn-premium w-full mt-2 shadow-sm inline-flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
