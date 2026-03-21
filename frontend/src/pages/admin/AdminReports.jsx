import { useState, useEffect } from 'react'
import api from '../../api'

const COLORS = ['#e69875','#dbbc7f','#a7c080','#83c092','#7fbbb3','#d699b6','#9da9a0']

function Bar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--fg-dim)' }}>{count} sessions</span>
      </div>
      <div style={{ height: '10px', background: 'var(--bg3)', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{
          width: pct + '%', height: '100%', background: color, borderRadius: '5px',
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
        }} />
      </div>
    </div>
  )
}

export default function AdminReports() {
  const [stats, setStats] = useState(null)
  const [byPurpose, setByPurpose] = useState([])
  const [byLab, setByLab] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/stats'),
      api.get('/reports/by-purpose'),
      api.get('/reports/by-lab'),
    ]).then(([s, p, l]) => {
      setStats(s.data)
      setByPurpose(p.data)
      setByLab(l.data)
    }).finally(() => setLoading(false))
  }, [])

  const maxPurpose = Math.max(...byPurpose.map(d => d.count), 1)
  const maxLab = Math.max(...byLab.map(d => d.count), 1)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--fg-dim)' }}>
      Loading reports…
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Analytics and usage breakdown</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(127,187,179,0.15)' }}>👥</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats?.students_registered ?? 0}</div>
            <div className="stat-label">Students Registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(167,192,128,0.15)' }}>✅</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.currently_sitin ?? 0}</div>
            <div className="stat-label">Currently Sitting In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(230,152,117,0.15)' }}>📊</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats?.total_sitin ?? 0}</div>
            <div className="stat-label">Total Sit-in Sessions</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="section-title">🎯 Sessions by Purpose</div>
          {byPurpose.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No data yet</div></div>
          ) : byPurpose.map((d, i) => (
            <Bar key={d.purpose} label={d.purpose} count={d.count} max={maxPurpose} color={COLORS[i % COLORS.length]} />
          ))}
        </div>

        <div className="card">
          <div className="section-title">🏛️ Sessions by Lab</div>
          {byLab.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🏛️</div><div className="empty-state-text">No data yet</div></div>
          ) : byLab.map((d, i) => (
            <Bar key={d.lab} label={`Lab ${d.lab}`} count={d.count} max={maxLab} color={COLORS[(i+3) % COLORS.length]} />
          ))}
        </div>
      </div>

      {/* Legend */}
      {byPurpose.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="section-title">🗂️ Purpose Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {byPurpose.map((d, i) => {
              const total = byPurpose.reduce((s, x) => s + x.count, 0)
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
              return (
                <div key={d.purpose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem' }}>{d.purpose}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--fg-dim)' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
