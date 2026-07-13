import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  TrendingUp,
  BookOpen,
  PieChart,
  Calendar,
  Layers,
  ChevronDown,
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

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSemId, setSelectedSemId] = useState('')
  const [semesters, setSemesters] = useState([])

  const loadDashboard = async (semId = null) => {
    try {
      const url = semId ? `/student/dashboard?semester_id=${semId}` : '/student/dashboard'
      const response = await api.get(url)
      setDashboardData(response.data)
      if (!semId) {
        setSelectedSemId(response.data.selected_semester_id || '')
      }
    } catch (err) {
      toast.error('Failed to load dashboard statistics.')
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [profileRes, semestersRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/admin/semesters').catch(() => ({ data: [] })), // fallback if admin route fails or role limits
      ])
      setProfile(profileRes.data)
      setSemesters(semestersRes.data || [])
      await loadDashboard()
    } catch (err) {
      toast.error('Failed to load profile details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleSemesterChange = (e) => {
    const semId = e.target.value
    setSelectedSemId(semId)
    loadDashboard(semId)
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="text-slate-500 font-medium text-sm animate-pulse">Loading your profile & grades...</span>
      </div>
    )
  }

  const {
    subject_marks = [],
    cgpa_history = [],
  } = dashboardData || {}

  // Calculate stats from subject marks
  const totalObtained = subject_marks.reduce((acc, curr) => acc + curr.marks_obtained, 0)
  const totalMax = subject_marks.reduce((acc, curr) => acc + curr.max_marks, 0)
  const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100) : 0

  // Calculate Grade
  let grade = 'N/A'
  if (overallPercentage >= 90) grade = 'O (Outstanding)'
  else if (overallPercentage >= 80) grade = 'A+ (Excellent)'
  else if (overallPercentage >= 70) grade = 'A (Very Good)'
  else if (overallPercentage >= 60) grade = 'B (Good)'
  else if (overallPercentage >= 50) grade = 'C (Satisfactory)'
  else if (overallPercentage >= 40) grade = 'P (Pass)'
  else if (totalMax > 0) grade = 'F (Fail)'

  // Find SGPA and CGPA from history
  const currentSemesterNum = profile?.current_semester || 1
  const activeSemProgress = cgpa_history.find((h) => h.semester_number === currentSemesterNum) || cgpa_history[cgpa_history.length - 1]

  const currentSGPA = activeSemProgress?.sgpa ?? 'N/A'
  const currentCGPA = activeSemProgress?.cgpa ?? 'N/A'

  // Format Recharts data
  const barChartData = subject_marks.map((sm) => ({
    subject: sm.subject_code,
    Score: sm.marks_obtained,
    Max: sm.max_marks,
    Percentage: sm.percentage,
  }))

  const lineChartData = cgpa_history.map((h) => ({
    Semester: `Sem ${h.semester_number}`,
    SGPA: h.sgpa,
    CGPA: h.cgpa,
  }))

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Welcome, {profile?.name}!</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Roll No: {profile?.roll_number} | {profile?.course_name} ({profile?.department_name})</p>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center gap-2 relative">
          <Calendar className="h-4 w-4 text-slate-400" />
          <div className="relative">
            <select
              className="appearance-none rounded-xl border border-slate-200/80 bg-white pl-3.5 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 cursor-pointer font-semibold"
              value={selectedSemId}
              onChange={handleSemesterChange}
            >
              <option value="">Default Semester</option>
              {semesters
                .filter((s) => s.course_id === profile?.course_id || semesters.length > 0)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    Semester {s.number}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 grid-cols-2 md:grid-cols-5"
      >
        {[
          { label: 'Total Score', value: totalMax > 0 ? `${totalObtained}/${totalMax}` : 'N/A', icon: BookOpen, color: 'text-violet-600 bg-violet-50 border-violet-100/50' },
          { label: 'Percentage', value: totalMax > 0 ? `${overallPercentage.toFixed(2)}%` : 'N/A', icon: PieChart, color: 'text-amber-600 bg-amber-50 border-amber-100/50' },
          { label: 'Letter Grade', value: grade, icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
          { label: 'SGPA', value: currentSGPA, icon: TrendingUp, color: 'text-rose-600 bg-rose-50 border-rose-100/50' },
          { label: 'CGPA', value: currentCGPA, icon: Layers, color: 'text-sky-600 bg-sky-50 border-sky-100/50' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              variants={cardVariants}
              key={i}
              className="glass-panel p-5 flex flex-col justify-between hover:border-brand-500/20 hover:shadow-soft transition-all duration-300 bg-white/70 border-slate-200/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <span className={`rounded-xl border p-2 shrink-0 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-5">
                <span className="text-xl font-extrabold text-slate-900 heading-premium">{stat.value}</span>
              </div>
            </motion.div>
          )
        })}
      </motion.section>

      {/* Visual Analytics */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Subject wise marks */}
        <div className="glass-panel p-5 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-premium">Subject Wise Performance</h3>
              <p className="text-xs text-slate-400">Score comparison in current semester subjects.</p>
            </div>
          </div>
          <div className="h-80 w-full pt-2">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '16px',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#475569' }} />
                  <Bar dataKey="Score" fill="url(#violetGradient)" radius={[5, 5, 0, 0]} barSize={20} name="Obtained Marks" />
                  <Bar dataKey="Max" fill="#e2e8f0" radius={[5, 5, 0, 0]} barSize={20} name="Max Marks" />
                  <defs>
                    <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-medium">No subject marks recorded for this semester.</div>
            )}
          </div>
        </div>

        {/* CGPA History trend */}
        <div className="glass-panel p-5 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-rose-600">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-premium">Academic CGPA / SGPA Progression</h3>
              <p className="text-xs text-slate-400">Historical performance trend over semesters.</p>
            </div>
          </div>
          <div className="h-80 w-full pt-2">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="Semester" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                  <Line type="monotone" dataKey="SGPA" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} name="SGPA" />
                  <Line type="monotone" dataKey="CGPA" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} name="CGPA" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-medium">No calculation records found in academic history.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
