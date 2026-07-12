import React from 'react'

export default function FacultyDashboard() {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <h1 className="text-2xl font-semibold">Faculty Dashboard</h1>
        <p className="mt-2 text-slate-600">Review assigned subjects, enter marks, and submit result inputs.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-6">Assigned Subjects</div>
        <div className="glass-panel p-6">Marks Submission Queue</div>
      </section>
    </div>
  )
}
