import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, LayoutDashboard, FileSpreadsheet, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function StudentLayout() {
  const { logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/student/results', label: 'Results', icon: FileSpreadsheet, end: false },
    { to: '/student/profile', label: 'Profile', icon: User, end: false },
  ]

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-4 md:p-8 flex flex-col font-sans">
      {/* Student Portal Header Panel */}
      <header className="glass-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-4 border-slate-200/50 bg-white/75 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white">SP</span>
          </span>
          <span className="text-base font-bold text-slate-800 heading-premium tracking-tight">Student Portal</span>
        </div>

        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1.5 relative">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.end 
                ? location.pathname === item.to || location.pathname === `${item.to}/` 
                : location.pathname.startsWith(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all relative overflow-hidden group"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="student-active-pill"
                          className="absolute inset-0 bg-brand-50"
                          style={{ borderRadius: 12 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className={`h-4 w-4 relative z-10 transition-colors duration-200 ${isActive ? 'text-brand-600' : 'text-slate-500 group-hover:text-slate-900'}`} />
                      <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-brand-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-sm hover:shadow"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      {/* Animate Page transitions inside layout */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
