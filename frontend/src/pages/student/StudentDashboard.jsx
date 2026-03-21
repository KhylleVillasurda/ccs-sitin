import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../api'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/sitin/student/${user.id_number}`),
      api.get('/announcements/'),
    ]).then(([r, a]) => {
      setRecords(r.data)
      setAnnouncements(a.data)
    }).finally(() => setLoading(false))
  }, [user.id_number])

  const handleLogout = () => { logout(); navigate('/') }

  const active = records.filter(r => r.status === 'active')
  const done = records.filter(r => r.status === 'done')

  return (
    <div className="student-page">
      {/* Topbar */}
      <header className="student-topbar">
        <div className="student-brand">
          <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}><img src="/ccs-logo.jpg" alt="CICS" style={{width:26,height:26,borderRadius:"50%",objectFit:"cover"}}/><img src="/uc-logo.png" alt="UC" style={{height:20,width:"auto",objectFit:"contain"}}/></div>
          <span>CCS Sit-in Monitor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="student-nav-user">
            <div className="student-avatar">{user.first_name?.[0]}{user.last_name?.[0]}</div>
            <span>{user.first_name} {user.last_name}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>↩ Logout</button>
        </div>
      </header>

      <div className="student-content">
        {/* Welcome */}
        <div className="student-welcome">
          <div>
            <h1>Welcome back, <span style={{ color: 'var(--accent)' }}>{user.first_name}</span> 👋</h1>
            <p style={{ color: 'var(--fg-dim)', marginTop: '0.25rem' }}>
              {user.id_number} · {user.course} Year {user.course_level}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="student-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(230,152,117,0.15)' }}>🎫</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{user.remaining_sessions}</div>
              <div className="stat-label">Sessions Remaining</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(167,192,128,0.15)' }}>✅</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{active.length}</div>
              <div className="stat-label">Active Sit-in</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(127,187,179,0.15)' }}>📋</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--blue)' }}>{done.length}</div>
              <div className="stat-label">Completed Sessions</div>
            </div>
          </div>
        </div>

        <div className="student-grid">
          {/* Current active */}
          {active.length > 0 && (
            <div className="card student-active-card">
              <div className="section-title" style={{ color: 'var(--green)' }}>● Currently Sitting In</div>
              {active.map(r => (
                <div key={r.id} style={{ background: 'rgba(167,192,128,0.08)', border: '1px solid rgba(167,192,128,0.2)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{r.purpose}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--fg-dim)' }}>Lab {r.lab} · Since {r.time_in?.slice(0,16).replace('T',' ')}</div>
                </div>
              ))}
            </div>
          )}

          {/* Announcements */}
          <div className="card">
            <div className="section-title">📣 Announcements</div>
            {announcements.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No announcements</div></div>
            ) : announcements.slice(0,5).map(a => (
              <div key={a.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>
                  {a.author} · {a.created_at?.slice(0,10)}
                </div>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.55' }}>{a.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sit-in History */}
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📋 My Sit-in History</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Purpose</th>
                  <th>Lab</th>
                  <th>Status</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--fg-dim)' }}>Loading…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-text">No sit-in history yet</div>
                    </div>
                  </td></tr>
                ) : records.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--fg-dim)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.id}</td>
                    <td><span className="badge badge-orange">{r.purpose}</span></td>
                    <td style={{ color: 'var(--fg-dim)' }}>Lab {r.lab}</td>
                    <td><span className={`badge ${r.status === 'active' ? 'badge-green' : 'badge-blue'}`}>
                      {r.status === 'active' ? '● Active' : '✓ Done'}
                    </span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--fg-dim)' }}>{r.time_in?.slice(0,16).replace('T',' ')}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--fg-dim)' }}>{r.time_out?.slice(0,16).replace('T',' ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
