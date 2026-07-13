import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayout'
import LoginHub from './pages/LoginHub'
import LoginPage from './pages/LoginPage'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ForcePasswordReset from './pages/ForcePasswordReset'

// Admin Views
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogsPage from './pages/admin/AdminLogsPage'
import AdminMarksPage from './pages/admin/AdminMarksPage'
import AdminStudentsPage from './pages/admin/AdminStudentsPage'
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage'
import AdminSemestersPage from './pages/admin/AdminSemestersPage'
import AdminExamsPage from './pages/admin/AdminExamsPage'

// Student Views
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfilePage from './pages/student/StudentProfilePage'
import StudentResultsPage from './pages/student/StudentResultsPage'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-panel text-slate-800 text-sm font-medium border border-slate-200/50 shadow-soft',
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginHub />} />
        <Route path="/login/:role" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/teacher" element={<Navigate to="/login" replace />} />
        <Route path="/faculty" element={<Navigate to="/login" replace />} />
        
        {/* Recovery routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Intercept forced reset */}
        <Route
          path="/force-password-reset"
          element={
            <ProtectedRoute allowedRoles={['admin', 'student']}>
              <ForcePasswordReset />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="marks" element={<AdminMarksPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="departments" element={<AdminDepartmentsPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="subjects" element={<AdminSubjectsPage />} />
          <Route path="semesters" element={<AdminSemestersPage />} />
          <Route path="exams" element={<AdminExamsPage />} />
          <Route path="logs" element={<AdminLogsPage />} />
        </Route>

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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
