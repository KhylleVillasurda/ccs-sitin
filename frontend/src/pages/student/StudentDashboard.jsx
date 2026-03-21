import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../api'
import EditProfile from './EditProfile'
import UserAvatar from '../../components/UserAvatar'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords]             = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showEdit, setShowEdit]           = useState(false)

  const load = () => {
    Promise.all([
      api.get(`/sitin/student/${user.id_number}`),
      api.get('/announcements/'),
    ]).then(([r, a]) => {
      setRecords(r.data)
      setAnnouncements(a.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user.id_number])

  const handleLogout = () => { logout(); navigate('/') }
  const handleProfileSaved = (updatedUser) => {
    login(updatedUser, localStorage.getItem('token'))
    setShowEdit(false)
  }

  const active = records.filter(r => r.status === 'active')
  const done   = records.filter(r => r.status === 'done')

  return (
    <div className="student-page">
      {showEdit && (
        <EditProfile
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {/* ── Topbar — initials only, no photo ── */}
      <header className="student-topbar">
        <div className="student-brand">
          <img src="/ccs-logo.jpg" alt="CICS"
            style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }}
            onError={e => e.target.style.display='none'} />
          <img src="/uc-logo.png" alt="UC"
            style={{ height:22, width:'auto', objectFit:'contain' }}
            onError={e => e.target.style.display='none'} />
          <span className="student-brand-text">CCS Sit-in Monitor</span>
        </div>
        <div className="student-topbar-right">
          <div className="student-nav-user">
            <div className="student-avatar">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <span className="student-nav-name">{user.first_name} {user.last_name}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
            <i className="bi bi-pencil-square" /> Edit Profile
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" /> Logout
          </button>
        </div>
      </header>

      <div className="student-content">

        {/* ── Welcome ── */}
        <div className="student-welcome">
          <h1>Welcome, <span style={{ color:'var(--accent)' }}>{user.first_name} {user.last_name}</span></h1>
          <p style={{ color:'var(--fg-dim)', marginTop:'0.2rem', fontSize:'0.875rem' }}>
            {user.id_number} &nbsp;·&nbsp; {user.course} &nbsp;·&nbsp; Year {user.course_level}
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="student-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background:'rgba(219,188,127,0.15)' }}>
              <i className="bi bi-ticket-perforated" style={{ color:'var(--accent)', fontSize:'1.2rem' }} />
            </div>
            <div>
              <div className="stat-value" style={{ color:'var(--accent)' }}>{user.remaining_sessions}</div>
              <div className="stat-label">Sessions Remaining</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:'rgba(167,192,128,0.15)' }}>
              <i className="bi bi-display" style={{ color:'var(--green)', fontSize:'1.2rem' }} />
            </div>
            <div>
              <div className="stat-value" style={{ color:'var(--green)' }}>{active.length}</div>
              <div className="stat-label">Active Sit-in</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:'rgba(127,187,179,0.15)' }}>
              <i className="bi bi-check2-circle" style={{ color:'var(--blue)', fontSize:'1.2rem' }} />
            </div>
            <div>
              <div className="stat-value" style={{ color:'var(--blue)' }}>{done.length}</div>
              <div className="stat-label">Completed Sessions</div>
            </div>
          </div>
        </div>

        {/* ── Active sit-in banner ── */}
        {active.length > 0 && (
          <div className="active-sitin-banner">
            <i className="bi bi-circle-fill" style={{ color:'var(--green)', fontSize:'0.55rem' }} />
            <span>
              <strong>Currently sitting in:</strong> {active[0].purpose} — Lab {active[0].lab}
            </span>
            <span style={{ marginLeft:'auto', fontSize:'0.78rem', color:'var(--fg-dim)' }}>
              Since {active[0].time_in?.slice(0,16).replace('T',' ')}
            </span>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="student-main-grid">

          {/* LEFT — Announcements */}
          <div className="student-announcements-col">
            <div className="card">
              <div className="section-title">
                <i className="bi bi-megaphone" /> Announcements
              </div>
              {announcements.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox" style={{ fontSize:'2rem', opacity:0.4 }} />
                  <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No announcements yet</div>
                </div>
              ) : (
                <div className="ann-list">
                  {announcements.map((a, i) => (
                    <div key={a.id} className={`ann-item${i===0?' ann-item-latest':''}`}>
                      <div className="ann-meta">
                        <i className="bi bi-person-circle" />
                        <span>{a.author}</span>
                        <span className="ann-date">
                          {a.created_at
                            ? new Date(a.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
                            : ''}
                        </span>
                        {i === 0 && <span className="badge badge-orange" style={{ fontSize:'0.65rem' }}>Latest</span>}
                      </div>
                      <p className="ann-content">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Profile card with photo */}
          <div className="student-side-col">
            <div className="card student-profile-card">
              <div className="section-title">
                <i className="bi bi-person-badge" /> My Profile
              </div>

              {/* Avatar — profile picture shown here only */}
              <div className="profile-avatar-row">
                <div
                  className="profile-avatar-clickable"
                  onClick={() => setShowEdit(true)}
                  title="Click to change photo"
                >
                  <UserAvatar user={user} size={72} fontSize="1.5rem" />
                  <div className="profile-avatar-overlay">
                    <i className="bi bi-camera" />
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.95rem' }}>
                    {user.first_name}{user.middle_name ? ' '+user.middle_name[0]+'.' : ''} {user.last_name}
                  </div>
                  <div style={{ color:'var(--fg-dim)', fontSize:'0.8rem', marginTop:'0.15rem' }}>
                    {user.course} — Year {user.course_level}
                  </div>
                </div>
              </div>

              <div className="divider" style={{ margin:'1rem 0' }} />

              <div className="profile-details">
                <div className="profile-detail-row">
                  <i className="bi bi-hash" />
                  <span className="pd-label">Student ID</span>
                  <span className="pd-value" style={{ fontFamily:'monospace', color:'var(--blue)' }}>{user.id_number}</span>
                </div>
                {user.email && (
                  <div className="profile-detail-row">
                    <i className="bi bi-envelope" />
                    <span className="pd-label">Email</span>
                    <span className="pd-value">{user.email}</span>
                  </div>
                )}
                {user.address && (
                  <div className="profile-detail-row">
                    <i className="bi bi-geo-alt" />
                    <span className="pd-label">Address</span>
                    <span className="pd-value">{user.address}</span>
                  </div>
                )}
              </div>

              <button
                className="btn btn-ghost btn-sm"
                style={{ width:'100%', justifyContent:'center', marginTop:'1rem' }}
                onClick={() => setShowEdit(true)}
              >
                <i className="bi bi-pencil-square" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── Sit-in History ── */}
        <div style={{ marginTop:'1.5rem' }}>
          <div className="section-title">
            <i className="bi bi-clock-history" /> Sit-in History
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Purpose</th><th>Lab</th><th>Status</th><th>Time In</th><th>Time Out</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <i className="bi bi-journal-x" style={{ fontSize:'2rem', opacity:0.4 }} />
                      <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No sit-in history yet</div>
                    </div>
                  </td></tr>
                ) : records.map(r => (
                  <tr key={r.id}>
                    <td style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.id}</td>
                    <td><span className="badge badge-orange">{r.purpose}</span></td>
                    <td style={{ color:'var(--fg-dim)' }}>Lab {r.lab}</td>
                    <td>
                      <span className={`badge ${r.status==='active'?'badge-green':'badge-blue'}`}>
                        {r.status === 'active'
                          ? <><i className="bi bi-circle-fill" style={{ fontSize:'0.45rem', verticalAlign:'middle', marginRight:'3px' }} />Active</>
                          : <><i className="bi bi-check-circle" style={{ fontSize:'0.7rem', verticalAlign:'middle', marginRight:'3px' }} />Done</>
                        }
                      </span>
                    </td>
                    <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.time_in?.slice(0,16).replace('T',' ')}</td>
                    <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.time_out?.slice(0,16).replace('T',' ')||'—'}</td>
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
