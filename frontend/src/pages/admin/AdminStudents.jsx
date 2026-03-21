import { useState, useEffect, useMemo } from 'react'
import api from '../../api'

const COURSES = ['BSIT','BSCS','BSIS','ACT']

function EditModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    last_name: student.last_name, first_name: student.first_name,
    middle_name: student.middle_name||'', course_level: student.course_level,
    email: student.email||'', course: student.course||'BSIT',
    address: student.address||'', remaining_sessions: student.remaining_sessions,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = e => setForm(f=>({...f,[e.target.name]:e.target.value}))

  const save = async () => {
    setLoading(true); setError('')
    try {
      await api.put(`/students/${student.id_number}`, {
        ...form, course_level:+form.course_level, remaining_sessions:+form.remaining_sessions
      })
      onSaved()
    } catch(err) { setError(err.response?.data?.error||'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Edit Student — {student.id_number}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <div className="form-row">
          <div className="form-group"><label className="label">Last Name</label><input className="input" name="last_name" value={form.last_name} onChange={set}/></div>
          <div className="form-group"><label className="label">First Name</label><input className="input" name="first_name" value={form.first_name} onChange={set}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="label">Middle Name</label><input className="input" name="middle_name" value={form.middle_name} onChange={set}/></div>
          <div className="form-group"><label className="label">Year Level</label>
            <select className="select" name="course_level" value={form.course_level} onChange={set}>
              {[1,2,3,4].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="label">Course</label>
            <select className="select" name="course" value={form.course} onChange={set}>
              {COURSES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="label">Sessions Left</label><input className="input" name="remaining_sessions" type="number" min="0" max="30" value={form.remaining_sessions} onChange={set}/></div>
        </div>
        <div className="form-group"><label className="label">Email</label><input className="input" name="email" type="email" value={form.email} onChange={set}/></div>
        <div className="form-group"><label className="label">Address</label><input className="input" name="address" value={form.address} onChange={set}/></div>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Saving…':'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

function AddModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ id_number:'', last_name:'', first_name:'', middle_name:'', course_level:1, password:'student123', email:'', course:'BSIT', address:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = e => setForm(f=>({...f,[e.target.name]:e.target.value}))

  const save = async () => {
    setLoading(true); setError('')
    try { await api.post('/students/', {...form, course_level:+form.course_level}); onSaved() }
    catch(err) { setError(err.response?.data?.error||'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Student</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <div className="form-group"><label className="label">ID Number</label><input className="input" name="id_number" value={form.id_number} onChange={set} placeholder="2024-00001"/></div>
        <div className="form-row">
          <div className="form-group"><label className="label">Last Name</label><input className="input" name="last_name" value={form.last_name} onChange={set}/></div>
          <div className="form-group"><label className="label">First Name</label><input className="input" name="first_name" value={form.first_name} onChange={set}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="label">Year Level</label>
            <select className="select" name="course_level" value={form.course_level} onChange={set}>
              {[1,2,3,4].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="label">Course</label>
            <select className="select" name="course" value={form.course} onChange={set}>
              {COURSES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="label">Default Password</label><input className="input" name="password" value={form.password} onChange={set}/></div>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>{loading?'Adding…':'Add Student'}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/students/'); setStudents(data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter(s =>
      s.id_number.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.first_name.toLowerCase().includes(q) ||
      (s.course||'').toLowerCase().includes(q)
    )
  }, [students, search])

  const del = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return
    await api.delete(`/students/${id}`); load()
  }
  const resetAll = async () => {
    if (!confirm('Reset all student sessions to 30?')) return
    await api.post('/students/reset-sessions')
    setMsg('All sessions reset!'); load(); setTimeout(()=>setMsg(''),3000)
  }

  return (
    <div>
      {editing && <EditModal student={editing} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);load()}}/>}
      {adding  && <AddModal  onClose={()=>setAdding(false)}  onSaved={()=>{setAdding(false);load()}}/>}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage registered student accounts</p>
        </div>
        <div className="page-header-actions">
          {msg && <span style={{ fontSize:'0.8rem', color:'var(--green)' }}>✓ {msg}</span>}
          <button className="btn btn-ghost btn-sm" onClick={resetAll}><i className="bi bi-arrow-counterclockwise" /> Reset Sessions</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setAdding(true)}><i className="bi bi-person-plus" /> Add Student</button>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom:'1rem' }}>
          <div className="search-bar" style={{ maxWidth:'320px' }}>
            <span style={{ color:'var(--fg-dim)', fontSize:'0.9rem' }}><i class="bi bi-search"></i></span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, ID, course…"/>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID Number</th><th>Name</th><th>Year</th><th>Course</th><th>Sessions Left</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading…</td></tr>
                : filtered.length===0
                  ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">{search?'No students match':'No students registered yet'}</div></div></td></tr>
                  : filtered.map(s=>(
                    <tr key={s.id_number}>
                      <td><span style={{ color:'var(--blue)', fontFamily:'monospace', fontSize:'0.85rem' }}>{s.id_number}</span></td>
                      <td style={{ fontWeight:500 }}>{s.last_name}, {s.first_name} {s.middle_name}</td>
                      <td><span className="badge badge-blue">Yr {s.course_level}</span></td>
                      <td>{s.course||'BSIT'}</td>
                      <td><span className={`badge ${s.remaining_sessions>10?'badge-green':s.remaining_sessions>0?'badge-orange':'badge-red'}`}>{s.remaining_sessions}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:'0.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(s)}><i className="bi bi-pencil" /> Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>del(s.id_number,`${s.first_name} ${s.last_name}`)}><i className="bi bi-trash3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:'0.75rem', fontSize:'0.8rem', color:'var(--fg-dim)' }}>
          {filtered.length} student{filtered.length!==1?'s':''} {search?'found':'total'}
        </div>
      </div>
    </div>
  )
}
