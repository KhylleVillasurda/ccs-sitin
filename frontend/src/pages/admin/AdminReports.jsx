import { useState, useEffect } from 'react'
import api from '../../api'

const SLICE_COLORS = ['#e69875','#dbbc7f','#a7c080','#83c092','#7fbbb3','#d699b6','#9da9a0']

// ── Reusable donut — handles 0, 1, and N slices ──────────────────────────────
function DonutChart({ data, colors, centerLabel = 'TOTAL', emptyText = 'No data yet' }) {
  const size = 180, cx = 90, cy = 90, R = 68, r = 42
  const total = data.reduce((s, d) => s + d.count, 0)

  if (total === 0) return (
    <div className="empty-state">
      <i className="bi bi-pie-chart" style={{ fontSize:'2rem', opacity:0.35 }} />
      <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>{emptyText}</div>
    </div>
  )

  // Single slice — SVG arc math breaks at 360°, use concentric circles
  if (data.length === 1) {
    const color = colors[0]
    const label = data[0].purpose ?? data[0].lab ?? data[0].name ?? '?'
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={cx} cy={cy} r={R} fill={color} opacity={0.88} />
          <circle cx={cx} cy={cy} r={r} fill="var(--surface)" />
          <text x={cx} y={cy - 5} textAnchor="middle"
            style={{ fill:'var(--fg)', fontSize:18, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>{total}</text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            style={{ fill:'var(--fg-dim)', fontSize:8, fontFamily:"'Outfit',sans-serif" }}>{centerLabel}</text>
        </svg>
        <div style={{ display:'flex', alignItems:'center', gap:'0.45rem', fontSize:'0.78rem' }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:color }} />
          <span style={{ color:'var(--fg)' }}>{label}</span>
          <span style={{ color:'var(--fg-dim)', marginLeft:'0.25rem' }}>100%</span>
        </div>
      </div>
    )
  }

  // Multiple slices
  let cumAngle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const angle  = (d.count / total) * 2 * Math.PI
    const startA = cumAngle
    const endA   = cumAngle + angle - 0.01
    cumAngle     = cumAngle + angle
    const x1  = cx + R*Math.cos(startA), y1  = cy + R*Math.sin(startA)
    const x2  = cx + R*Math.cos(endA),   y2  = cy + R*Math.sin(endA)
    const ix1 = cx + r*Math.cos(startA), iy1 = cy + r*Math.sin(startA)
    const ix2 = cx + r*Math.cos(endA),   iy2 = cy + r*Math.sin(endA)
    const large = angle > Math.PI ? 1 : 0
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`
    const label = d.purpose ?? d.lab ?? d.name ?? '?'
    return { path, color: colors[i % colors.length], label, count: d.count, pct: Math.round((d.count/total)*100) }
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow:'visible' }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.88}
            style={{ transition:'opacity 0.15s', cursor:'default' }}
            onMouseEnter={e => e.target.setAttribute('opacity','1')}
            onMouseLeave={e => e.target.setAttribute('opacity','0.88')}>
            <title>{s.label}: {s.count} ({s.pct}%)</title>
          </path>
        ))}
        <text x={cx} y={cy-5} textAnchor="middle"
          style={{ fill:'var(--fg)', fontSize:20, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>{total}</text>
        <text x={cx} y={cy+9} textAnchor="middle"
          style={{ fill:'var(--fg-dim)', fontSize:8, fontFamily:"'Outfit',sans-serif" }}>{centerLabel}</text>
      </svg>
      <div style={{ display:'grid', gridTemplateColumns: slices.length > 4 ? '1fr 1fr' : '1fr', gap:'0.3rem 1.25rem', width:'100%', maxWidth:200 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.78rem' }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:s.color, flexShrink:0 }} />
            <span style={{ color:'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</span>
            <span style={{ color:'var(--fg-dim)', marginLeft:'auto', flexShrink:0 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────

export default function AdminReports() {
  const [stats, setStats]         = useState(null)
  const [byPurpose, setByPurpose] = useState([])
  const [byLab, setByLab]         = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([api.get('/reports/stats'), api.get('/reports/by-purpose'), api.get('/reports/by-lab')])
      .then(([s, p, l]) => { setStats(s.data); setByPurpose(p.data); setByLab(l.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh', color:'var(--fg-dim)' }}>
      Loading…
    </div>
  )

  // Remap lab rows so DonutChart can read the label generically
  const labData = byLab.map(d => ({ ...d, purpose: `Lab ${d.lab}` }))

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and usage breakdown</p>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(127,187,179,0.15)' }}>
            <i className="bi bi-people-fill" style={{ color:'var(--blue)', fontSize:'1.2rem' }} />
          </div>
          <div>
            <div className="stat-value" style={{ color:'var(--blue)' }}>{stats?.students_registered??0}</div>
            <div className="stat-label">Students Registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(167,192,128,0.15)' }}>
            <i className="bi bi-display-fill" style={{ color:'var(--green)', fontSize:'1.2rem' }} />
          </div>
          <div>
            <div className="stat-value" style={{ color:'var(--green)' }}>{stats?.currently_sitin??0}</div>
            <div className="stat-label">Currently Sitting In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(219,188,127,0.15)' }}>
            <i className="bi bi-pie-chart-fill" style={{ color:'var(--accent)', fontSize:'1.2rem' }} />
          </div>
          <div>
            <div className="stat-value" style={{ color:'var(--accent)' }}>{stats?.total_sitin??0}</div>
            <div className="stat-label">Total Sit-in Sessions</div>
          </div>
        </div>
      </div>

      {/* Two donuts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className="section-title" style={{ alignSelf:'flex-start', marginBottom:'1.25rem' }}>
            <i className="bi bi-pie-chart-fill" /> Sessions by Purpose
          </div>
          <DonutChart data={byPurpose} colors={SLICE_COLORS} centerLabel="BY PURPOSE" />
        </div>
        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className="section-title" style={{ alignSelf:'flex-start', marginBottom:'1.25rem' }}>
            <i className="bi bi-pie-chart" /> Sessions by Lab
          </div>
          <DonutChart data={labData} colors={[...SLICE_COLORS].reverse()} centerLabel="BY LAB" />
        </div>
      </div>
    </div>
  )
}
