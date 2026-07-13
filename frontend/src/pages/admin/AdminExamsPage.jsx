import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Edit2, Trash2, Calendar, RefreshCw, X } from 'lucide-react'

const emptyForm = {
  subject_id: '',
  semester_id: '',
  exam_type: 'final',
  exam_date: '',
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [form, setForm] = useState(emptyForm)
  const [editExam, setEditExam] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [examsRes, subjectsRes, semestersRes] = await Promise.all([
        api.get('/admin/examinations'),
        api.get('/admin/subjects'),
        api.get('/admin/semesters'),
      ])
      setExams(examsRes.data)
      setSubjects(subjectsRes.data)
      setSemesters(semestersRes.data)
    } catch (err) {
      toast.error('Failed to load exams data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const subjectMap = useMemo(() => {
    return Object.fromEntries(subjects.map((s) => [s.id, `${s.code} - ${s.name}`]))
  }, [subjects])

  const semesterMap = useMemo(() => {
    return Object.fromEntries(semesters.map((sem) => [sem.id, `Sem ${sem.number} (Course #${sem.course_id})`]))
  }, [semesters])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/examinations', {
        subject_id: Number(form.subject_id),
        semester_id: Number(form.semester_id),
        exam_type: form.exam_type,
        exam_date: form.exam_date,
      })
      toast.success('Exam created successfully!')
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create exam.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/examinations/${editExam.id}`, {
        subject_id: Number(editExam.subject_id),
        semester_id: Number(editExam.semester_id),
        exam_type: editExam.exam_type,
        exam_date: editExam.exam_date,
      })
      toast.success('Exam updated successfully!')
      setEditExam(null)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update exam.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return
    try {
      await api.delete(`/admin/examinations/${id}`)
      toast.success('Exam deleted successfully.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete exam.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Examinations</h1>
          <p className="text-sm text-slate-500">Configure examination schedules, types, and associate them with semester courses.</p>
        </div>
        <button
          onClick={loadData}
          className="btn-premium-secondary inline-flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Add Exam Form */}
        <div className="glass-panel p-6 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              <PlusCircle className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-800 heading-premium">Add Exam</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Subject</label>
              <select
                required
                className="input-premium bg-white"
                value={form.subject_id}
                onChange={(e) => setForm((prev) => ({ ...prev, subject_id: e.target.value }))}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Semester Batch</label>
              <select
                required
                className="input-premium bg-white"
                value={form.semester_id}
                onChange={(e) => setForm((prev) => ({ ...prev, semester_id: e.target.value }))}
              >
                <option value="">Select semester</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    Sem {sem.number} (Course #{sem.course_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Exam Type</label>
              <select
                required
                className="input-premium bg-white"
                value={form.exam_type}
                onChange={(e) => setForm((prev) => ({ ...prev, exam_type: e.target.value }))}
              >
                <option value="final">Final Exam</option>
                <option value="midterm">Midterm</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Exam Date</label>
              <input
                required
                type="date"
                className="input-premium"
                value={form.exam_date}
                onChange={(e) => setForm((prev) => ({ ...prev, exam_date: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn-premium w-full mt-2 shadow-sm">
              Save Exam Schedule
            </button>
          </form>
        </div>

        {/* List of Exams */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              <Calendar className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-800 heading-premium">Available Schedules</h3>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <DataTable
              data={exams}
              searchKeys={['exam_type']}
              columns={[
                {
                  key: 'id',
                  header: 'Exam ID',
                  render: (row) => `ID #${row.id}`,
                },
                {
                  key: 'subject_id',
                  header: 'Subject',
                  render: (row) => subjectMap[row.subject_id] || row.subject_id,
                },
                {
                  key: 'semester_id',
                  header: 'Semester Batch',
                  render: (row) => semesterMap[row.semester_id] || row.semester_id,
                },
                {
                  key: 'exam_type',
                  header: 'Type',
                  render: (row) => {
                    let typeColor = 'bg-slate-100 text-slate-700'
                    if (row.exam_type === 'final') typeColor = 'bg-violet-50 text-violet-700 border-violet-100'
                    if (row.exam_type === 'midterm') typeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    if (row.exam_type === 'quiz') typeColor = 'bg-amber-50 text-amber-700 border-amber-100'
                    if (row.exam_type === 'assignment') typeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100'

                    return (
                      <span className={`badge-premium border capitalize ${typeColor}`}>
                        {row.exam_type}
                      </span>
                    )
                  },
                },
                { key: 'exam_date', header: 'Scheduled Date' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditExam(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Edit Exam"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Exam"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Edit Exam Modal */}
      <AnimatePresence>
        {editExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm"
              onClick={() => setEditExam(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="glass-panel relative z-10 w-full max-w-md p-6 bg-white/95 shadow-2xl border-slate-200/60"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 heading-premium">Edit Exam Schedule</h3>
                <button
                  onClick={() => setEditExam(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={editExam.subject_id}
                    onChange={(e) => setEditExam((prev) => ({ ...prev, subject_id: e.target.value }))}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Semester Batch</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={editExam.semester_id}
                    onChange={(e) => setEditExam((prev) => ({ ...prev, semester_id: e.target.value }))}
                  >
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        Sem {sem.number} (Course #{sem.course_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Exam Type</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={editExam.exam_type}
                    onChange={(e) => setEditExam((prev) => ({ ...prev, exam_type: e.target.value }))}
                  >
                    <option value="final">Final Exam</option>
                    <option value="midterm">Midterm</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Exam Date</label>
                  <input
                    required
                    type="date"
                    className="input-premium"
                    value={editExam.exam_date}
                    onChange={(e) => setEditExam((prev) => ({ ...prev, exam_date: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditExam(null)}
                    className="btn-premium-secondary py-2 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-premium py-2 px-4 text-xs shadow-md">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
