import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './AdminLayout.css'

const NAV = [
  { to: '/admin', label: 'Home', icon: '🏠', end: true },
  { to: '/admin/students', label: 'Students', icon: '👥' },
  { to: '/admin/sitin', label: 'Sit-in', icon: '💻' },
  { to: '/admin/records', label: 'Records', icon: '📋' },
  { to: '/admin/reports', label: 'Reports', icon: '📊' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        {/* Brand with logos */}
        <div className="sidebar-brand">
          <div className="sidebar-logos">
            <img src="/ccs-logo.jpg" alt="CICS" className="sb-ccs-logo" />
            <img src="/uc-logo.png" alt="UC" className="sb-uc-logo" />
          </div>
          <div>
            <div className="sidebar-name">CICS Admin</div>
            <div className="sidebar-role">Sit-in Monitor</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="sidebar-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
            <div>
              <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm sidebar-logout" onClick={handleLogout}>
            ↩ Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
