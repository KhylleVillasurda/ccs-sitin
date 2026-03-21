import { useState, useEffect } from 'react'
import api from '../../api'

const SLICE_COLORS = ['#e69875','#dbbc7f','#a7c080','#83c092','#7fbbb3','#d699b6','#9da9a0']

// ── Pure SVG donut chart ─────────────────────────────────────────────────────
function DonutChart({ data, colors, emptyText = 'No sit-in data yet' }) {
  const size = 200, cx = 100, cy = 100, R = 75, r = 46
  const total = data.reduce((s, d) => s + d.count, 0)

  if (total === 0) return (
    <div className="empty-state">
      <i className="bi bi-pie-chart" style={{ fontSize: '2rem', opacity: 0.35 }} />
      <div className="empty-state-text" style={{ marginTop: '0.5rem' }}>{emptyText}</div>
    </div>
  )

  // ── Single-slice: SVG arc can't do a full 360°, use circles instead ──────
  if (data.length === 1) {
    const color = colors[0]
    const pct = 100
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={R} fill={color} opacity={0.88} />
          {/* Inner hole */}
          <circle cx={cx} cy={cy} r={r} fill="var(--surface)" />
          {/* Centre text */}
          <text x={cx} y={cy - 6} textAnchor="middle"
            style={{ fill:'var(--fg)', fontSize:22, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle"
            style={{ fill:'var(--fg-dim)', fontSize:9, fontFamily:"'Outfit',sans-serif" }}>
            TOTAL SIT-INS
          </text>
        </svg>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.78rem' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:color }} />
          <span style={{ color:'var(--fg)' }}>{data[0].purpose}</span>
          <span style={{ color:'var(--fg-dim)', marginLeft:'0.25rem' }}>100%</span>
        </div>
      </div>
    )
  }

  // ── Multi-slice ───────────────────────────────────────────────────────────
  let cumAngle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const angle  = (d.count / total) * 2 * Math.PI
    const startA = cumAngle
    const endA   = cumAngle + angle - 0.01   // tiny gap between slices
    cumAngle     = cumAngle + angle

    const x1  = cx + R * Math.cos(startA),  y1  = cy + R * Math.sin(startA)
    const x2  = cx + R * Math.cos(endA),    y2  = cy + R * Math.sin(endA)
    const ix1 = cx + r * Math.cos(startA),  iy1 = cy + r * Math.sin(startA)
    const ix2 = cx + r * Math.cos(endA),    iy2 = cy + r * Math.sin(endA)
    const large = angle > Math.PI ? 1 : 0

    const path = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1}`,
      'Z'
    ].join(' ')

    return {
      path,
      color: colors[i % colors.length],
      label: d.purpose ?? d.lab ?? d.name,
      count: d.count,
      pct: Math.round((d.count / total) * 100),
    }
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ overflow:'visible' }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.88}
            style={{ transition:'opacity 0.15s', cursor:'default' }}
            onMouseEnter={e => e.target.setAttribute('opacity', '1')}
            onMouseLeave={e => e.target.setAttribute('opacity', '0.88')}>
            <title>{s.label}: {s.count} ({s.pct}%)</title>
          </path>
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle"
          style={{ fill:'var(--fg)', fontSize:22, fontWeight:700, fontFamily:"'Outfit',sans-serif" }}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle"
          style={{ fill:'var(--fg-dim)', fontSize:9, fontFamily:"'Outfit',sans-serif" }}>
          TOTAL SIT-INS
        </text>
      </svg>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: slices.length > 4 ? '1fr 1fr' : '1fr',
        gap: '0.3rem 1.5rem',
        width: '100%',
        maxWidth: 220,
      }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.45rem', fontSize:'0.78rem' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }} />
            <span style={{ color:'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {s.label}
            </span>
            <span style={{ color:'var(--fg-dim)', marginLeft:'auto', flexShrink:0 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminHome() {
  const [stats, setStats]               = useState(null)
  const [purposeData, setPurposeData]   = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [newAnn, setNewAnn]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [posting, setPosting]           = useState(false)
  const [msg, setMsg]                   = useState('')

  const load = async () => {
    try {
      const [s, p, a] = await Promise.all([
        api.get('/reports/stats'),
        api.get('/reports/by-purpose'),
        api.get('/announcements/'),
      ])
      setStats(s.data); setPurposeData(p.data); setAnnouncements(a.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const postAnn = async () => {
    if (!newAnn.trim()) return
    setPosting(true)
    try {
      await api.post('/announcements/', { content: newAnn.trim() })
      setNewAnn(''); setMsg('Posted!'); load()
      setTimeout(() => setMsg(''), 3000)
    } catch { setMsg('Failed to post') }
    finally { setPosting(false) }
  }
  const deleteAnn = async id => { await api.delete(`/announcements/${id}`); load() }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of the CCS Sit-in Monitoring System</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(127,187,179,0.15)' }}>
            <i className="bi bi-people-fill" style={{ color:'var(--blue)', fontSize:'1.2rem' }} />
          </div>
          <div>
            <div className="stat-value" style={{ color:'var(--blue)' }}>{loading?'—':stats?.students_registered??0}</div>
            <div className="stat-label">Students Registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(167,192,128,0.15)' }}>
            <i className="bi bi-display-fill" style={{ color:'var(--green)', fontSize:'1.2rem' }} />
          </div>
          <div>
            <div className="stat-value" style={{ color:'var(--green)' }}>{loading?'—':stats?.currently_sitin??0}</div>
            <div className="stat-label">Currently Sitting In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(219,188,127,0.15)' }}>
            <i className="bi bi-journal-check" style={{ color:'var(--accent)', fontSize:'1.2rem' }} />
          </div>
          <div>
            <div className="stat-value" style={{ color:'var(--accent)' }}>{loading?'—':stats?.total_sitin??0}</div>
            <div className="stat-label">Total Sit-ins</div>
          </div>
        </div>
      </div>

      {/* Donut + Announcements */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'stretch' }}>

        <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className="section-title" style={{ alignSelf:'flex-start', marginBottom:'1.25rem' }}>
            <i className="bi bi-pie-chart-fill" /> Sessions by Purpose
          </div>
          <DonutChart data={purposeData} colors={SLICE_COLORS} />
        </div>

        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div className="section-title">
            <i className="bi bi-megaphone-fill" /> Announcements
          </div>
          <textarea className="input" rows={3}
            placeholder="Write a new announcement…"
            value={newAnn} onChange={e => setNewAnn(e.target.value)}
            style={{ resize:'vertical', marginBottom:'0.5rem' }} />
          {msg && <div style={{ fontSize:'0.8rem', color:'var(--green)', marginBottom:'0.5rem' }}>{msg}</div>}
          <button className="btn btn-primary btn-sm" onClick={postAnn} disabled={posting}
            style={{ marginBottom:'1rem', alignSelf:'flex-start' }}>
            <i className="bi bi-send" /> {posting ? 'Posting…' : 'Post Announcement'}
          </button>
          <div className="divider" style={{ margin:'0 0 0.75rem' }} />
          {/* Scrollable list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            paddingRight: '2px',
          }}>
            {announcements.length === 0
              ? <div className="empty-state" style={{ padding:'1.5rem' }}>
                  <i className="bi bi-inbox" style={{ fontSize:'2rem', opacity:0.4 }} />
                  <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No announcements yet</div>
                </div>
              : announcements.map(a => (
                <div key={a.id} style={{
                  background:'var(--bg2)', borderRadius:'7px',
                  padding:'0.7rem 0.85rem', border:'1px solid var(--border)',
                  flexShrink: 0,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'0.7rem', color:'var(--accent)', marginBottom:'0.2rem' }}>
                        {a.author} · {a.created_at?.slice(0,10)}
                      </div>
                      <p style={{ fontSize:'0.85rem', lineHeight:'1.5', wordBreak:'break-word' }}>{a.content}</p>
                    </div>
                    <button onClick={() => deleteAnn(a.id)} title="Delete"
                      style={{ background:'none', border:'none', color:'var(--fg-dim)', cursor:'pointer', flexShrink:0, padding:'0.1rem', fontSize:'0.9rem' }}>
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
