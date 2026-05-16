import { useState, useEffect, useMemo } from 'react'
import api from '../../api'
import { useDebounce } from '../../hooks/useDebounce'

function exportCSV(records) {
  const headers = ['ID','Student ID','Name','Purpose','Lab','Session','Status','Time In','Time Out']
  const rows = records.map(r => [
    r.id,
    r.student_id,
    `"${r.student_name}"`,
    `"${r.purpose}"`,
    r.lab,
    r.session,
    r.status,
    r.time_in?.slice(0,16).replace('T',' ') || '',
    r.time_out?.slice(0,16).replace('T',' ') || '',
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `sitin-records-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(records) {
  const date  = new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })
  const rows  = records.map((r, i) => `
    <tr class="${i % 2 === 0 ? 'even' : ''}">
      <td>${r.id}</td>
      <td>${r.student_id}</td>
      <td>${r.student_name}</td>
      <td>${r.purpose}</td>
      <td>Lab ${r.lab}</td>
      <td>${r.session}</td>
      <td><span class="badge ${r.status === 'active' ? 'badge-active' : 'badge-done'}">${r.status === 'active' ? 'Active' : 'Done'}</span></td>
      <td>${r.time_in?.slice(0,16).replace('T',' ') || '—'}</td>
      <td>${r.time_out?.slice(0,16).replace('T',' ') || '—'}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Sit-in Records — ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #333; padding: 24px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid #2e7d32; }
    .header-left h1 { font-size: 16px; color: #2e7d32; }
    .header-left p  { font-size: 10px; color: #666; margin-top: 2px; }
    .header-right   { font-size: 10px; color: #888; text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2e7d32; color: white; padding: 6px 8px; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; white-space: nowrap; }
    tr.even td { background: #f9f9f9; }
    .badge { padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 600; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-done   { background: #e3f2fd; color: #1565c0; }
    .footer { margin-top: 16px; font-size: 9px; color: #aaa; text-align: center; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <div class="header">
    <div class="header-left">
      <h1>CCS Sit-in Records</h1>
      <p>University of Cebu — College of Information &amp; Computer Science</p>
    </div>
    <div class="header-right">
      <div>Generated: ${date}</div>
      <div>Total records: ${records.length}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Purpose</th><th>Lab</th><th>Session</th><th>Status</th><th>Time In</th><th>Time Out</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">CCS Sit-in Monitoring System · University of Cebu</div>
  </body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); }, 400)
}

export default function AdminRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    api.get('/sitin/records').then(r => setRecords(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let r = records
    if (filter !== 'all') r = r.filter(x => x.status === filter)
    const q = search.toLowerCase()
    if (q) r = r.filter(x =>
      x.student_id.toLowerCase().includes(q) ||
      x.student_name.toLowerCase().includes(q) ||
      x.purpose.toLowerCase().includes(q) ||
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
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered)} title="Export as CSV">
            <i className="bi bi-filetype-csv" /> CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportPDF(filtered)} title="Export as PDF">
            <i className="bi bi-file-earmark-pdf" /> PDF
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-bar" style={{ maxWidth:'280px' }}>
          <span style={{ color:'var(--fg-dim)', fontSize:'0.9rem' }}><i className="bi bi-search" /></span>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search records…"/>
        </div>
        <div style={{ display:'flex', gap:'0.4rem' }}>
          {['all','active','done'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`}>
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
                ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon"><i className="bi bi-clipboard" /></div><div className="empty-state-text">No records found</div></div></td></tr>
                : filtered.map(r => (
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
