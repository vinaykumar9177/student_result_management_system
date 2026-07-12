import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/faculty', label: 'Faculty' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/logs', label: 'Logs' },
]

export default function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-4 md:p-8">
        <aside className="glass-panel hidden w-64 flex-col justify-between p-5 md:flex">
          <div>
            <div className="mb-8 text-xl font-semibold">Admin Console</div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 transition ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-slate-100'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button className="rounded-2xl bg-slate-900 px-4 py-3 text-white" onClick={logout}>
            Sign out
          </button>
        </aside>
        <main className="flex-1 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
