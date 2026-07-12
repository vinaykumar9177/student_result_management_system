import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function StudentLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <div className="glass-panel mb-6 flex flex-wrap gap-3 p-3">
        <NavLink to="/student" end className={({ isActive }) => `rounded-2xl px-4 py-2 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
          Overview
        </NavLink>
        <NavLink to="/student/results" className={({ isActive }) => `rounded-2xl px-4 py-2 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
          Results
        </NavLink>
        <NavLink to="/student/profile" className={({ isActive }) => `rounded-2xl px-4 py-2 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
          Profile
        </NavLink>
      </div>
      <Outlet />
    </div>
  )
}
