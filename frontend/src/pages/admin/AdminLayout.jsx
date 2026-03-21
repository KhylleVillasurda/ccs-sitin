import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './AdminLayout.css'

const NAV = [
  { to:'/admin',          label:'Home',    icon:'bi-house',          end:true },
  { to:'/admin/students', label:'Students',icon:'bi-people'               },
  { to:'/admin/sitin',    label:'Sit-in',  icon:'bi-display'              },
  { to:'/admin/records',  label:'Records', icon:'bi-journal-text'         },
  { to:'/admin/reports',  label:'Reports', icon:'bi-bar-chart-line'       },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logos">
            <img src="/ccs-logo.jpg" alt="CICS" className="sb-ccs-logo"
              onError={e => e.target.style.display='none'} />
            <img src="/uc-logo.png" alt="UC" className="sb-uc-logo"
              onError={e => e.target.style.display='none'} />
          </div>
          <div className="sidebar-text">
            <div className="sidebar-name">CICS Admin</div>
            <div className="sidebar-role">Sit-in Monitor</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `sidebar-link${isActive?' active':''}`}>
              <i className={`bi ${n.icon} sidebar-icon`} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
            <div style={{ overflow:'hidden' }}>
              <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm sidebar-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" /> Logout
          </button>
        </div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  )
}
