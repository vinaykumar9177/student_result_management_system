import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { PlusCircle, Edit2, Trash2, BookOpen, RefreshCw, X } from 'lucide-react'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [duration, setDuration] = useState('4') // default 4 years
  const [editCourse, setEditCourse] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [coursesRes, departmentsRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/departments'),
      ])
      setCourses(coursesRes.data)
      setDepartments(departmentsRes.data)
    } catch (err) {
      toast.error('Failed to load courses data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const departmentMap = useMemo(() => {
    return Object.fromEntries(departments.map((d) => [d.id, `${d.code} - ${d.name}`]))
  }, [departments])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/courses', {
        name,
        department_id: Number(departmentId),
        duration: Number(duration),
      })
      toast.success('Course created successfully!')
      setName('')
      setDepartmentId('')
      setDuration('4')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create course.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/courses/${editCourse.id}`, {
        name: editCourse.name,
        department_id: Number(editCourse.department_id),
        duration: Number(editCourse.duration),
      })
      toast.success('Course updated successfully!')
      setEditCourse(null)
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update course.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return
    try {
      await api.delete(`/admin/courses/${id}`)
      toast.success('Course deleted successfully.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete course.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Courses</h1>
          <p className="text-sm text-slate-500">Configure academic curricula and link courses with departments.</p>
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
        {/* Add Course Form */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
              <PlusCircle className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-800">Add Course</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Course Name</label>
              <input
                required
                className="input-premium"
                placeholder="e.g. B.Tech Computer Science"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Department</label>
              <select
                required
                className="input-premium bg-white"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.code} - {dep.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Duration (Years)</label>
              <input
                required
                type="number"
                min="1"
                max="6"
                className="input-premium"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-premium w-full mt-2">
              Save Course
            </button>
          </form>
        </div>

        {/* List of Courses */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
              <BookOpen className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-800">Available Courses</h3>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <DataTable
              data={courses}
              searchKeys={['name']}
              columns={[
                { key: 'name', header: 'Course Name' },
                {
                  key: 'department_id',
                  header: 'Department',
                  render: (row) => departmentMap[row.department_id] || row.department_id,
                },
                {
                  key: 'duration',
                  header: 'Duration',
                  render: (row) => `${row.duration} Years`,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditCourse(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="Edit Course"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Course"
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

      {/* Edit Course Modal */}
      {editCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditCourse(null)} />
          <div className="glass-panel relative z-10 w-full max-w-md p-6 bg-white shadow-2xl animate-scale-up">
            <button
              onClick={() => setEditCourse(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-850 mb-4">Edit Course</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Course Name</label>
                <input
                  required
                  className="input-premium"
                  value={editCourse.name}
                  onChange={(e) => setEditCourse((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Department</label>
                <select
                  required
                  className="input-premium bg-white"
                  value={editCourse.department_id}
                  onChange={(e) => setEditCourse((prev) => ({ ...prev, department_id: e.target.value }))}
                >
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.code} - {dep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Duration (Years)</label>
                <input
                  required
                  type="number"
                  className="input-premium"
                  value={editCourse.duration}
                  onChange={(e) => setEditCourse((prev) => ({ ...prev, duration: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditCourse(null)}
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
