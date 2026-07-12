import React from 'react'

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <p className="mt-2 text-slate-600">View semester results, SGPA/CGPA, and download published PDFs.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel p-6">Current SGPA</div>
        <div className="glass-panel p-6">CGPA</div>
        <div className="glass-panel p-6">Notifications</div>
      </section>
    </div>
  )
}
