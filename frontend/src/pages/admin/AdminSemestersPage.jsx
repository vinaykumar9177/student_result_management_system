import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { PlusCircle, Edit2, Trash2, Calendar, RefreshCw, X } from 'lucide-react'

const emptyForm = {
  course_id: '',
  number: '1',
  start_date: '',
  end_date: '',
}

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [form, setForm] = useState(emptyForm)
  const [editSem, setEditSem] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [semestersRes, coursesRes] = await Promise.all([
        api.get('/admin/semesters'),
        api.get('/admin/courses'),
      ])
      setSemesters(semestersRes.data)
      setCourses(coursesRes.data)
    } catch (err) {
      toast.error('Failed to load semesters data.')
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
      await api.post('/admin/semesters', {
        course_id: Number(form.course_id),
        number: Number(form.number),
        start_date: form.start_date,
        end_date: form.end_date,
      })
      toast.success('Semester created successfully!')
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create semester.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/semesters/${editSem.id}`, {
        course_id: Number(editSem.course_id),
        number: Number(editSem.number),
        start_date: editSem.start_date,
        end_date: editSem.end_date,
      })
      toast.success('Semester updated successfully!')
      setEditSem(null)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update semester.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) return
    try {
      await api.delete(`/admin/semesters/${id}`)
      toast.success('Semester deleted successfully.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete semester.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Semesters</h1>
          <p className="text-sm text-slate-500">Define administrative semester timelines for active courses.</p>
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
        {/* Add Semester Form */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
              <PlusCircle className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-800">Add Semester</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Semester Number</label>
              <input
                required
                type="number"
                min="1"
                max="12"
                className="input-premium"
                value={form.number}
                onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Start Date</label>
              <input
                required
                type="date"
                className="input-premium"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">End Date</label>
              <input
                required
                type="date"
                className="input-premium"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn-premium w-full mt-2">
              Save Semester
            </button>
          </form>
        </div>

        {/* List of Semesters */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
              <Calendar className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-800">Available Semesters</h3>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <DataTable
              data={semesters}
              searchKeys={['number']}
              columns={[
                {
                  key: 'number',
                  header: 'Semester',
                  render: (row) => `Semester ${row.number}`,
                },
                {
                  key: 'course_id',
                  header: 'Course',
                  render: (row) => courseMap[row.course_id] || row.course_id,
                },
                { key: 'start_date', header: 'Start Date' },
                { key: 'end_date', header: 'End Date' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditSem(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="Edit Semester"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Semester"
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

      {/* Edit Semester Modal */}
      {editSem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditSem(null)} />
          <div className="glass-panel relative z-10 w-full max-w-md p-6 bg-white shadow-2xl animate-scale-up">
            <button
              onClick={() => setEditSem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-850 mb-4">Edit Semester</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Course</label>
                <select
                  required
                  className="input-premium bg-white"
                  value={editSem.course_id}
                  onChange={(e) => setEditSem((prev) => ({ ...prev, course_id: e.target.value }))}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Semester Number</label>
                <input
                  required
                  type="number"
                  className="input-premium"
                  value={editSem.number}
                  onChange={(e) => setEditSem((prev) => ({ ...prev, number: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Start Date</label>
                <input
                  required
                  type="date"
                  className="input-premium"
                  value={editSem.start_date}
                  onChange={(e) => setEditSem((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">End Date</label>
                <input
                  required
                  type="date"
                  className="input-premium"
                  value={editSem.end_date}
                  onChange={(e) => setEditSem((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditSem(null)}
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
