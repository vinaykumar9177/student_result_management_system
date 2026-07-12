import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import FacultyLayout from './layouts/FacultyLayout'
import StudentLayout from './layouts/StudentLayout'
import LoginHub from './pages/LoginHub'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFacultyPage from './pages/admin/AdminFacultyPage'
import AdminLogsPage from './pages/admin/AdminLogsPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyMarksPage from './pages/faculty/FacultyMarksPage'
import FacultyStudentsPage from './pages/faculty/FacultyStudentsPage'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfilePage from './pages/student/StudentProfilePage'
import StudentResultsPage from './pages/student/StudentResultsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginHub />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="faculty" element={<AdminFacultyPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="marks" element={<FacultyMarksPage />} />
        <Route path="students" element={<FacultyStudentsPage />} />
      </Route>

      <Route path="/faculty" element={<Navigate to="/teacher" replace />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="results" element={<StudentResultsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>
    </Routes>
  )
}
