import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

export default function DataTable({ data = [], columns = [], searchKeys = [], filters = [] }) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key, value) => {
    setActiveFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: null, direction: 'asc' })
      return
    }
    setSortConfig({ key, direction })
  }

  const filteredRows = useMemo(() => {
    return data.filter((row) => {
      const searchable = searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(search.toLowerCase()))
      const matchesFilters = filters.every((filter) => {
        const selected = activeFilters[filter.key]
        if (!selected) {
          return true
        }
        return String(row[filter.key] ?? '') === selected
      })
      return searchable && matchesFilters
    })
  }, [activeFilters, data, filters, search, searchKeys])

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows]
    if (sortConfig.key) {
      rows.sort((a, b) => {
        let valA = a[sortConfig.key]
        let valB = b[sortConfig.key]
        if (valA === undefined || valA === null) valA = ''
        if (valB === undefined || valB === null) valB = ''

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        }

        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return rows
  }, [filteredRows, sortConfig])

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedRows.slice(startIndex, startIndex + pageSize)
  }, [sortedRows, currentPage, pageSize])

  return (
    <div className="glass-panel overflow-hidden border border-slate-200/50 bg-white/70 shadow-premium backdrop-blur-lg">
      {/* Search and Filters Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between bg-slate-50/40">
        <div className="relative w-full md:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            className="w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-4 py-2 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 text-slate-700"
            placeholder="Search records..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center justify-end">
          {filters.map((filter) => (
            <div key={filter.key} className="relative">
              <select
                className="appearance-none rounded-xl border border-slate-200/80 bg-white pl-3.5 pr-8 py-2 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 cursor-pointer min-w-[120px]"
                value={activeFilters[filter.key] ?? ''}
                onChange={(event) => handleFilterChange(filter.key, event.target.value)}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          ))}

          <div className="relative">
            <select
              className="appearance-none rounded-xl border border-slate-200/80 bg-white pl-3.5 pr-8 py-2 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 cursor-pointer"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setCurrentPage(1)
              }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 select-none">
            <tr>
              {columns.map((column) => {
                const isSorted = sortConfig.key === column.key
                return (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="group cursor-pointer px-6 py-3.5 transition-colors hover:bg-slate-100/50"
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.header}</span>
                      <ArrowUpDown className={`h-3 w-3 transition-opacity ${isSorted ? 'text-brand-500 opacity-100' : 'text-slate-300 opacity-40 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            <AnimatePresence mode="wait">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rIdx) => (
                  <motion.tr
                    key={row.id || rIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(rIdx * 0.03, 0.2) }}
                    className="transition-colors hover:bg-slate-50/40"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-slate-600 font-medium">
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white"
                >
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <div className="rounded-full bg-slate-50 p-3 text-slate-400/80">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-slate-600 text-sm">No records found</p>
                      <p className="text-xs text-slate-400">Try modifying your query or filters</p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-semibold text-slate-700">
            {Math.min(currentPage * pageSize, sortedRows.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-700">{sortedRows.length}</span> results
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-800 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-xs text-slate-600 select-none">
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-800 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
