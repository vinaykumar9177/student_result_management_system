import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import {
  Users,
  BookOpen,
  Award,
  Layers,
  FolderKanban,
  TrendingUp,
  BarChart2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics')
        setData(response.data)
      } catch (err) {
        toast.error('Failed to load dashboard analytics.')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="ml-3 text-slate-500 font-medium">Loading statistics...</span>
      </div>
    )
  }

  const {
    students_count = 0,
    courses_count = 0,
    subjects_count = 0,
    departments_count = 0,
    results_count = 0,
    performance_by_branch_semester = [],
  } = data || {}

  // Format performance data for chart
  const chartData = performance_by_branch_semester.map((metric) => ({
    name: `${metric.course_name} (S${metric.semester_number})`,
    SGPA: metric.avg_sgpa,
    Percentage: metric.avg_percentage,
    ResultsCount: metric.result_count,
  }))

  const stats = [
    { label: 'Students', value: students_count, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Departments', value: departments_count, icon: Layers, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: 'Courses/Branches', value: courses_count, icon: FolderKanban, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Subjects', value: subjects_count, icon: BookOpen, color: 'text-sky-600 bg-sky-50 border-sky-100' },
    { label: 'Calculated Results', value: results_count, icon: Award, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time metrics, analytics, and student result trends.</p>
      </div>

      {/* Stats Cards */}
      <section className="grid gap-5 grid-cols-2 md:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <span className={`rounded-xl border p-2 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-slate-800">{stat.value.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* Visual Charts */}
      {chartData.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2">
          {/* SGPA Performance Bar Chart */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
                <BarChart2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-800">Average SGPA by Branch & Semester</h3>
                <p className="text-xs text-slate-400">Mean SGPA calculated across active result records.</p>
              </div>
            </div>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="SGPA" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pass Percentage Trend Line Chart */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-xl border p-2 text-rose-600 bg-rose-50 border-rose-100">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-800">Average Score % by Branch & Semester</h3>
                <p className="text-xs text-slate-400">Aggregated percentage score trend.</p>
              </div>
            </div>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="Percentage" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : (
        <div className="glass-panel p-10 text-center text-slate-400 space-y-2">
          <p className="font-semibold text-slate-600">No calculation data available yet.</p>
          <p className="text-xs">Publish results in the Marks page to visualize performance analytics here.</p>
        </div>
      )}
    </div>
  )
}
