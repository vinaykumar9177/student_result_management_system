import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Edit2, Trash2, Layers, RefreshCw, X } from 'lucide-react'

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [editDep, setEditDep] = useState(null)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/departments')
      setDepartments(res.data)
    } catch (err) {
      toast.error('Failed to load departments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/departments', { name, code })
      toast.success('Department created successfully!')
      setName('')
      setCode('')
      await fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create department.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/departments/${editDep.id}`, {
        name: editDep.name,
        code: editDep.code,
      })
      toast.success('Department updated successfully!')
      setEditDep(null)
      await fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update department.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return
    try {
      await api.delete(`/admin/departments/${id}`)
      toast.success('Department deleted.')
      await fetchDepartments()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete department.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Departments</h1>
          <p className="text-sm text-slate-500">Manage academic departments and branches across the institution.</p>
        </div>
        <button
          onClick={fetchDepartments}
          className="btn-premium-secondary inline-flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Department Form */}
        <div className="glass-panel p-6 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              <PlusCircle className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-800 heading-premium">Add Department</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Code</label>
              <input
                required
                className="input-premium"
                placeholder="e.g. CSE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Department Name</label>
              <input
                required
                className="input-premium"
                placeholder="e.g. Computer Science Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-premium w-full mt-2 shadow-sm">
              Save Department
            </button>
          </form>
        </div>

        {/* List of Departments */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
              <Layers className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-slate-800 heading-premium">Available Branches</h3>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : (
            <DataTable
              data={departments}
              searchKeys={['name', 'code']}
              columns={[
                { key: 'code', header: 'Code' },
                { key: 'name', header: 'Department Name' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditDep(row)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Edit Department"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Department"
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

      {/* Edit Department Modal */}
      <AnimatePresence>
        {editDep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm"
              onClick={() => setEditDep(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="glass-panel relative z-10 w-full max-w-md p-6 bg-white/95 shadow-2xl border-slate-200/60"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 heading-premium">Edit Department</h3>
                <button
                  onClick={() => setEditDep(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Code</label>
                  <input
                    required
                    className="input-premium"
                    value={editDep.code}
                    onChange={(e) => setEditDep((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Name</label>
                  <input
                    required
                    className="input-premium"
                    value={editDep.name}
                    onChange={(e) => setEditDep((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditDep(null)}
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
