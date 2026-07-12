import React from 'react'
import DataTable from '../../components/DataTable'

const sampleData = [
  { id: 1, roll_number: 'CS001', name: 'Asha', department: 'CSE', semester: '5', subject: 'DBMS' },
  { id: 2, roll_number: 'EC014', name: 'Ravi', department: 'ECE', semester: '3', subject: 'Signals' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <section className="glass-panel grid gap-4 p-6 md:grid-cols-3">
        {[
          ['Departments', '12'],
          ['Students', '1,248'],
          ['Published Results', '864'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-slate-50 p-5">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </section>
      <DataTable
        data={sampleData}
        searchKeys={['roll_number', 'name', 'department', 'semester', 'subject']}
        filters={[
          { key: 'department', label: 'Department', options: ['CSE', 'ECE'] },
          { key: 'semester', label: 'Semester', options: ['3', '5'] },
          { key: 'subject', label: 'Subject', options: ['DBMS', 'Signals'] },
        ]}
        columns={[
          { key: 'roll_number', header: 'Roll Number' },
          { key: 'name', header: 'Name' },
          { key: 'department', header: 'Department' },
          { key: 'semester', header: 'Semester' },
          { key: 'subject', header: 'Subject' },
        ]}
      />
    </div>
  )
}
