import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Award,
  Layers,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } },
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 heading-premium">Academic Transcripts</h1>
          <p className="text-sm text-slate-500">View and download your official semester GPA transcripts and marks sheets.</p>
        </div>
        <button
          onClick={fetchResults}
          className="btn-premium-secondary inline-flex gap-2 items-center"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Results</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center flex-col space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <span className="text-slate-400 text-xs animate-pulse">Retrieving transcripts...</span>
        </div>
      ) : results.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {results.map((res) => {
            const isPass = res.pass_fail_status.toLowerCase() === 'pass'
            const publishDate = new Date(res.published_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <motion.div
                variants={cardVariants}
                key={res.id}
                className="glass-panel p-6 flex flex-col justify-between space-y-6 hover:border-brand-500/20 hover:shadow-soft transition-all duration-300 bg-white/70 border-slate-200/50"
              >
                <div className="space-y-4">
                  {/* Semester Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Semester Batch</div>
                      <h3 className="text-xl font-bold text-slate-900 heading-premium">Semester {res.semester_id}</h3>
                    </div>
                    <span className={`badge-premium border ${
                      isPass
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        : 'text-red-700 bg-red-50 border-red-100'
                    }`}>
                      {isPass ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>{res.pass_fail_status.toUpperCase()}</span>
                    </span>
                  </div>

                  {/* Marks info */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 font-medium">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score Percentage</span>
                      <div className="text-base font-bold text-slate-800 mt-0.5">{res.percentage.toFixed(2)}%</div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Letter Grade</span>
                      <div className="text-base font-bold text-slate-800 mt-0.5">{res.grade}</div>
                    </div>
                  </div>

                  {/* GPA stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SGPA</span>
                      <span className="text-2xl font-extrabold text-indigo-600 heading-premium">{res.sgpa.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CGPA</span>
                      <span className="text-2xl font-extrabold text-emerald-600 heading-premium">{res.cgpa.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <button
                    onClick={() => handleDownloadPDF(res.id)}
                    className="btn-premium w-full inline-flex gap-2 items-center justify-center text-xs py-2.5 bg-slate-950 hover:bg-slate-900 border border-transparent shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF Report</span>
                  </button>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Published: {publishDate}</span>
                    </span>
                    <span className="font-mono">ID: #{res.id}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <div className="glass-panel p-12 text-center border-slate-200/50 bg-white/70 space-y-3">
          <div className="rounded-full bg-slate-50 p-3 text-slate-400/80 inline-block">
            <FileText className="h-6 w-6" />
          </div>
          <p className="font-semibold text-slate-700 text-sm heading-premium">No published results found.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Once your results are calculated and published by the administrator, they will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
