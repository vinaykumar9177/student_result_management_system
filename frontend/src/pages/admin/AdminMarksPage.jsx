import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Marks Management</h1>
          <p className="text-sm text-slate-500">Record individual subject grades and execute official result calculations.</p>
        </div>
        <button
          onClick={loadAll}
          className="btn-premium inline-flex gap-2 items-center text-xs font-semibold py-2 px-4 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Post Student Score / Bulk Upload */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
                <PlusCircle className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-slate-800">Post Scores</h3>
            </div>
            
            {/* Tab Toggles */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('single'); setBulkResult(null); }}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'single' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('bulk'); }}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'bulk' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Bulk CSV
              </button>
            </div>
          </div>

          {activeTab === 'single' ? (
            <form onSubmit={handlePostMark} className="space-y-4">
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

              <button type="submit" className="btn-premium w-full mt-2">
                Post Marks Record
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-500 leading-normal">
                <span className="font-semibold text-slate-700">CSV Headers Required:</span>
                <code className="block mt-1 font-mono text-[10px] bg-slate-200/50 p-1.5 rounded">
                  roll_number, subject_code, exam_type, marks_obtained, max_marks, exam_date (optional)
                </code>
              </div>

              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Upload CSV File</label>
                  <input
                    required
                    type="file"
                    accept=".csv"
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingBulk || !bulkFile}
                  className="btn-premium w-full mt-2 inline-flex items-center justify-center gap-1.5"
                >
                  {uploadingBulk ? 'Uploading...' : 'Upload Bulk Marks'}
                </button>
              </form>

              {bulkResult && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex justify-between text-xs bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-medium text-emerald-800">
                    <span>Uploaded: {bulkResult.success_count}</span>
                    <span>Failed: {bulkResult.errors?.length || 0}</span>
                  </div>

                  {bulkResult.errors && bulkResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-[10px] bg-red-50 border border-red-100 p-2.5 rounded-xl text-red-700 font-mono space-y-1">
                      {bulkResult.errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Publish Semester Results Action Card */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl border p-2 text-rose-600 bg-rose-50 border-rose-100">
              <Award className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-800">Publish Results Engine</h3>
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
              <p className="text-[10px] text-slate-400">Leave blank to calculate results for all students in the semester.</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-slate-600 leading-relaxed">
              <strong>Execution Note:</strong> Publishing triggers backend SGPA/CGPA calculations, provisions marks transcripts, compiles result sheets, and stores PDF copies to S3.
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="btn-premium w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98]"
            >
              {publishing ? 'Calculating & Syncing...' : 'Publish Semester Results'}
            </button>
          </form>
        </div>

        {/* Live Metrics */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-4">Registry Summary</h4>
            <div className="space-y-3">
              {[
                { label: 'Total Posted Scores', val: marks.length },
                { label: 'Registered Students', val: students.length },
                { label: 'Exams Configured', val: exams.length },
                { label: 'Active Semester Batches', val: semesters.length },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-slate-100">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-bold text-slate-800">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-slate-400 text-[10px] text-center pt-4">
            System logged database counts for students and exams.
          </div>
        </div>
      </div>

      {/* Posted Marks List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded-xl border p-2 text-indigo-600 bg-indigo-50 border-indigo-100">
            <FileSpreadsheet className="h-4 w-4" />
          </span>
          <h3 className="text-lg font-bold text-slate-800">Recorded Student Scores</h3>
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
                    <div className="text-xs text-slate-500">{row.roll_number}</div>
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
                    {row.marks_obtained} <span className="text-slate-400 font-normal">/ {row.max_marks}</span>
                  </span>
                ),
              },
              { key: 'examination_type', header: 'Exam Type' },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditMark(row)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                      title="Edit Marks"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMark(row.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete Entry"
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

      {/* Edit Marks Modal */}
      {editMark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditMark(null)} />
          <div className="glass-panel relative z-10 w-full max-w-md p-6 bg-white shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-850 mb-4">Edit Marks Record</h3>

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

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditMark(null)}
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
