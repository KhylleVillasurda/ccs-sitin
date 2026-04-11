import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import api from '../api'
import './Auth.css'

const COURSES = ['BSIT', 'BSCS', 'BSIS', 'ACT']

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    id_number: '', last_name: '', first_name: '', middle_name: '',
    course_level: '1', password: '', confirm_password: '',
    email: '', course: 'BSIT', address: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const payload = {
        id_number: form.id_number,
        last_name: form.last_name,
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        course_level: parseInt(form.course_level),
        password: form.password,
        email: form.email || null,
        course: form.course,
        address: form.address || null,
      }
      const { data } = await api.post('/auth/register', payload)
      login(data.user, data.token)
      navigate('/student')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-bg">
        <div className="auth-orb a1" /><div className="auth-orb a2" />
      </div>
      <Link to="/" className="auth-back">← Back to Home</Link>
      <div className="auth-card auth-card-wide">
        <div className="auth-logo"><div style={{display:"flex",gap:"0.5rem",alignItems:"center",justifyContent:"center"}}><img src="/ccs-logo.jpg" alt="CCS" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)"}}/><img src="/uc-logo.png" alt="UC" style={{height:40,width:"auto",objectFit:"contain"}}/></div></div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Register for CCS Sit-in Monitor</p>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label">ID Number</label>
            <input className="input" name="id_number" value={form.id_number}
              onChange={handleChange} placeholder="e.g. 2023-00001" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Last Name</label>
              <input className="input" name="last_name" value={form.last_name}
                onChange={handleChange} placeholder="Dela Cruz" required />
            </div>
            <div className="form-group">
              <label className="label">First Name</label>
              <input className="input" name="first_name" value={form.first_name}
                onChange={handleChange} placeholder="Juan" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Middle Name</label>
              <input className="input" name="middle_name" value={form.middle_name}
                onChange={handleChange} placeholder="Santos (optional)" />
            </div>
            <div className="form-group">
              <label className="label">Year Level</label>
              <select className="select" name="course_level" value={form.course_level} onChange={handleChange}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Course</label>
              <select className="select" name="course" value={form.course} onChange={handleChange}>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="juan@email.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Address</label>
            <input className="input" name="address" value={form.address}
              onChange={handleChange} placeholder="City, Province" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="••••••••" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="label">Confirm Password</label>
              <input className="input" name="confirm_password" type="password" value={form.confirm_password}
                onChange={handleChange} placeholder="••••••••" required />
            </div>
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Create Account →'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
