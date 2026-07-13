import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react'

const loginCards = [
  {
    role: 'student',
    title: 'Student Portal',
    description: 'Access your academic transcripts, performance trends, and manage your student profile details.',
    to: '/login/student',
    icon: GraduationCap,
    gradient: 'from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20',
    iconColor: 'text-blue-600',
    badge: 'Student Access',
  },
  {
    role: 'admin',
    title: 'Administrator Portal',
    description: 'Manage students, input grades, review operational audits, and view system metrics.',
    to: '/login/admin',
    icon: ShieldCheck,
    gradient: 'from-slate-900/5 to-slate-800/10 hover:from-slate-950/10 hover:to-slate-800/15',
    iconColor: 'text-slate-800',
    badge: 'Staff Access',
  },
]

export default function LoginHub() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="glass-panel w-full max-w-4xl p-8 md:p-12 animate-slide-up">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-brand-700">Academic Hub</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Student Result System
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 md:text-base">
            Welcome to the unified educational management platform. Please select the portal corresponding to your role to authenticate securely.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {loginCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.role}
                to={card.to}
                className={`group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-200/80 hover:shadow-md`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {card.badge}
                    </span>
                  </div>
                  <div className={`mt-6 inline-flex rounded-xl p-3 bg-gradient-to-br ${card.gradient} transition-colors`}>
                    <Icon className={`h-8 w-8 ${card.iconColor}`} />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{card.description}</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-700 group-hover:text-brand-800">
                  <span>Proceed to login</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}