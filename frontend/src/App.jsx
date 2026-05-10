import { Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// ── Eager imports — same as original, lazy removed to prevent silent crashes ──
import Landing           from './pages/Landing'
import Login             from './pages/Login'
import Register          from './pages/Register'
import AdminLayout        from './pages/admin/AdminLayout'
import AdminHome          from './pages/admin/AdminHome'
import AdminStudents      from './pages/admin/AdminStudents'
import AdminSitin         from './pages/admin/AdminSitin'
import AdminRecords       from './pages/admin/AdminRecords'
import AdminReports       from './pages/admin/AdminReports'
import AdminFeedbacks     from './pages/admin/AdminFeedbacks'
import AdminReservations  from './pages/admin/AdminReservations'
import StudentDashboard   from './pages/student/StudentDashboard'

// ── Error boundary — surfaces JS crashes as readable messages ─────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'var(--bg, #2d353b)', color: 'var(--red, #e67e80)',
        fontFamily: 'monospace', padding: '2rem', gap: '1rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <strong style={{ fontSize: '1rem', color: 'var(--fg, #d3c6aa)' }}>
          Something went wrong
        </strong>
        <pre style={{
          fontSize: '0.78rem', background: 'var(--bg2, #3d484d)',
          padding: '1rem', borderRadius: '8px', maxWidth: '640px',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: 'var(--orange, #e69875)', textAlign: 'left',
        }}>
          {this.state.error.message}
        </pre>
        <button
          style={{
            marginTop: '0.5rem', padding: '0.5rem 1.2rem', borderRadius: '6px',
            background: 'var(--accent, #dbbc7f)', color: 'var(--bg, #2d353b)',
            border: 'none', cursor: 'pointer', fontFamily: 'monospace',
          }}
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    )
  }
}

// ── Route guard ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

// ── Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Landing />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/register"  element={<Register />} />

      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route index               element={<AdminHome />} />
        <Route path="students"     element={<AdminStudents />} />
        <Route path="sitin"        element={<AdminSitin />} />
        <Route path="records"      element={<AdminRecords />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="reports"      element={<AdminReports />} />
        <Route path="feedbacks"    element={<AdminFeedbacks />} />
      </Route>

      <Route path="/student" element={
        <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
