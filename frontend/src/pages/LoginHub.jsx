import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const loginCards = [
  {
    role: 'student',
    title: 'Student Portal',
    description: 'Access your academic transcripts, performance trends, and manage your student profile details.',
    to: '/login/student',
    icon: GraduationCap,
    gradient: 'from-violet-500/10 to-indigo-500/10 group-hover:from-violet-500/20 group-hover:to-indigo-500/20',
    iconColor: 'text-violet-600',
    badge: 'Student Access',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    role: 'admin',
    title: 'Administrator Portal',
    description: 'Manage students, input grades, review operational audits, and view system metrics.',
    to: '/login/admin',
    icon: ShieldCheck,
    gradient: 'from-slate-900/5 to-slate-800/10 group-hover:from-slate-900/10 group-hover:to-slate-800/15',
    iconColor: 'text-slate-800',
    badge: 'Staff Access',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/50',
  },
]

export default function LoginHub() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel w-full max-w-4xl p-8 md:p-12 border-slate-200/60 bg-white/70 shadow-premium"
      >
        <div className="max-w-2xl">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-brand-600">
            Unified Portal
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl heading-premium">
            Academic Performance Hub
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 md:text-base">
            Welcome to the unified student result management system. Please select the portal corresponding to your role to authenticate securely and view or manage results.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {loginCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * (idx + 1) }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={card.to}
                  className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-sm transition-all hover:border-brand-500/20 hover:shadow-soft"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${card.badgeClass}`}>
                        {card.badge}
                      </span>
                    </div>
                    <div className={`mt-6 inline-flex rounded-xl p-3 bg-gradient-to-br ${card.gradient} transition-all duration-300`}>
                      <Icon className={`h-8 w-8 ${card.iconColor}`} />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors heading-premium">
                      {card.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{card.description}</p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-600 group-hover:text-brand-700">
                    <span>Proceed to login</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}