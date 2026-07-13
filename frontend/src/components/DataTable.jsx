import React, { useMemo, useState } from 'react'

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
    <div className="glass-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200/60 p-4 md:flex-row md:items-center md:justify-between">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-2 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white md:max-w-sm"
          placeholder="Search records..."
          value={search}
          onChange={handleSearchChange}
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <select
              key={filter.key}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500"
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
          ))}
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500"
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
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/60 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((column) => {
                const isSorted = sortConfig.key === column.key
                return (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/80"
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.header}</span>
                      <span className="text-slate-400">
                        {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="transition-colors hover:bg-slate-50/50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-slate-200/60 bg-slate-50/50 px-6 py-4">
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-semibold text-slate-700">
            {Math.min(currentPage * pageSize, sortedRows.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-700">{sortedRows.length}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="text-xs text-slate-600">
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
