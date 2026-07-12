import React from 'react'
import { Link } from 'react-router-dom'

const loginCards = [
  {
    role: 'student',
    title: 'Student Login',
    description: 'View results, profile details, and notices.',
    to: '/login/student',
  },
  {
    role: 'teacher',
    title: 'Teacher Login',
    description: 'Enter marks and manage assigned students.',
    to: '/login/teacher',
  },
  {
    role: 'admin',
    title: 'Admin Login',
    description: 'Manage users, departments, logs, and analytics.',
    to: '/login/admin',
  },
]

export default function LoginHub() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-panel w-full max-w-5xl p-8 md:p-10">
        <div className="max-w-2xl">
          <div className="text-sm uppercase tracking-[0.3em] text-brand-700">Student Result System</div>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Choose your login</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">Pick the portal that matches your role. Each login keeps the dashboards separate for students, teachers, and admins.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {loginCards.map((card) => (
            <Link
              key={card.role}
              to={card.to}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
            >
              <div className="text-xs uppercase tracking-[0.28em] text-brand-700">{card.role}</div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              <div className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Continue</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}