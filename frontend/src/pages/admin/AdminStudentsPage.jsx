import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Upload,
  RefreshCw,
  Edit2,
  Trash2,
  Key,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  Loader2,
} from 'lucide-react'

const emptyForm = {
  email: '',
  roll_number: '',
  name: '',
  department_id: '',
  course_id: '',
  current_semester: '1',
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list') // 'list' | 'create' | 'bulk'

  // Forms and Modals
  const [form, setForm] = useState(emptyForm)
  const [editStudent, setEditStudent] = useState(null) // null or student object being edited
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null) // { name, roll_number, password }

  // Bulk Upload State
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState(null) // { success_count, errors: [] }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [studentsRes, departmentsRes, coursesRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/departments'),
        api.get('/admin/courses'),
      ])
      setStudents(studentsRes.data)
      setDepartments(departmentsRes.data)
      setCourses(coursesRes.data)
    } catch (err) {
      toast.error('Failed to load students list & metadata.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const departmentLabelById = useMemo(
    () => Object.fromEntries(departments.map((d) => [String(d.id), `${d.code} - ${d.name}`])),
    [departments],
  )

  const courseLabelById = useMemo(
    () => Object.fromEntries(courses.map((c) => [String(c.id), c.name])),
    [courses],
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    setTempPasswordInfo(null)
    try {
      const res = await api.post('/admin/students', {
        email: form.email,
        roll_number: form.roll_number,
        name: form.name,
        department_id: Number(form.department_id),
        course_id: Number(form.course_id),
        current_semester: Number(form.current_semester),
      })
      toast.success('Student account created successfully!')
      setTempPasswordInfo({
        name: form.name,
        roll_number: form.roll_number,
        password: res.data.temporary_password,
      })
      setForm(emptyForm)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create student.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/students/${editStudent.id}`, {
        email: editStudent.email,
        roll_number: editStudent.roll_number,
        name: editStudent.name,
        department_id: Number(editStudent.department_id),
        course_id: Number(editStudent.course_id),
        current_semester: Number(editStudent.current_semester),
      })
      toast.success('Student updated successfully!')
      setEditStudent(null)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update student.')
    }
  }

  const handleSoftDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to soft-delete this student account? They will lose dashboard access.')) return
    try {
      await api.delete(`/admin/students/${studentId}`)
      toast.success('Student account soft-deleted.')
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete student.')
    }
  }

  const handleResetPassword = async (studentId, studentName) => {
    try {
      const res = await api.post(`/admin/students/${studentId}/reset-password`)
      toast.success('Temporary password generated!')
      setTempPasswordInfo({
        name: studentName,
        roll_number: '',
        password: res.data.temporary_password,
      })
    } catch (err) {
      toast.error('Failed to reset student password.')
    }
  }

  // Bulk Upload File Handlers
  const handleBulkUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setBulkResult(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/admin/students/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setBulkResult({
        success_count: res.data.success_count,
        errors: res.data.errors || [],
      })
      toast.success(`CSV Upload finished. Registered ${res.data.success_count} students.`);
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload CSV.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBulkUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Student Directory</h1>
          <p className="text-sm text-slate-500">Manage student accounts, provision via CSV, and reset passwords.</p>
        </div>
        <button
          onClick={loadAll}
          className="btn-premium-secondary inline-flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex gap-2 border-b border-slate-200 pb-px relative">
        {[
          { id: 'list', label: 'All Students', icon: FileSpreadsheet },
          { id: 'create', label: 'Single Creation', icon: UserPlus },
          { id: 'bulk', label: 'Bulk CSV Upload', icon: Upload },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all relative ${
                isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-student-directory-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Tab: Student List */}
        {activeTab === 'list' && (
          <motion.div
            key="tab-list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex h-60 items-center justify-center flex-col space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                <span className="text-slate-400 text-xs animate-pulse">Loading student database...</span>
              </div>
            ) : (
              <DataTable
                data={students}
                searchKeys={['name', 'roll_number', 'email']}
                columns={[
                  {
                    key: 'name',
                    header: 'Student Info',
                    render: (row) => (
                      <div>
                        <div className="font-bold text-slate-900">{row.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{row.roll_number}</div>
                      </div>
                    ),
                  },
                  { key: 'email', header: 'Email' },
                  {
                    key: 'department_id',
                    header: 'Branch/Department',
                    render: (row) => departmentLabelById[String(row.department_id)] || row.department_id,
                  },
                  {
                    key: 'course_id',
                    header: 'Course',
                    render: (row) => courseLabelById[String(row.course_id)] || row.course_id,
                  },
                  {
                    key: 'current_semester',
                    header: 'Sem',
                    render: (row) => <span className="badge-premium bg-slate-100 text-slate-700">S{row.current_semester}</span>,
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setEditStudent(row)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(row.id, row.name)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Reset Student Password"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleSoftDelete(row.id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Soft Delete Student"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </motion.div>
        )}

        {/* Tab: Single Creation Form */}
        {activeTab === 'create' && (
          <motion.div
            key="tab-create-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <div className="md:col-span-2 glass-panel p-6 bg-white/70 border-slate-200/50">
              <h3 className="text-base font-bold text-slate-800 heading-premium mb-5">Register New Student</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Student Name</label>
                    <input
                      required
                      className="input-premium"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Roll Number</label>
                    <input
                      required
                      className="input-premium"
                      placeholder="e.g. CS2026-001"
                      value={form.roll_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, roll_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email Address</label>
                    <input
                      required
                      type="email"
                      className="input-premium"
                      placeholder="student@university.edu"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Current Semester</label>
                    <input
                      required
                      type="number"
                      className="input-premium"
                      min="1"
                      max="10"
                      value={form.current_semester}
                      onChange={(e) => setForm((prev) => ({ ...prev, current_semester: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Branch/Department</label>
                    <select
                      required
                      className="input-premium bg-white"
                      value={form.department_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, department_id: e.target.value }))}
                  >
                      <option value="">Select Branch</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Course</label>
                    <select
                      required
                      className="input-premium bg-white"
                      value={form.course_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, course_id: e.target.value }))}
                    >
                      <option value="">Select Course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-premium w-full mt-4 shadow-sm">
                  Register Student
                </button>
              </form>
            </div>

            <div>
              <AnimatePresence>
                {tempPasswordInfo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel p-6 border-emerald-250 bg-emerald-50/40 text-slate-700 space-y-4 shadow-md"
                  >
                    <div className="flex items-center gap-2 text-emerald-800 font-bold heading-premium">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span>Temporary Password Issued</span>
                    </div>
                    <div className="space-y-2 text-xs leading-relaxed font-medium">
                      <p>
                        Student account for <strong className="text-slate-900">{tempPasswordInfo.name}</strong> has been provisioned.
                      </p>
                      <div className="rounded-xl border border-emerald-100 bg-white p-3 flex flex-col gap-1 text-center font-mono shadow-sm">
                        <span className="text-[10px] text-slate-400">TEMPORARY PASSWORD:</span>
                        <strong className="text-base text-slate-800 select-all">{tempPasswordInfo.password}</strong>
                      </div>
                      <p className="text-slate-500">
                        Provide this password to the student. They will be forced to change it on their first login.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Tab: Bulk CSV Upload */}
        {activeTab === 'bulk' && (
          <motion.div
            key="tab-bulk-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <div className="md:col-span-2 space-y-6">
              <div className="glass-panel p-6 bg-white/70 border-slate-200/50">
                <h3 className="text-base font-bold text-slate-800 heading-premium mb-2">CSV Bulk Import</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Upload a CSV file containing student records. Use existing IDs for department and course references.
                </p>

                {/* Drag Drop Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${
                    dragOver
                      ? 'border-brand-500 bg-brand-50/20 shadow-glow'
                      : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    id="csv-file-upload"
                    className="hidden"
                    accept=".csv"
                    onChange={(e) => handleBulkUpload(e.target.files?.[0])}
                  />
                  <label htmlFor="csv-file-upload" className="flex flex-col items-center cursor-pointer">
                    <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="text-sm font-bold text-slate-600 text-center">
                      {uploading ? 'Processing CSV Upload...' : 'Drag & Drop CSV file or Click to browse'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Supports file size up to 10MB</span>
                  </label>
                </div>
              </div>

              <AnimatePresence>
                {bulkResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-panel p-6 space-y-4 bg-white/70 border-slate-200/50 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800 text-sm heading-premium">Provisioning Report</h4>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Registered: {bulkResult.success_count}</span>
                      </div>
                    </div>

                    {bulkResult.errors.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Validation Warnings ({bulkResult.errors.length}):</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-[10px] font-mono text-slate-600 space-y-1.5">
                          {bulkResult.errors.map((err, i) => (
                            <div key={i} className="border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">{err}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">All student records from the CSV file were successfully imported.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="glass-panel p-6 space-y-4 bg-white/70 border-slate-200/50">
              <h4 className="font-bold text-slate-800 text-sm heading-premium flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>CSV Template</span>
              </h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-mono text-slate-500 overflow-x-auto select-all">
                email,roll_number,name,department_id,course_id,current_semester<br />
                alex@uni.edu,CS001,Alex Johnson,1,2,3<br />
                robin@uni.edu,EC002,Robin Miller,2,1,1
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                * Note: Department and Course fields require existing integer database IDs. Please refer to corresponding administrative sections for exact keys.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm"
              onClick={() => setEditStudent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="glass-panel relative z-10 w-full max-w-lg p-6 bg-white/95 shadow-2xl border-slate-200/60"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 heading-premium">Edit Student Account</h3>
                <button
                  onClick={() => setEditStudent(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Name</label>
                    <input
                      required
                      className="input-premium"
                      value={editStudent.name}
                      onChange={(e) => setEditStudent((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Roll Number</label>
                    <input
                      required
                      className="input-premium"
                      value={editStudent.roll_number}
                      onChange={(e) => setEditStudent((prev) => ({ ...prev, roll_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email</label>
                    <input
                      required
                      type="email"
                      className="input-premium"
                      value={editStudent.email}
                      onChange={(e) => setEditStudent((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Semester</label>
                    <input
                      required
                      type="number"
                      className="input-premium"
                      value={editStudent.current_semester}
                      onChange={(e) => setEditStudent((prev) => ({ ...prev, current_semester: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Department</label>
                    <select
                      required
                      className="input-premium bg-white"
                      value={editStudent.department_id}
                      onChange={(e) => setEditStudent((prev) => ({ ...prev, department_id: e.target.value }))}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Course</label>
                    <select
                      required
                      className="input-premium bg-white"
                      value={editStudent.course_id}
                      onChange={(e) => setEditStudent((prev) => ({ ...prev, course_id: e.target.value }))}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditStudent(null)}
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
