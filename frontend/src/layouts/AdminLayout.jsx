import React, { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, LayoutDashboard, FileSpreadsheet, Users, Layers, GraduationCap, BookOpen, Calendar, FileText } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/marks', label: 'Marks', icon: FileSpreadsheet },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/departments', label: 'Departments', icon: Layers },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/admin/semesters', label: 'Semesters', icon: Calendar },
  { to: '/admin/exams', label: 'Exams', icon: FileText },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen text-slate-900 bg-transparent flex flex-col font-sans">
      {/* Mobile Top Navbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/60 bg-white/70 p-4 backdrop-blur-md md:hidden">
        <div className="text-lg font-bold tracking-tight text-slate-800 heading-premium flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-sm flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white">A</span>
          </span>
          Admin Console
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-4 md:p-8">
        {/* Desktop Sidebar */}
        <aside className="glass-panel hidden w-64 flex-col justify-between p-5 md:flex sticky top-8 h-[calc(100vh-64px)] border-slate-200/50 bg-white/70">
          <div>
            <div className="mb-8 text-xl font-extrabold tracking-tight text-slate-800 heading-premium flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md flex items-center justify-center">
                <span className="text-xs font-black text-white">A</span>
              </span>
              Admin Console
            </div>
            <nav className="space-y-1 relative">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin/')
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all relative group overflow-hidden"
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500 shadow-md shadow-brand-500/10"
                            style={{ borderRadius: 12 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Icon className={`h-4 w-4 relative z-10 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                        <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-900 active:scale-[0.98] shadow-sm hover:shadow"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 top-0 left-0 z-50 flex w-72 flex-col justify-between bg-white/95 p-6 shadow-2xl backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-xl font-bold tracking-tight text-slate-800 heading-premium flex items-center gap-2.5">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow flex items-center justify-center">
                        <span className="text-xs font-bold text-white">A</span>
                      </span>
                      Admin Console
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to === '/admin'}
                          onClick={() => setIsOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/10'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </NavLink>
                      )
                    })}
                  </nav>
                </div>
                <button
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-900 active:scale-[0.98]"
                  onClick={() => {
                    setIsOpen(false)
                    logout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 overflow-hidden md:pl-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
