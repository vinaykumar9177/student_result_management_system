import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
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
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="text-slate-500 font-medium text-sm animate-pulse">Loading real-time analytics...</span>
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
    { label: 'Students', value: students_count, icon: Users, color: 'text-violet-600 bg-violet-50 border-violet-100/50' },
    { label: 'Departments', value: departments_count, icon: Layers, color: 'text-amber-600 bg-amber-50 border-amber-100/50' },
    { label: 'Courses/Branches', value: courses_count, icon: FolderKanban, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
    { label: 'Subjects', value: subjects_count, icon: BookOpen, color: 'text-sky-600 bg-sky-50 border-sky-100/50' },
    { label: 'Calculated Results', value: results_count, icon: Award, color: 'text-rose-600 bg-rose-50 border-rose-100/50' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">System Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time metrics, academic performance analytics, and student result trends.</p>
      </div>

      {/* Stats Cards */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 grid-cols-2 md:grid-cols-5"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              variants={cardVariants}
              key={stat.label}
              className="glass-panel p-5 flex flex-col justify-between hover:border-brand-500/20 hover:shadow-soft transition-all duration-300 bg-white/70 border-slate-200/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <span className={`rounded-xl border p-2 shrink-0 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-5">
                <span className="text-2xl font-extrabold text-slate-950 heading-premium select-all">{stat.value.toLocaleString()}</span>
              </div>
            </motion.div>
          )
        })}
      </motion.section>

      {/* Visual Charts */}
      {chartData.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* SGPA Performance Bar Chart */}
          <div className="glass-panel p-5 space-y-5 bg-white/70 border-slate-200/50">
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-violet-100 bg-violet-50 p-2 text-violet-600">
                <BarChart2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-800 heading-premium">Average SGPA by Branch & Semester</h3>
                <p className="text-xs text-slate-400">Mean SGPA calculated across active result records.</p>
              </div>
            </div>
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(139, 92, 246, 0.03)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#475569' }} />
                  <Bar dataKey="SGPA" fill="url(#violetGradient)" radius={[6, 6, 0, 0]} barSize={24} />
                  <defs>
                    <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pass Percentage Trend Line Chart */}
          <div className="glass-panel p-5 space-y-5 bg-white/70 border-slate-200/50">
            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-rose-600">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-800 heading-premium">Average Score % by Branch & Semester</h3>
                <p className="text-xs text-slate-400">Aggregated percentage score trend.</p>
              </div>
            </div>
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#475569' }} />
                  <Line type="monotone" dataKey="Percentage" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      ) : (
        <div className="glass-panel p-12 text-center border-slate-200/50 bg-white/70 space-y-3">
          <p className="font-semibold text-slate-700 text-sm">No calculation data available yet.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Publish results in the Marks page to visualize performance metrics and line/bar graphs here.
          </p>
        </div>
      )}
    </div>
  )
}
