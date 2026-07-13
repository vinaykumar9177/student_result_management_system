import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, LogOut, LayoutDashboard, FileSpreadsheet, Users, Terminal, Layers, GraduationCap, BookOpen, Calendar, FileText } from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/marks', label: 'Marks', icon: FileSpreadsheet },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/departments', label: 'Departments', icon: Layers },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/admin/semesters', label: 'Semesters', icon: Calendar },
  { to: '/admin/exams', label: 'Exams', icon: FileText },
  { to: '/admin/logs', label: 'Logs', icon: Terminal },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      {/* Mobile Top Navbar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 p-4 backdrop-blur md:hidden">
        <div className="text-lg font-semibold text-slate-800">Admin Console</div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 transition"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl gap-6 p-4 md:min-h-screen md:p-8">
        {/* Desktop Sidebar */}
        <aside className="glass-panel hidden w-64 flex-col justify-between p-5 md:flex">
          <div>
            <div className="mb-8 text-xl font-bold tracking-tight text-slate-800">Admin Console</div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
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
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <aside className="fixed bottom-0 top-0 left-0 z-50 flex w-72 flex-col justify-between bg-white p-6 shadow-2xl animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="text-xl font-bold tracking-tight text-slate-800">Admin Console</div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 transition"
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
                          `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                            isActive
                              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
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
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </aside>
          </div>
        )}

        <main className="flex-1 space-y-6 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
