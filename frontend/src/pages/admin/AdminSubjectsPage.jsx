import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { PlusCircle, Edit2, Trash2, BookOpen, RefreshCw, X } from 'lucide-react'

const emptyForm = {
  name: '',
  code: '',
  credits: '4',
  course_id: '',
  semester_number: '1',
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [form, setForm] = useState(emptyForm)
  const [editSub, setEditSub] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/courses'),
      ])
      setSubjects(subjectsRes.data)
      setCourses(coursesRes.data)
    } catch (err) {
      toast.error('Failed to load subjects data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const courseMap = useMemo(() => {
    return Object.fromEntries(courses.map((c) => [c.id, c.name]))
  }, [courses])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/subjects', {
        name: form.name,
        code: form.code,
        credits: Number(form.credits),
        course_id: Number(form.course_id),
        semester_number: Number(form.semester_number),
      })
      toast.success('Subject created successfully!')
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create subject.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/subjects/${editSub.id}`, {
        name: editSub.name,
        code: editSub.code,
        credits: Number(editSub.credits),
        course_id: Number(editSub.course_id),
        semester_number: Number(editSub.semester_number),
      })
      toast.success('Subject updated successfully!')
      setEditSub(null)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update subject.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return
    try {
      await api.delete(`/admin/subjects/${id}`)
      toast.success('Subject deleted successfully.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete subject.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Subjects</h1>
          <p className="text-sm text-slate-500">Configure academic subjects, assign credits, and link them to courses.</p>
        </div>
        <button
          onClick={loadData}
          className="btn-premium inline-flex gap-2 items-center text-xs font-semibold py-2 px-4 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Add Subject Form */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
              <PlusCircle className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-800">Add Subject</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Subject Code</label>
              <input
                required
                className="input-premium"
                placeholder="e.g. CS-301"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Subject Name</label>
              <input
                required
                className="input-premium"
                placeholder="e.g. Database Management System"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Credits</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="10"
                  className="input-premium"
                  value={form.credits}
                  onChange={(e) => setForm((prev) => ({ ...prev, credits: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Sem Number</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="10"
                  className="input-premium"
                  value={form.semester_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, semester_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Course</label>
              <select
                required
                className="input-premium bg-white"
                value={form.course_id}
                onChange={(e) => setForm((prev) => ({ ...prev, course_id: e.target.value }))}
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-premium w-full mt-2">
              Save Subject
            </button>
          </form>
        </div>

        {/* List of Subjects */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
              <BookOpen className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-800">Available Subjects</h3>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <DataTable
              data={subjects}
              searchKeys={['name', 'code']}
              columns={[
                { key: 'code', header: 'Code' },
                { key: 'name', header: 'Subject Name' },
                {
                  key: 'course_id',
                  header: 'Course',
                  render: (row) => courseMap[row.course_id] || row.course_id,
                },
                {
                  key: 'semester_number',
                  header: 'Semester',
                  render: (row) => `Sem ${row.semester_number}`,
                },
                {
                  key: 'credits',
                  header: 'Credits',
                  render: (row) => `${row.credits} Credits`,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditSub(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="Edit Subject"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Edit Subject Modal */}
      {editSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditSub(null)} />
          <div className="glass-panel relative z-10 w-full max-w-md p-6 bg-white shadow-2xl animate-scale-up">
            <button
              onClick={() => setEditSub(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-850 mb-4">Edit Subject</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Code</label>
                <input
                  required
                  className="input-premium"
                  value={editSub.code}
                  onChange={(e) => setEditSub((prev) => ({ ...prev, code: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Subject Name</label>
                <input
                  required
                  className="input-premium"
                  value={editSub.name}
                  onChange={(e) => setEditSub((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Credits</label>
                  <input
                    required
                    type="number"
                    className="input-premium"
                    value={editSub.credits}
                    onChange={(e) => setEditSub((prev) => ({ ...prev, credits: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Semester Number</label>
                  <input
                    required
                    type="number"
                    className="input-premium"
                    value={editSub.semester_number}
                    onChange={(e) => setEditSub((prev) => ({ ...prev, semester_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Course</label>
                <select
                  required
                  className="input-premium bg-white"
                  value={editSub.course_id}
                  onChange={(e) => setEditSub((prev) => ({ ...prev, course_id: e.target.value }))}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditSub(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-premium py-2 text-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
