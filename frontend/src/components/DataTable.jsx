import React, { useMemo, useState } from 'react'

export default function DataTable({ data = [], columns = [], searchKeys = [], filters = [] }) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState({})

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

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none ring-0 focus:border-brand-500 md:max-w-sm"
          placeholder="Search records"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <select
              key={filter.key}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={activeFilters[filter.key] ?? ''}
              onChange={(event) => setActiveFilters((current) => ({ ...current, [filter.key]: event.target.value }))}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium uppercase tracking-wide">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
