import { useState } from 'react'
import api from '../../api'

const COURSES = ['BSIT', 'BSCS', 'BSIS', 'ACT']

export default function EditProfile({ user, onClose, onSaved }) {
  const [tab, setTab] = useState('info') // 'info' | 'password'
  const [form, setForm] = useState({
    last_name:    user.last_name    || '',
    first_name:   user.first_name   || '',
    middle_name:  user.middle_name  || '',
    course_level: user.course_level || 1,
    email:        user.email        || '',
    course:       user.course       || 'BSIT',
    address:      user.address      || '',
  })
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  const set    = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const setPw  = e => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const saveInfo = async () => {
    setLoading(true); setError(''); setSuccess('')
    try {
      await api.put(`/students/profile/${user.id_number}`, {
        last_name:    form.last_name,
        first_name:   form.first_name,
        middle_name:  form.middle_name || null,
        course_level: parseInt(form.course_level),
        email:        form.email || null,
        course:       form.course,
        address:      form.address || null,
      })
      // Re-fetch updated user info
      const { data } = await api.get(`/students/${user.id_number}`)
      setSuccess('Profile updated!')
      setTimeout(() => onSaved(data), 800)
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed')
    } finally { setLoading(false) }
  }

  const savePassword = async () => {
    setError(''); setSuccess('')
    if (!pwForm.current_password) { setError('Enter your current password'); return }
    if (pwForm.new_password.length < 6) { setError('New password must be at least 6 characters'); return }
    if (pwForm.new_password !== pwForm.confirm_password) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.put(`/students/profile/${user.id_number}`, {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      })
      setSuccess('Password changed!')
      setPwForm({ current_password:'', new_password:'', confirm_password:'' })
    } catch (err) {
      setError(err.response?.data?.error || 'Password change failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <span className="modal-title"><i class="bi bi-pen"></i> Edit Profile</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ID display (read-only) */}
        <div style={{ background:'var(--bg2)', borderRadius:'7px', padding:'0.65rem 1rem', marginBottom:'1.25rem', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'0.75rem', color:'var(--fg-dim)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Student ID</span>
          <span style={{ fontFamily:'monospace', color:'var(--blue)', fontWeight:600 }}>{user.id_number}</span>
          <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:'var(--bg5)', background:'var(--bg3)', padding:'0.15rem 0.5rem', borderRadius:'4px' }}>cannot be changed</span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.35rem', marginBottom:'1.25rem', background:'var(--bg2)', borderRadius:'8px', padding:'0.3rem' }}>
          {[['info',<><i className="bi bi-person-fill"></i> Profile Info</>],['password',<><i className="bi bi-key-fill"></i> Change Password</>]].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(''); setSuccess('') }}
              style={{
                flex:1, padding:'0.5rem', border:'none', borderRadius:'6px', cursor:'pointer',
                fontFamily:"'Outfit', sans-serif", fontSize:'0.85rem', fontWeight:500,
                background: tab===key ? 'var(--surface)' : 'transparent',
                color: tab===key ? 'var(--accent)' : 'var(--fg-dim)',
                transition:'all 0.15s',
              }}>
              {label}
            </button>
          ))}
        </div>

        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        {/* Profile Info tab */}
        {tab === 'info' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Last Name</label>
                <input className="input" name="last_name" value={form.last_name} onChange={set} />
              </div>
              <div className="form-group">
                <label className="label">First Name</label>
                <input className="input" name="first_name" value={form.first_name} onChange={set} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Middle Name</label>
              <input className="input" name="middle_name" value={form.middle_name} onChange={set} placeholder="Optional" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Course</label>
                <select className="select" name="course" value={form.course} onChange={set}>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Year Level</label>
                <select className="select" name="course_level" value={form.course_level} onChange={set}>
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" name="email" type="email" value={form.email} onChange={set} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="label">Address</label>
              <input className="input" name="address" value={form.address} onChange={set} placeholder="City, Province" />
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={saveInfo} disabled={loading}>
                {loading ? 'Saving…' : <><i className="bi bi-download"></i> Save Changes</>}
              </button>
            </div>
          </>
        )}

        {/* Change Password tab */}
        {tab === 'password' && (
          <>
            <div className="form-group">
              <label className="label">Current Password</label>
              <input className="input" name="current_password" type="password"
                value={pwForm.current_password} onChange={setPw} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="label">New Password</label>
              <input className="input" name="new_password" type="password"
                value={pwForm.new_password} onChange={setPw} placeholder="At least 6 characters" />
            </div>
            <div className="form-group">
              <label className="label">Confirm New Password</label>
              <input className="input" name="confirm_password" type="password"
                value={pwForm.confirm_password} onChange={setPw} placeholder="••••••••" />
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={savePassword} disabled={loading}>
                {loading ? 'Updating…' : '🔑 Update Password'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
