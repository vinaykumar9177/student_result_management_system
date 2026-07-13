import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import toast from 'react-hot-toast'
import { Terminal, Search, Trash2, RefreshCw } from 'lucide-react'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/logs')
      setLogs(response.data.entries || [])
    } catch (err) {
      toast.error('Failed to retrieve system logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    let result = [...logs]

    if (filterLevel !== 'ALL') {
      result = result.filter((entry) => entry.level.toUpperCase() === filterLevel)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (entry) =>
          entry.message.toLowerCase().includes(query) ||
          entry.level.toLowerCase().includes(query) ||
          entry.timestamp.toLowerCase().includes(query)
      )
    }

    setFilteredLogs(result)
  }, [logs, searchQuery, filterLevel])

  const clearConsole = () => {
    setLogs([])
    toast.success('Local console logs cleared.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Logs</h1>
          <p className="text-sm text-slate-500">Monitor live server events, database migrations, and CloudWatch notification outputs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearConsole}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5 transition"
            title="Clear logs locally"
          >
            <Trash2 className="h-4 w-4" />
            Clear Console
          </button>
          <button
            onClick={fetchLogs}
            className="btn-premium inline-flex gap-2 items-center text-xs font-semibold py-2 px-4 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Logs
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-slate-900 bg-slate-950 p-0 text-slate-100 shadow-2xl flex flex-col min-h-[600px]">
        {/* Terminal Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full bg-rose-500 block"></span>
              <span className="h-3.5 w-3.5 rounded-full bg-amber-400 block"></span>
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 block"></span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 ml-3">
              <Terminal className="h-4 w-4" />
              admin@system-monitor:~$ cat /var/log/syslog
            </span>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                className="w-full md:w-48 rounded-lg bg-slate-800 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Level Filter */}
            <select
              className="rounded-lg bg-slate-800 border border-slate-700/80 px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 font-mono"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-5 font-mono text-xs leading-relaxed overflow-y-auto max-h-[500px] select-text">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-500">
              <span className="animate-pulse">Loading system streams...</span>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-1.5">
              {filteredLogs.map((entry, index) => {
                const levelUpper = entry.level.toUpperCase()
                let levelColor = 'text-indigo-400'
                if (levelUpper === 'WARNING') levelColor = 'text-amber-400'
                if (levelUpper === 'ERROR') levelColor = 'text-rose-400 font-bold'

                const dateStr = new Date(entry.timestamp).toLocaleTimeString()

                return (
                  <div key={index} className="hover:bg-slate-900/60 p-0.5 rounded transition">
                    <span className="text-slate-500">[{dateStr}]</span>{' '}
                    <span className={`[${levelColor}] font-semibold mr-1.5`}>[{levelUpper}]</span>{' '}
                    <span className="text-slate-300">{entry.message}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-600">
              No matching log output found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
