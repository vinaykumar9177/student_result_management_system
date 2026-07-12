import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function FacultyLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-8">
      <div className="glass-panel mb-6 flex flex-wrap gap-3 p-3">
        <NavLink to="/teacher" end className={({ isActive }) => `rounded-2xl px-4 py-2 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
          Overview
        </NavLink>
        <NavLink to="/teacher/marks" className={({ isActive }) => `rounded-2xl px-4 py-2 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
          Marks
        </NavLink>
        <NavLink to="/teacher/students" className={({ isActive }) => `rounded-2xl px-4 py-2 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-100'}`}>
          Students
        </NavLink>
      </div>
      <Outlet />
    </div>
  )
}
