import { useState, useEffect } from 'react'
import api from '../../api'

const PURPOSE_COLORS = {
  'C Programming': '#e69875',
  'Java': '#dbbc7f',
  'PHP': '#a7c080',
  'ASP.Net': '#83c092',
  'C#': '#7fbbb3',
  'Python': '#d699b6',
  'Other': '#9da9a0',
}

export default function AdminHome() {
  const [stats, setStats] = useState(null)
  const [purposeData, setPurposeData] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [newAnn, setNewAnn] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [s, p, a] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reports/by-purpose'),
        api.get('/announcements/'),
      ])
      setStats(s.data)
      setPurposeData(p.data)
      setAnnouncements(a.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const postAnn = async () => {
    if (!newAnn.trim()) return
    setPosting(true)
    try {
      await api.post('/announcements/', { content: newAnn.trim() })
      setNewAnn('')
      setMsg('Announcement posted!')
      load()
      setTimeout(() => setMsg(''), 3000)
    } catch { setMsg('Failed to post') }
    finally { setPosting(false) }
  }

  const deleteAnn = async (id) => {
    await api.delete(`/announcements/${id}`)
    load()
  }

  const total = purposeData.reduce((s, d) => s + d.count, 0) || 1

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of the CCS Sit-in Monitoring System</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(127,187,179,0.15)' }}>👥</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>
              {loading ? '—' : stats?.students_registered ?? 0}
            </div>
            <div className="stat-label">Students Registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(167,192,128,0.15)' }}>✅</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>
              {loading ? '—' : stats?.currently_sitin ?? 0}
            </div>
            <div className="stat-label">Currently Sitting In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(230,152,117,0.15)' }}>📋</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>
              {loading ? '—' : stats?.total_sitin ?? 0}
            </div>
            <div className="stat-label">Total Sit-ins</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Chart */}
        <div className="card">
          <div className="section-title">📊 Sessions by Purpose</div>
          {purposeData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No sit-in data yet</div>
            </div>
          ) : (
            <div>
              {purposeData.map(d => {
                const pct = Math.round((d.count / total) * 100)
                const color = PURPOSE_COLORS[d.purpose] || PURPOSE_COLORS['Other']
                return (
                  <div key={d.purpose} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--fg)' }}>{d.purpose}</span>
                      <span style={{ color: 'var(--fg-dim)' }}>{d.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg3)', borderRadius: '3px' }}>
                      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="section-title">📣 Announcements</div>
          <div style={{ marginBottom: '1rem' }}>
            <textarea
              className="input"
              rows={3}
              placeholder="Write a new announcement…"
              value={newAnn}
              onChange={e => setNewAnn(e.target.value)}
              style={{ resize: 'vertical', marginBottom: '0.5rem' }}
            />
            {msg && <div style={{ fontSize: '0.8rem', color: 'var(--green)', marginBottom: '0.5rem' }}>✓ {msg}</div>}
            <button className="btn btn-primary btn-sm" onClick={postAnn} disabled={posting}>
              {posting ? 'Posting…' : '📣 Post Announcement'}
            </button>
          </div>
          <div className="divider" />
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">No announcements yet</div>
              </div>
            ) : announcements.map(a => (
              <div key={a.id} style={{ background: 'var(--bg2)', borderRadius: '7px', padding: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>
                      {a.author} · {a.created_at?.slice(0, 10)}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--fg)', lineHeight: '1.5' }}>{a.content}</p>
                  </div>
                  <button onClick={() => deleteAnn(a.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--fg-dim)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem', flexShrink: 0 }}
                    title="Delete">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
