import { useState, useEffect, useMemo } from 'react'
import api from '../../api'

export default function AdminRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/sitin/records').then(r=>setRecords(r.data)).finally(()=>setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let r = records
    if (filter!=='all') r = r.filter(x=>x.status===filter)
    const q = search.toLowerCase()
    if (q) r = r.filter(x =>
      x.student_id.toLowerCase().includes(q)||
      x.student_name.toLowerCase().includes(q)||
      x.purpose.toLowerCase().includes(q)||
      x.lab.includes(q)
    )
    return r
  }, [records, search, filter])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Sit-in Records</h1>
          <p className="page-subtitle">Complete history of all sit-in sessions</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize:'0.8rem', color:'var(--fg-dim)' }}>{filtered.length} record{filtered.length!==1?'s':''}</span>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-bar" style={{ maxWidth:'280px' }}>
          <span style={{ color:'var(--fg-dim)', fontSize:'0.9rem' }}><i class="bi bi-search"></i></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search records…"/>
        </div>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {['all','active','done'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`}>
              {f==='all'?'All':f==='active'?'Active':'Done'}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Student ID</th><th>Name</th><th>Purpose</th><th>Lab</th><th>Session</th><th>Status</th><th>Time In</th><th>Time Out</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading…</td></tr>
              : filtered.length===0
                ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon"><i class="bi bi-clipboard"></i></div><div className="empty-state-text">No records found</div></div></td></tr>
                : filtered.map(r=>(
                  <tr key={r.id}>
                    <td style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.id}</td>
                    <td><span style={{ color:'var(--blue)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.student_id}</span></td>
                    <td style={{ fontWeight:500 }}>{r.student_name}</td>
                    <td><span className="badge badge-orange">{r.purpose}</span></td>
                    <td style={{ color:'var(--fg-dim)' }}>Lab {r.lab}</td>
                    <td style={{ color:'var(--fg-dim)' }}>{r.session}</td>
                    <td><span className={`badge ${r.status==='active'?'badge-green':'badge-blue'}`}>{r.status==='active'?'Active':'Done'}</span></td>
                    <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.time_in?.slice(0,16).replace('T',' ')}</td>
                    <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.time_out?.slice(0,16).replace('T',' ')||'—'}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
