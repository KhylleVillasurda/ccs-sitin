import { useState, useEffect } from 'react'
import api from '../../api'

const COLORS = ['#dbbc7f','#e69875','#a7c080','#83c092','#7fbbb3','#d699b6','#9da9a0']

function Bar({ label, count, max, color }) {
  const pct = max>0 ? Math.round((count/max)*100) : 0
  return (
    <div style={{ marginBottom:'0.9rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem', fontSize:'0.85rem' }}>
        <span>{label}</span>
        <span style={{ color:'var(--fg-dim)', flexShrink:0, marginLeft:'0.5rem' }}>{count}</span>
      </div>
      <div style={{ height:'8px', background:'var(--bg3)', borderRadius:'4px' }}>
        <div style={{ width:pct+'%', height:'100%', background:color, borderRadius:'4px', transition:'width 0.6s ease' }}/>
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
    Promise.all([api.get('/reports/stats'),api.get('/reports/by-purpose'),api.get('/reports/by-lab')])
      .then(([s,p,l])=>{ setStats(s.data); setByPurpose(p.data); setByLab(l.data) })
      .finally(()=>setLoading(false))
  }, [])

  const maxP = Math.max(...byPurpose.map(d=>d.count),1)
  const maxL = Math.max(...byLab.map(d=>d.count),1)

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh', color:'var(--fg-dim)' }}>Loading…</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and usage breakdown</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(127,187,179,0.15)' }}><i className="bi bi-people-fill"></i></div>
          <div><div className="stat-value" style={{ color:'var(--blue)' }}>{stats?.students_registered??0}</div><div className="stat-label">Students Registered</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(167,192,128,0.15)' }}><i className="bi bi-check-circle-fill"></i></div>
          <div><div className="stat-value" style={{ color:'var(--green)' }}>{stats?.currently_sitin??0}</div><div className="stat-label">Currently Sitting In</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(219,188,127,0.15)' }}><i className="bi bi-bar-chart-fill"></i></div>
          <div><div className="stat-value" style={{ color:'var(--accent)' }}>{stats?.total_sitin??0}</div><div className="stat-label">Total Sit-in Sessions</div></div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        <div className="card">
          <div className="section-title">Sessions by Purpose</div>
          {byPurpose.length===0
            ? <div className="empty-state"><div className="empty-state-icon"><i className="bi bi-bar-chart-fill"></i></div><div className="empty-state-text">No data yet</div></div>
            : byPurpose.map((d,i)=><Bar key={d.purpose} label={d.purpose} count={d.count} max={maxP} color={COLORS[i%COLORS.length]}/>)
          }
        </div>
        <div className="card">
          <div className="section-title">Sessions by Lab</div>
          {byLab.length===0
            ? <div className="empty-state"><div className="empty-state-icon">🏛️</div><div className="empty-state-text">No data yet</div></div>
            : byLab.map((d,i)=><Bar key={d.lab} label={`Lab ${d.lab}`} count={d.count} max={maxL} color={COLORS[(i+3)%COLORS.length]}/>)
          }
        </div>
      </div>
    </div>
  )
}
