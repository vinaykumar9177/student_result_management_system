import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  Layers,
  Award,
  UploadCloud,
  FileText,
  X,
  Loader2,
} from 'lucide-react'

const emptyForm = {
  student_id: '',
  subject_id: '',
  examination_id: '',
  marks_obtained: '',
  max_marks: '100',
}

export default function AdminMarksPage() {
  const [marks, setMarks] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [exams, setExams] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  // Forms & Actions
  const [form, setForm] = useState(emptyForm)
  const [editMark, setEditMark] = useState(null)
  
  // Bulk upload marks state
  const [activeTab, setActiveTab] = useState('single')
  const [bulkFile, setBulkFile] = useState(null)
  const [uploadingBulk, setUploadingBulk] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  
  // Publish results state
  const [publishSemId, setPublishSemId] = useState('')
  const [publishStudentIdsStr, setPublishStudentIdsStr] = useState('')
  const [publishing, setPublishing] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [marksRes, studentsRes, subjectsRes, examsRes, semestersRes] = await Promise.all([
        api.get('/admin/marks'),
        api.get('/admin/students'),
        api.get('/admin/subjects'),
        api.get('/admin/examinations'),
        api.get('/admin/semesters'),
      ])
      setMarks(marksRes.data)
      setStudents(studentsRes.data)
      setSubjects(subjectsRes.data)
      setExams(examsRes.data)
      setSemesters(semestersRes.data)
    } catch (err) {
      toast.error('Failed to load marks and dependency data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const studentMap = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students])
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects])
  const examMap = useMemo(() => Object.fromEntries(exams.map((e) => [e.id, e])), [exams])

  const handlePostMark = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/marks', {
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        examination_id: Number(form.examination_id),
        marks_obtained: Number(form.marks_obtained),
        max_marks: Number(form.max_marks),
      })
      toast.success('Marks posted successfully!')
      setForm(emptyForm)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post marks.')
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!bulkFile) return
    setUploadingBulk(true)
    setBulkResult(null)
    const formData = new FormData()
    formData.append('file', bulkFile)
    try {
      const response = await api.post('/admin/marks/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Bulk upload completed! Succeeded: ${response.data.success_count}`)
      setBulkResult(response.data)
      setBulkFile(null)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload bulk marks.')
    } finally {
      setUploadingBulk(false)
    }
  }

  const handleUpdateMark = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/admin/marks/${editMark.id}`, {
        student_id: Number(editMark.student_id),
        subject_id: Number(editMark.subject_id),
        examination_id: Number(editMark.examination_id),
        marks_obtained: Number(editMark.marks_obtained),
        max_marks: Number(editMark.max_marks),
      })
      toast.success('Marks updated successfully!')
      setEditMark(null)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update marks.')
    }
  }

  const handleDeleteMark = async (markId) => {
    if (!window.confirm('Are you sure you want to delete this mark entry?')) return
    try {
      await api.delete(`/admin/marks/${markId}`)
      toast.success('Mark entry deleted.')
      await loadAll()
    } catch (err) {
      toast.error('Failed to delete mark entry.')
    }
  }

  const handlePublishResults = async (e) => {
    e.preventDefault()
    if (!publishSemId) {
      toast.error('Please select a semester.')
      return
    }
    setPublishing(true)
    try {
      const studentIds = publishStudentIdsStr
        ? publishStudentIdsStr.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id))
        : null

      const response = await api.post('/admin/results/publish', {
        semester_id: Number(publishSemId),
        student_ids: studentIds && studentIds.length > 0 ? studentIds : null,
      })
      toast.success(`Published results for ${response.data.published_count} students!`)
      setPublishSemId('')
      setPublishStudentIdsStr('')
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish results.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Marks Management</h1>
          <p className="text-sm text-slate-500">Record individual subject grades and execute official result calculations.</p>
        </div>
        <button
          onClick={loadAll}
          className="btn-premium-secondary inline-flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Post Student Score / Bulk Upload */}
        <div className="glass-panel p-6 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
                <PlusCircle className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 heading-premium">Post Scores</h3>
            </div>
            
            {/* Tab Toggles */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold relative">
              <button
                type="button"
                onClick={() => { setActiveTab('single'); setBulkResult(null); }}
                className={`px-3 py-1.5 rounded-lg transition relative z-10 ${activeTab === 'single' ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {activeTab === 'single' && (
                  <motion.span
                    layoutId="active-marks-tab"
                    className="absolute inset-0 bg-white shadow-sm rounded-lg"
                    style={{ zIndex: -1 }}
                  />
                )}
                Single
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('bulk'); }}
                className={`px-3 py-1.5 rounded-lg transition relative z-10 ${activeTab === 'bulk' ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {activeTab === 'bulk' && (
                  <motion.span
                    layoutId="active-marks-tab"
                    className="absolute inset-0 bg-white shadow-sm rounded-lg"
                    style={{ zIndex: -1 }}
                  />
                )}
                Bulk CSV
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'single' ? (
              <motion.form
                key="single-score-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePostMark}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Student</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={form.student_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.roll_number} - {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={form.subject_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject_id: e.target.value }))}
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.code} - {subj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Examination Instance</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={form.examination_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, examination_id: e.target.value }))}
                  >
                    <option value="">Select exam</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        ID #{exam.id} - {exam.exam_type} ({exam.exam_date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Obtained Marks</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      className="input-premium"
                      placeholder="Obtained"
                      value={form.marks_obtained}
                      onChange={(e) => setForm((prev) => ({ ...prev, marks_obtained: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Max Marks</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="input-premium"
                      placeholder="Max"
                      value={form.max_marks}
                      onChange={(e) => setForm((prev) => ({ ...prev, max_marks: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-premium w-full mt-2 shadow-sm">
                  Post Marks Record
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="bulk-score-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-3.5 text-[11px] text-slate-500 leading-relaxed font-medium">
                  <span className="font-bold text-slate-700">CSV Headers Required:</span>
                  <code className="block mt-1.5 font-mono text-[9px] bg-white border border-slate-200 p-2 rounded-lg text-slate-600 select-all overflow-x-auto">
                    roll_number, subject_code, exam_type, marks_obtained, max_marks, exam_date (optional)
                  </code>
                </div>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Upload CSV File</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-6 transition flex flex-col items-center justify-center cursor-pointer relative bg-white/50 hover:bg-white/80">
                      <input
                        required
                        type="file"
                        accept=".csv"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setBulkFile(e.target.files[0])}
                      />
                      <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-600">
                        {bulkFile ? bulkFile.name : 'Select or drop a CSV file'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">Accepts CSV files up to 5MB</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingBulk || !bulkFile}
                    className="btn-premium w-full mt-2 inline-flex items-center justify-center gap-1.5"
                  >
                    {uploadingBulk ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading CSV...</span>
                      </>
                    ) : (
                      <span>Upload Bulk Marks</span>
                    )}
                  </button>
                </form>

                {bulkResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-xs bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-semibold text-emerald-800 shadow-sm">
                      <span>Succeeded: {bulkResult.success_count}</span>
                      <span>Failed: {bulkResult.errors?.length || 0}</span>
                    </div>

                    {bulkResult.errors && bulkResult.errors.length > 0 && (
                      <div className="max-h-32 overflow-y-auto text-[10px] bg-red-50 border border-red-100 p-2.5 rounded-xl text-red-700 font-mono space-y-1.5">
                        {bulkResult.errors.map((err, i) => (
                          <div key={i} className="border-b border-red-200/50 pb-1 last:border-0 last:pb-0">{err}</div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Publish Semester Results Action Card */}
        <div className="glass-panel p-6 space-y-5 bg-white/70 border-slate-200/50">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-rose-600">
              <Award className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-800 heading-premium">Publish Results Engine</h3>
          </div>

          <form onSubmit={handlePublishResults} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Target Semester</label>
              <select
                required
                className="input-premium bg-white"
                value={publishSemId}
                onChange={(e) => setPublishSemId(e.target.value)}
              >
                <option value="">Select semester</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    Semester {sem.number} (Course #{sem.course_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Student IDs (Optional)</label>
              <input
                className="input-premium"
                placeholder="Comma separated IDs e.g. 1, 2, 5"
                value={publishStudentIdsStr}
                onChange={(e) => setPublishStudentIdsStr(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">Leave blank to calculate results for all students in the semester.</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-slate-600 leading-relaxed font-medium">
              <strong>Execution Note:</strong> Publishing triggers backend SGPA/CGPA calculations, provisions marks transcripts, compiles result sheets, and stores PDF copies to S3.
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="btn-premium w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.98] mt-2 shadow-sm inline-flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calculating & Syncing...</span>
                </>
              ) : (
                <span>Publish Semester Results</span>
              )}
            </button>
          </form>
        </div>

        {/* Live Metrics */}
        <div className="glass-panel p-6 flex flex-col justify-between bg-white/70 border-slate-200/50">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-4 heading-premium">Registry Summary</h4>
            <div className="space-y-1">
              {[
                { label: 'Total Posted Scores', val: marks.length },
                { label: 'Registered Students', val: students.length },
                { label: 'Exams Configured', val: exams.length },
                { label: 'Active Semester Batches', val: semesters.length },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="font-extrabold text-slate-800">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-slate-400 text-[10px] text-center pt-6 font-medium">
            System logged database counts for students and exams.
          </div>
        </div>
      </div>

      {/* Posted Marks List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 text-indigo-600">
            <FileSpreadsheet className="h-4 w-4" />
          </span>
          <h3 className="text-lg font-bold text-slate-800 heading-premium">Recorded Student Scores</h3>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : (
          <DataTable
            data={marks}
            searchKeys={['student_name', 'roll_number', 'subject']}
            columns={[
              {
                key: 'student_name',
                header: 'Student Name',
                render: (row) => (
                  <div>
                    <div className="font-bold text-slate-900">{row.student_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{row.roll_number}</div>
                  </div>
                ),
              },
              { key: 'branch', header: 'Branch' },
              {
                key: 'semester_number',
                header: 'Semester',
                render: (row) => `Sem ${row.semester_number}`,
              },
              { key: 'subject', header: 'Subject' },
              {
                key: 'marks_obtained',
                header: 'Score',
                render: (row) => (
                  <span className="font-mono font-bold text-slate-800">
                    {row.marks_obtained} <span className="text-slate-400 font-normal text-xs">/ {row.max_marks}</span>
                  </span>
                ),
              },
              { key: 'examination_type', header: 'Exam Type' },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditMark(row)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      title="Edit Marks"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMark(row.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Entry"
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

      {/* Edit Marks Modal */}
      <AnimatePresence>
        {editMark && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm"
              onClick={() => setEditMark(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="glass-panel relative z-10 w-full max-w-md p-6 bg-white/95 shadow-2xl border-slate-200/60"
            >
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 heading-premium">Edit Marks Record</h3>
                <button
                  onClick={() => setEditMark(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateMark} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Student</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={editMark.student_id}
                    onChange={(e) => setEditMark((prev) => ({ ...prev, student_id: e.target.value }))}
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.roll_number} - {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Subject</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={editMark.subject_id}
                    onChange={(e) => setEditMark((prev) => ({ ...prev, subject_id: e.target.value }))}
                  >
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.code} - {subj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Examination Instance</label>
                  <select
                    required
                    className="input-premium bg-white"
                    value={editMark.examination_id}
                    onChange={(e) => setEditMark((prev) => ({ ...prev, examination_id: e.target.value }))}
                  >
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        ID #{exam.id} - {exam.exam_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Obtained Marks</label>
                    <input
                      required
                      type="number"
                      className="input-premium"
                      value={editMark.marks_obtained}
                      onChange={(e) => setEditMark((prev) => ({ ...prev, marks_obtained: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Max Marks</label>
                    <input
                      required
                      type="number"
                      className="input-premium"
                      value={editMark.max_marks}
                      onChange={(e) => setEditMark((prev) => ({ ...prev, max_marks: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditMark(null)}
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
