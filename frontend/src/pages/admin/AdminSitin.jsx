import { useState, useEffect } from 'react'
import api from '../../api'

const PURPOSES = ['C Programming','Java','PHP','ASP.Net','C#','Python','Database','Web Development','Other']
const LABS = ['524','526','528','530','542']

function SitInModal({ onClose, onStarted }) {
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState(null)
  const [form, setForm] = useState({ purpose:'C Programming', lab:'524' })
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const findStudent = async () => {
    if (!search.trim()) return
    setSearching(true); setError(''); setStudent(null)
    try { const { data } = await api.get(`/students/${search.trim()}`); setStudent(data) }
    catch { setError('Student not found. Check the ID number.') }
    finally { setSearching(false) }
  }

  const startSitin = async () => {
    if (!student) return
    setLoading(true); setError('')
    try { await api.post('/sitin/start', { student_id:student.id_number, ...form }); onStarted() }
    catch(err) { setError(err.response?.data?.error||'Failed to start sit-in') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Sit-in</span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        {error && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}
        <div className="form-group">
          <label className="label">Student ID Number</label>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Enter student ID…" onKeyDown={e=>e.key==='Enter'&&findStudent()}/>
            <button className="btn btn-ghost" onClick={findStudent} disabled={searching} style={{ flexShrink:0 }}>
              {searching?'…':<><i className="bi bi-search" /> Find</>}
            </button>
          </div>
        </div>
        {student && (
          <div style={{ background:'var(--bg2)', borderRadius:'8px', padding:'1rem', marginBottom:'1rem', border:'1px solid var(--border)' }}>
            <div style={{ fontWeight:600, marginBottom:'0.2rem' }}>{student.first_name} {student.last_name}</div>
            <div style={{ fontSize:'0.8rem', color:'var(--fg-dim)' }}>{student.id_number} · {student.course} Yr {student.course_level}</div>
            <div style={{ marginTop:'0.5rem', fontSize:'0.85rem' }}>
              Sessions left: <span className={`badge ${student.remaining_sessions>10?'badge-green':student.remaining_sessions>0?'badge-orange':'badge-red'}`}>{student.remaining_sessions}</span>
            </div>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label className="label">Purpose</label>
            <select className="select" value={form.purpose} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))}>
              {PURPOSES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Lab</label>
            <select className="select" value={form.lab} onChange={e=>setForm(f=>({...f,lab:e.target.value}))}>
              {LABS.map(l=><option key={l} value={l}>Lab {l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={startSitin} disabled={!student||loading}>
            {loading?'Starting…':'Start Sit-in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSitin() {
  const [current, setCurrent] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [ending, setEnding] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/sitin/current'); setCurrent(data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const endSitin = async id => {
    setEnding(id); await api.post(`/sitin/end/${id}`); setEnding(null); load()
  }

  return (
    <div>
      {showModal && <SitInModal onClose={()=>setShowModal(false)} onStarted={()=>{setShowModal(false);load()}}/>}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Sit-in Management</h1>
          <p className="page-subtitle">Monitor and manage current sit-in sessions</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={load}><i className="bi bi-arrow-clockwise" /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}><i className="bi bi-plus-circle" /> New Sit-in</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom:'1rem', padding:'1rem 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 6px var(--green)' }}/>
          <span style={{ fontSize:'0.9rem' }}>
            <strong style={{ color:'var(--green)' }}>{current.length}</strong>
            <span style={{ color:'var(--fg-dim)' }}> student{current.length!==1?'s':''} currently sitting in</span>
          </span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Sit ID</th><th>ID Number</th><th>Student Name</th><th>Purpose</th><th>Lab</th><th>Session #</th><th>Time In</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading…</td></tr>
              : current.length===0
                ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><i className="bi bi-laptop" /></div><div className="empty-state-text">No students currently sitting in</div></div></td></tr>
                : current.map(r=>(
                  <tr key={r.id}>
                    <td><span style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.82rem' }}>#{r.id}</span></td>
                    <td><span style={{ color:'var(--blue)', fontFamily:'monospace', fontSize:'0.82rem' }}>{r.student_id}</span></td>
                    <td style={{ fontWeight:500 }}>{r.student_name}</td>
                    <td><span className="badge badge-orange">{r.purpose}</span></td>
                    <td>Lab {r.lab}</td>
                    <td style={{ color:'var(--fg-dim)' }}>{r.session}</td>
                    <td style={{ fontSize:'0.8rem', color:'var(--fg-dim)' }}>{r.time_in?.replace('T',' ').slice(0,16)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={()=>endSitin(r.id)} disabled={ending===r.id}>{ending===r.id?'…':'End'}</button></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
