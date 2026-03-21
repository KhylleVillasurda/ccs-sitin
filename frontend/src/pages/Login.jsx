import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import api from '../api'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ id_number: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.token)
      navigate(data.user.role === 'admin' ? '/admin' : '/student')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb a1" /><div className="auth-orb a2" />
      </div>
      <Link to="/" className="auth-back">← Back to Home</Link>
      <div className="auth-card">
        <div className="auth-logo"><img src="/ccs-logo.jpg" alt="CICS" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)"}}/></div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to CCS Sit-in Monitor</p>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label">ID Number</label>
            <input className="input" name="id_number" value={form.id_number}
              onChange={handleChange} placeholder="e.g. 2023-00001" required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" name="password" type="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        <p className="auth-hint">Admin default: ID <code>admin</code> / PW <code>admin123</code></p>
      </div>
    </div>
  )
}
