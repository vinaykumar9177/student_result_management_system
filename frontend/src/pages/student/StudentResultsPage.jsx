import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import {
  FileText,
  Download,
  Award,
  Layers,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react'

export default function StudentResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await api.get('/student/results')
      setResults(response.data)
    } catch (err) {
      toast.error('Failed to load published semester results.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const handleDownloadPDF = async (resultId) => {
    try {
      const response = await api.get(`/student/results/${resultId}/download`)
      const downloadUrl = response.data.download_url
      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
        toast.success('Result PDF download started.')
      } else {
        toast.error('Could not retrieve PDF URL.')
      }
    } catch (err) {
      toast.error('Failed to request presigned download link.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Academic Results</h1>
          <p className="text-sm text-slate-500">View and download your official semester GPA transcripts and marks sheets.</p>
        </div>
        <button
          onClick={fetchResults}
          className="btn-premium inline-flex gap-2 items-center text-xs font-semibold py-2 px-4 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Results
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <span className="ml-3 text-slate-500 font-medium">Retrieving transcripts...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((res) => {
            const isPass = res.pass_fail_status.toLowerCase() === 'pass'
            const publishDate = new Date(res.published_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <div key={res.id} className="glass-panel p-6 flex flex-col justify-between space-y-6 hover:scale-[1.01] transition-transform duration-200">
                <div className="space-y-4">
                  {/* Semester Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Semester Batch</div>
                      <h3 className="text-xl font-bold text-slate-800">Semester {res.semester_id}</h3>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1 border ${
                      isPass
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        : 'text-red-700 bg-red-50 border-red-100'
                    }`}>
                      {isPass ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {res.pass_fail_status.toUpperCase()}
                    </span>
                  </div>

                  {/* Marks info */}
                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Score Percentage</span>
                      <div className="text-lg font-bold text-slate-800">{res.percentage.toFixed(2)}%</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Letter Grade</span>
                      <div className="text-lg font-bold text-slate-800">{res.grade}</div>
                    </div>
                  </div>

                  {/* GPA stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SGPA</span>
                      <span className="text-2xl font-extrabold text-indigo-600">{res.sgpa.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CGPA</span>
                      <span className="text-2xl font-extrabold text-emerald-600">{res.cgpa.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleDownloadPDF(res.id)}
                    className="btn-premium w-full inline-flex gap-2 items-center justify-center text-xs py-2.5 bg-slate-900 hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF Report
                  </button>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Published: {publishDate}
                    </span>
                    <span className="font-mono">ID: #{res.id}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-panel p-10 text-center text-slate-400 space-y-2">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">No published results found.</p>
          <p className="text-xs">Once your results are calculated and published by the administrator, they will appear here.</p>
        </div>
      )}
    </div>
  )
}
