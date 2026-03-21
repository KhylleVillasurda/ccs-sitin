import { useState, useRef } from 'react'
import api from '../../api'
import UserAvatar from '../../components/UserAvatar'

const COURSES = ['BSIT', 'BSCS', 'BSIS', 'ACT']

const MAX_SIZE_MB = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function EditProfile({ user, onClose, onSaved }) {
  const [tab, setTab] = useState('info')
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
    current_password: '', new_password: '', confirm_password: '',
  })
  const [preview, setPreview]   = useState(user.profile_picture || null)
  const [picChanged, setPicChanged] = useState(false)
  const [removeFlag, setRemoveFlag] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const fileRef = useRef()

  const set   = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const setPw = e => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Picture handling ────────────────────────────────────────────────────
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP…)'); return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image must be under ${MAX_SIZE_MB} MB`); return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setPreview(ev.target.result)  // base64 data URL
      setPicChanged(true)
      setRemoveFlag(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePicture = () => {
    setPreview(null)
    setPicChanged(true)
    setRemoveFlag(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Save profile info ───────────────────────────────────────────────────
  const saveInfo = async () => {
    setLoading(true); setError(''); setSuccess('')
    try {
      const payload = {
        last_name:    form.last_name    || null,
        first_name:   form.first_name   || null,
        middle_name:  form.middle_name  || null,
        course_level: parseInt(form.course_level),
        email:        form.email        || null,
        course:       form.course,
        address:      form.address      || null,
        profile_picture: removeFlag ? 'remove' : picChanged ? preview : null,
      }
      const { data: updatedUser } = await api.put(`/students/profile/${user.id_number}`, payload)
      setSuccess('Profile saved!')
      setTimeout(() => onSaved(updatedUser), 700)
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed')
    } finally { setLoading(false) }
  }

  // ── Save password ───────────────────────────────────────────────────────
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

  // ── Derived preview user for avatar display ─────────────────────────────
  const previewUser = { ...user, profile_picture: preview }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <span className="modal-title">Edit Profile</span>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Profile picture section ── */}
        <div className="ep-picture-row">
          <div className="ep-avatar-wrap">
            <UserAvatar user={previewUser} size={80} fontSize="1.75rem" />
            <button
              className="ep-camera-btn"
              title="Change photo"
              onClick={() => fileRef.current?.click()}
            >
              <i className="bi bi-camera-fill" />
            </button>
          </div>
          <div className="ep-picture-info">
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {user.first_name} {user.last_name}
            </div>
            <div style={{ color: 'var(--fg-dim)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
              {user.id_number} · {user.course}
            </div>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.65rem', flexWrap:'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                <i className="bi bi-upload" /> Upload Photo
              </button>
              {preview && (
                <button className="btn btn-sm" onClick={handleRemovePicture}
                  style={{ background:'rgba(230,126,128,0.12)', color:'var(--red)', border:'1px solid rgba(230,126,128,0.25)' }}>
                  <i className="bi bi-trash3" /> Remove
                </button>
              )}
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--bg5)', marginTop:'0.4rem' }}>
              JPG, PNG, WEBP · Max {MAX_SIZE_MB} MB
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display:'none' }} onChange={handleFileChange} />
        </div>

        {/* ── ID (read-only) ── */}
        <div className="ep-id-strip">
          <i className="bi bi-shield-lock" style={{ color:'var(--fg-dim)' }} />
          <span style={{ fontSize:'0.75rem', color:'var(--fg-dim)' }}>Student ID</span>
          <span style={{ fontFamily:'monospace', color:'var(--blue)', fontWeight:600 }}>{user.id_number}</span>
          <span className="ep-readonly-badge">read-only</span>
        </div>

        {/* ── Tabs ── */}
        <div className="ep-tabs">
          {[['info','bi-person','Profile Info'],['password','bi-key','Change Password']].map(([key, icon, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(''); setSuccess('') }}
              className={`ep-tab${tab===key?' active':''}`}>
              <i className={`bi ${icon}`} /> {label}
            </button>
          ))}
        </div>

        {error   && <div className="alert alert-error"><i className="bi bi-exclamation-triangle" /> {error}</div>}
        {success && <div className="alert alert-success"><i className="bi bi-check-circle" /> {success}</div>}

        {/* ── Info tab ── */}
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
                  {[1,2,3,4].map(y => (
                    <option key={y} value={y}>{['1st','2nd','3rd','4th'][y-1]} Year</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={set} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="label">Address</label>
              <input className="input" name="address" value={form.address} onChange={set} placeholder="City, Province" />
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.75rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={saveInfo} disabled={loading}>
                <i className="bi bi-floppy" /> {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}

        {/* ── Password tab ── */}
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
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.75rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={savePassword} disabled={loading}>
                <i className="bi bi-key" /> {loading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
