import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

export default function StudentLayout() {
  const { logout } = useAuth()

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <div className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex flex-wrap gap-2">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/student/results"
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Results
          </NavLink>
          <NavLink
            to="/student/profile"
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Profile
          </NavLink>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
      <Outlet />
    </div>
  )
}
