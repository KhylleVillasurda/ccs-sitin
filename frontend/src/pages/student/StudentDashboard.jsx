import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import api from '../../api'
import EditProfile from './EditProfile'
import UserAvatar from '../../components/UserAvatar'
import NotificationBell from '../../components/NotificationBell'
import FeedbackModal from '../../components/FeedbackModal'
import FeedbackViewModal from '../../components/FeedbackViewModal'
import './StudentDashboard.css'

const MOODS = [
  { value:1, icon:'bi-emoji-angry-fill',    label:'Terrible', color:'#e67e80' },
  { value:2, icon:'bi-emoji-frown-fill',    label:'Poor',     color:'#e69875' },
  { value:3, icon:'bi-emoji-neutral-fill',  label:'Okay',     color:'#dbbc7f' },
  { value:4, icon:'bi-emoji-smile-fill',    label:'Good',     color:'#7fbbb3' },
  { value:5, icon:'bi-emoji-laughing-fill', label:'Excellent',color:'#a7c080' },
]

const PURPOSES = ['C Programming','Java','PHP','ASP.Net','C#','Python','Database','Web Development','Other']
const LABS = ['524','526','528','530','542']
const LAB_ROWS = 7
const LAB_COLS = 7
const DIVIDER_AFTER = [2, 4, 6]  // 1-indexed rows after which a divider appears

/* ── Session summary helpers ── */
function parseDuration(r) {
  if (!r.time_in || !r.time_out) return 0
  return (new Date(r.time_out) - new Date(r.time_in)) / 1000 / 60 // minutes
}
function fmtDuration(minutes) {
  if (!minutes || minutes < 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/* ── PC Seat Picker Modal ── */
function SeatPickerModal({ lab, date, slot, onSelect, onClose }) {
  const [occupancy, setOccupancy] = useState({ reserved: [], disabled: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (slot) params.set('slot', slot)
    api.get(`/reservations/lab-occupancy/${lab}?${params}`)
      .then(r => setOccupancy(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lab, date, slot])

  const getStatus = (pc) => {
    if (occupancy.disabled?.includes(pc)) return 'disabled'
    if (occupancy.reserved?.includes(pc)) return 'occupied'
    return 'free'
  }

  const pcs = Array.from({ length: LAB_ROWS * LAB_COLS }, (_, i) => i + 1)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <span className="modal-title"><i className="bi bi-grid-3x3" /> Lab {lab} — Select a PC</span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading floor plan…</div>
        ) : (
          <>
            <div className="seat-legend">
              <span className="seat-dot free" /> Available
              <span className="seat-dot occupied" /> Reserved/Active
              <span className="seat-dot disabled" /> Offline
            </div>
            <div className="seat-grid">
              {Array.from({ length: LAB_ROWS }, (_, row) => (
                <div key={row}>
                  <div className="seat-row">
                    {Array.from({ length: LAB_COLS }, (_, col) => {
                      const pc = row * LAB_COLS + col + 1
                      const status = getStatus(pc)
                      return (
                        <button
                          key={pc}
                          className={`seat-btn seat-${status}`}
                          disabled={status !== 'free'}
                          onClick={() => onSelect(pc)}
                          title={`PC ${pc} — ${status}`}
                        >
                          <i className="bi bi-display" />
                          <span className="seat-num">{pc}</span>
                        </button>
                      )
                    })}
                  </div>
                  {DIVIDER_AFTER.includes(row + 1) && row + 1 < LAB_ROWS && (
                    <div className="seat-divider" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Reservation Request Modal ── */
const TIME_SLOTS = [
  '7:30 AM – 9:30 AM',
  '9:30 AM – 11:30 AM',
  '11:30 AM – 1:30 PM',
  '1:30 PM – 3:30 PM',
  '3:30 PM – 5:30 PM',
  '5:30 PM – 7:30 PM',
]

function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
function maxDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 14) // allow booking up to 2 weeks ahead
  return d.toISOString().slice(0, 10)
}
function fmtDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric', year:'numeric' })
}

function ReservationModal({ onClose, onSuccess }) {
  const [step, setStep]   = useState(1) // 1:details  2:pick PC  3:confirm
  const [form, setForm]   = useState({
    lab: '524', purpose: 'C Programming', notes: '',
    reservation_date: todayStr(),
    time_slot: TIME_SLOTS[0],
  })
  const [selectedPc, setSelectedPc] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSelect = (pc) => { setSelectedPc(pc); setStep(3) }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      await api.post('/reservations/request', {
        lab:              form.lab,
        pc_number:        selectedPc,
        purpose:          form.purpose,
        reservation_date: form.reservation_date,
        time_slot:        form.time_slot,
        notes:            form.notes || null,
      })
      onSuccess()
    } catch(e) {
      setError(e.response?.data?.error || 'Failed to submit reservation')
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title"><i className="bi bi-calendar-check" /> Reserve a PC</span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        {error && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

        {/* Step indicator */}
        <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1.25rem', alignItems:'center', fontSize:'0.75rem', color:'var(--fg-dim)' }}>
          {['Details','Choose PC','Confirm'].map((s, i) => (
            <span key={s} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
              <span style={{
                width:20, height:20, borderRadius:'50%', display:'inline-flex',
                alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700,
                background: step > i+1 ? 'var(--green)' : step === i+1 ? 'var(--accent)' : 'var(--bg3)',
                color: step >= i+1 ? (step===i+1?'var(--bg)':'var(--bg)') : 'var(--fg-dim)',
              }}>{step > i+1 ? <i className="bi bi-check-lg"/> : i+1}</span>
              <span style={{ color: step===i+1?'var(--fg)':'var(--fg-dim)', fontWeight:step===i+1?600:400 }}>{s}</span>
              {i < 2 && <span style={{ opacity:0.3 }}>›</span>}
            </span>
          ))}
        </div>

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Lab Room</label>
                <select className="select" value={form.lab} onChange={e => setForm(f=>({...f,lab:e.target.value}))}>
                  {LABS.map(l => <option key={l} value={l}>Lab {l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Purpose</label>
                <select className="select" value={form.purpose} onChange={e => setForm(f=>({...f,purpose:e.target.value}))}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Date</label>
                <input type="date" className="input"
                  value={form.reservation_date}
                  min={todayStr()} max={maxDateStr()}
                  onChange={e => setForm(f=>({...f,reservation_date:e.target.value}))} />
                {form.reservation_date && (
                  <div style={{ fontSize:'0.72rem', color:'var(--accent)', marginTop:'0.25rem' }}>
                    {fmtDisplayDate(form.reservation_date)}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="label">Time Slot</label>
                <select className="select" value={form.time_slot} onChange={e => setForm(f=>({...f,time_slot:e.target.value}))}>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Notes (optional)</label>
              <input className="input" placeholder="Any additional notes…" value={form.notes}
                onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Choose PC <i className="bi bi-arrow-right" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Seat Picker ── */}
        {step === 2 && (
          <>
            <div style={{ fontSize:'0.8rem', color:'var(--fg-dim)', marginBottom:'0.75rem', display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
              <i className="bi bi-info-circle" />
              Lab <strong style={{color:'var(--fg)'}}>{form.lab}</strong> · {fmtDisplayDate(form.reservation_date)} · <strong style={{color:'var(--accent)'}}>{form.time_slot}</strong>
              <span style={{ marginLeft:'auto', fontSize:'0.72rem', opacity:0.7 }}>Showing availability for this slot</span>
            </div>
            <SeatPickerModal
              lab={form.lab}
              date={form.reservation_date}
              slot={form.time_slot}
              onSelect={handleSelect}
              onClose={() => setStep(1)}
            />
          </>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <>
            <div style={{ background:'var(--bg2)', borderRadius:8, padding:'1rem', marginBottom:'1rem', border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:600, marginBottom:'0.6rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <i className="bi bi-calendar2-check" style={{color:'var(--accent)'}} /> Reservation Summary
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.3rem 1rem', fontSize:'0.84rem', color:'var(--fg-dim)' }}>
                <span><strong style={{color:'var(--fg)'}}>Lab:</strong> {form.lab}</span>
                <span><strong style={{color:'var(--fg)'}}>PC:</strong> {selectedPc}</span>
                <span><strong style={{color:'var(--fg)'}}>Date:</strong> {fmtDisplayDate(form.reservation_date)}</span>
                <span><strong style={{color:'var(--fg)'}}>Time:</strong> {form.time_slot}</span>
                <span style={{gridColumn:'1/-1'}}><strong style={{color:'var(--fg)'}}>Purpose:</strong> {form.purpose}</span>
                {form.notes && <span style={{gridColumn:'1/-1'}}><strong style={{color:'var(--fg)'}}>Notes:</strong> {form.notes}</span>}
              </div>
            </div>
            <p style={{ fontSize:'0.78rem', color:'var(--fg-dim)', marginBottom:'1rem', display:'flex', gap:'0.4rem' }}>
              <i className="bi bi-bell" /> You’ll be notified once the admin reviews your request.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>
                <i className="bi bi-arrow-left" /> Back
              </button>
              <button className="btn btn-green" onClick={submit} disabled={loading}>
                {loading ? 'Submitting…' : <><i className="bi bi-send" /> Submit Request</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function StudentDashboard() {
  const { user, login, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const rowRefs = useRef({})
  const [highlightId, setHighlightId] = useState(null)

  const [records,        setRecords]        = useState([])
  const [announcements,  setAnnouncements]  = useState([])
  const [reservations,   setReservations]   = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showEdit,       setShowEdit]       = useState(false)
  const [showReservation,setShowReservation]= useState(false)
  const [activeTab,      setActiveTab]      = useState('history') // 'history' | 'reservations'

  // Feedback state
  const [feedbackFor,    setFeedbackFor]    = useState(null)
  const [feedbackBanner, setFeedbackBanner] = useState('')
  const [myFeedbacks,    setMyFeedbacks]    = useState([])
  const [viewEntry,      setViewEntry]      = useState(null)

  const feedbackMap = Object.fromEntries(myFeedbacks.map(f => [f.sitin_id, f]))

  const loadMyFeedbacks = useCallback(async () => {
    try { const { data } = await api.get('/feedback/my/full'); setMyFeedbacks(data) }
    catch { /* ignore */ }
  }, [])

  const loadReservations = useCallback(async () => {
    try { const { data } = await api.get('/reservations/my'); setReservations(data) }
    catch { /* ignore */ }
  }, [])

  const load = useCallback(() => {
    Promise.all([
      api.get(`/sitin/student/${user.id_number}`),
      api.get('/announcements/'),
    ]).then(([r, a]) => {
      setRecords(r.data)
      setAnnouncements(a.data)
    }).finally(() => setLoading(false))
  }, [user.id_number])

  useEffect(() => {
    load()
    loadMyFeedbacks()
    loadReservations()
  }, [load, loadMyFeedbacks, loadReservations])

  // Scroll to feedback if coming from notification
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const feedbackId = params.get('feedback')
    if (feedbackId && myFeedbacks.length > 0) {
      const idNum = parseInt(feedbackId)
      const entry = myFeedbacks.find(f => f.id === idNum)
      if (entry) {
        setHighlightId(idNum)
        setTimeout(() => {
          rowRefs.current[idNum]?.scrollIntoView({ behavior:'smooth', block:'center' })
          setTimeout(() => setHighlightId(null), 3500)
        }, 300)
      }
    }
  }, [location.search, myFeedbacks])

  const handleLogout = () => { logout(); navigate('/') }
  const handleProfileSaved = (updatedUser) => {
    login(updatedUser, localStorage.getItem('token'))
    setShowEdit(false)
  }
  const handleFeedbackSuccess = (rating) => {
    setFeedbackFor(null)
    const mood = MOODS.find(m => m.value === rating)
    setFeedbackBanner(`Thank you! Your anonymous feedback has been submitted${mood ? ` (${mood.label})` : ''}.`)
    setTimeout(() => setFeedbackBanner(''), 5000)
    loadMyFeedbacks()
  }

  const active = records.filter(r => r.status === 'active')
  const done   = records.filter(r => r.status === 'done')

  /* ── Session Summary Computation ── */
  const doneWithTimes = done.filter(r => r.time_in && r.time_out)
  const totalMinutes  = doneWithTimes.reduce((sum, r) => sum + parseDuration(r), 0)
  const avgMinutes    = doneWithTimes.length > 0 ? totalMinutes / doneWithTimes.length : 0
  const longestMin    = doneWithTimes.length > 0 ? Math.max(...doneWithTimes.map(parseDuration)) : 0

  return (
    <div className="student-page">
      {showEdit && (
        <EditProfile user={user} onClose={() => setShowEdit(false)} onSaved={handleProfileSaved} />
      )}
      {feedbackFor !== null && (
        <FeedbackModal sitinId={feedbackFor} onClose={() => setFeedbackFor(null)} onSuccess={handleFeedbackSuccess} />
      )}
      {viewEntry && (
        <FeedbackViewModal entry={viewEntry} onClose={() => setViewEntry(null)} />
      )}
      {showReservation && (
        <ReservationModal
          onClose={() => setShowReservation(false)}
          onSuccess={() => {
            setShowReservation(false)
            loadReservations()
            setActiveTab('reservations')
            setFeedbackBanner('Reservation submitted! Waiting for admin approval.')
            setTimeout(() => setFeedbackBanner(''), 6000)
          }}
        />
      )}

      {/* ── Topbar ── */}
      <header className="student-topbar">
        <div className="student-brand">
          <img src="/ccs-logo.jpg" alt="CCS"
            style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }}
            onError={e => e.target.style.display='none'} />
          <img src="/uc-logo.png" alt="UC"
            style={{ height:22, width:'auto', objectFit:'contain' }}
            onError={e => e.target.style.display='none'} />
          <span className="student-brand-text">CCS Sit-in Monitor</span>
        </div>
        <div className="student-topbar-right">
          <div className="student-nav-user">
            <span className="student-nav-name">{user.first_name} {user.last_name}</span>
          </div>
          <NotificationBell />
          <button className="theme-toggle" onClick={toggle} title="Toggle theme">
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
            <i className="bi bi-pencil-square" /> Edit Profile
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" /> Logout
          </button>
        </div>
      </header>

      <div className="student-content">

        {/* ── Welcome ── */}
        <div className="student-welcome">
          <h1>Welcome, <span style={{ color:'var(--accent)' }}>{user.first_name} {user.last_name}</span></h1>
          <p style={{ color:'var(--fg-dim)', marginTop:'0.2rem', fontSize:'0.875rem' }}>
            {user.id_number} &nbsp;·&nbsp; {user.course} &nbsp;·&nbsp; Year {user.course_level}
          </p>
        </div>

        {/* ── Feedback/reservation banner ── */}
        {feedbackBanner && (
          <div style={{
            background:'rgba(127,187,179,0.12)', border:'1px solid rgba(127,187,179,0.3)',
            borderRadius:'8px', padding:'0.7rem 1rem', marginBottom:'1rem',
            fontSize:'0.82rem', color:'var(--blue)', display:'flex', gap:'0.5rem', alignItems:'center',
          }}>
            <i className="bi bi-check-circle-fill" /> {feedbackBanner}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="student-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ background:'rgba(219,188,127,0.15)' }}>
              <i className="bi bi-ticket-perforated" style={{ color:'var(--accent)', fontSize:'1.2rem' }} />
            </div>
            <div>
              <div className="stat-value" style={{ color:'var(--accent)' }}>{user.remaining_sessions}</div>
              <div className="stat-label">Sessions Remaining</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:'rgba(167,192,128,0.15)' }}>
              <i className="bi bi-display" style={{ color:'var(--green)', fontSize:'1.2rem' }} />
            </div>
            <div>
              <div className="stat-value" style={{ color:'var(--green)' }}>{active.length}</div>
              <div className="stat-label">Active Sit-in</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background:'rgba(127,187,179,0.15)' }}>
              <i className="bi bi-check2-circle" style={{ color:'var(--blue)', fontSize:'1.2rem' }} />
            </div>
            <div>
              <div className="stat-value" style={{ color:'var(--blue)' }}>{done.length}</div>
              <div className="stat-label">Completed Sessions</div>
            </div>
          </div>
        </div>

        {/* ── Session Summary Card ── */}
        {done.length > 0 && (
          <div className="card session-summary-card">
            <div className="section-title" style={{ marginBottom:'1rem' }}>
              <i className="bi bi-bar-chart-line" /> Session Summary
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-icon" style={{ background:'rgba(219,188,127,0.1)' }}>
                  <i className="bi bi-clock" style={{ color:'var(--accent)' }} />
                </div>
                <div className="summary-val">{fmtDuration(totalMinutes)}</div>
                <div className="summary-lbl">Total Hours</div>
              </div>
              <div className="summary-item">
                <div className="summary-icon" style={{ background:'rgba(167,192,128,0.1)' }}>
                  <i className="bi bi-journal-check" style={{ color:'var(--green)' }} />
                </div>
                <div className="summary-val">{done.length}</div>
                <div className="summary-lbl">Sessions Done</div>
              </div>
              <div className="summary-item">
                <div className="summary-icon" style={{ background:'rgba(127,187,179,0.1)' }}>
                  <i className="bi bi-calculator" style={{ color:'var(--blue)' }} />
                </div>
                <div className="summary-val">{fmtDuration(Math.round(avgMinutes))}</div>
                <div className="summary-lbl">Avg Duration</div>
              </div>
              <div className="summary-item">
                <div className="summary-icon" style={{ background:'rgba(214,153,182,0.1)' }}>
                  <i className="bi bi-trophy" style={{ color:'var(--purple)' }} />
                </div>
                <div className="summary-val">{fmtDuration(Math.round(longestMin))}</div>
                <div className="summary-lbl">Longest Session</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Active sit-in banner ── */}
        {active.length > 0 && (
          <div className="active-sitin-banner">
            <i className="bi bi-circle-fill" style={{ color:'var(--green)', fontSize:'0.55rem' }} />
            <span>
              <strong>Currently sitting in:</strong> {active[0].purpose} — Lab {active[0].lab}
            </span>
            <span style={{ marginLeft:'auto', fontSize:'0.78rem', color:'var(--fg-dim)' }}>
              Since {active[0].time_in?.slice(0,16).replace('T',' ')}
            </span>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="student-main-grid">
          {/* LEFT — Announcements */}
          <div className="student-announcements-col">
            <div className="card">
              <div className="section-title"><i className="bi bi-megaphone" /> Announcements</div>
              {announcements.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox" style={{ fontSize:'2rem', opacity:0.4 }} />
                  <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No announcements yet</div>
                </div>
              ) : (
                <div className="ann-list">
                  {announcements.map((a, i) => (
                    <div key={a.id} className={`ann-item${i===0?' ann-item-latest':''}`}>
                      <div className="ann-meta">
                        <i className="bi bi-person-circle" />
                        <span>{a.author}</span>
                        <span className="ann-date">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : ''}
                        </span>
                        {i === 0 && <span className="badge badge-orange" style={{ fontSize:'0.65rem' }}>Latest</span>}
                      </div>
                      <p className="ann-content">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Profile card */}
          <div className="student-side-col">
            <div className="card student-profile-card">
              <div className="section-title"><i className="bi bi-person-badge" /> My Profile</div>
              <div className="profile-avatar-row">
                <div className="profile-avatar-clickable" onClick={() => setShowEdit(true)} title="Click to change photo">
                  <UserAvatar user={user} size={72} fontSize="1.5rem" />
                  <div className="profile-avatar-overlay"><i className="bi bi-camera" /></div>
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.95rem' }}>
                    {user.first_name}{user.middle_name ? ' '+user.middle_name[0]+'.' : ''} {user.last_name}
                  </div>
                  <div style={{ color:'var(--fg-dim)', fontSize:'0.8rem', marginTop:'0.15rem' }}>
                    {user.course} — Year {user.course_level}
                  </div>
                </div>
              </div>
              <div className="divider" style={{ margin:'1rem 0' }} />
              <div className="profile-details">
                <div className="profile-detail-row">
                  <i className="bi bi-hash" />
                  <span className="pd-label">Student ID</span>
                  <span className="pd-value" style={{ fontFamily:'monospace', color:'var(--blue)' }}>{user.id_number}</span>
                </div>
                {user.email && (
                  <div className="profile-detail-row">
                    <i className="bi bi-envelope" />
                    <span className="pd-label">Email</span>
                    <span className="pd-value">{user.email}</span>
                  </div>
                )}
                {user.address && (
                  <div className="profile-detail-row">
                    <i className="bi bi-geo-alt" />
                    <span className="pd-label">Address</span>
                    <span className="pd-value">{user.address}</span>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowEdit(true)}>
                  <i className="bi bi-pencil-square" /> Edit
                </button>
                <button className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowReservation(true)}>
                  <i className="bi bi-calendar-plus" /> Reserve PC
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sit-in History + Reservations (tabbed) ── */}
        <div style={{ marginTop:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
            <button
              className={`btn btn-sm ${activeTab==='history' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-clock-history" /> Sit-in History
            </button>
            <button
              className={`btn btn-sm ${activeTab==='reservations' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('reservations')}
            >
              <i className="bi bi-calendar-check" /> My Reservations
              {reservations.filter(r => r.status === 'pending').length > 0 && (
                <span style={{ background:'var(--orange)', color:'#fff', borderRadius:'999px', padding:'0 5px', fontSize:'0.65rem', marginLeft:'2px' }}>
                  {reservations.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={() => setShowReservation(true)}>
              <i className="bi bi-calendar-plus" /> New Reservation
            </button>
          </div>

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <>
              {done.length > 0 && (
                <div style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  marginBottom:'0.75rem', fontSize:'0.76rem', color:'var(--fg-dim)',
                  padding:'0.5rem 0.75rem',
                  background:'rgba(127,187,179,0.07)', border:'1px solid rgba(127,187,179,0.15)',
                  borderRadius:'7px', width:'fit-content',
                }}>
                  <i className="bi bi-chat-quote" style={{ color:'var(--blue)' }} />
                  Rate your completed sessions anonymously. Click <strong style={{ color:'var(--fg)' }}>View</strong> to see admin remarks.
                </div>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Purpose</th><th>Lab</th><th>Status</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Feedback</th></tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading…</td></tr>
                    ) : records.length === 0 ? (
                      <tr><td colSpan={8}>
                        <div className="empty-state">
                          <i className="bi bi-journal-x" style={{ fontSize:'2rem', opacity:0.4 }} />
                          <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No sit-in history yet</div>
                        </div>
                      </td></tr>
                    ) : records.map(r => {
                      const submitted = feedbackMap[r.id]
                      const mood = submitted ? MOODS.find(m => m.value === submitted.rating) : null
                      const hasRemark = submitted?.admin_reply
                      const dur = parseDuration(r)
                      return (
                        <tr
                          key={r.id}
                          ref={el => { if (submitted) rowRefs.current[submitted.id] = el }}
                          className={submitted && highlightId === submitted.id ? 'highlight-row' : ''}
                        >
                          <td style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.id}</td>
                          <td><span className="badge badge-orange">{r.purpose}</span></td>
                          <td style={{ color:'var(--fg-dim)' }}>Lab {r.lab}</td>
                          <td>
                            <span className={`badge ${r.status==='active'?'badge-green':'badge-blue'}`}>
                              {r.status === 'active'
                                ? <><i className="bi bi-circle-fill" style={{ fontSize:'0.45rem', verticalAlign:'middle', marginRight:'3px' }} />Active</>
                                : <><i className="bi bi-check-circle" style={{ fontSize:'0.7rem', verticalAlign:'middle', marginRight:'3px' }} />Done</>
                              }
                            </span>
                          </td>
                          <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.time_in?.slice(0,16).replace('T',' ')}</td>
                          <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.time_out?.slice(0,16).replace('T',' ')||'—'}</td>
                          <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.status==='done' ? fmtDuration(Math.round(dur)) : '—'}</td>
                          <td>
                            {r.status !== 'done' ? (
                              <span style={{ fontSize:'0.72rem', color:'var(--fg-dim)', opacity:0.45 }}>—</span>
                            ) : submitted ? (
                              <button className="btn btn-ghost btn-sm"
                                style={{ fontSize:'0.72rem', padding:'0.22rem 0.55rem', gap:'0.35rem', position:'relative' }}
                                onClick={() => setViewEntry(submitted)}>
                                {mood && <i className={`bi ${mood.icon}`} style={{ color:mood.color, fontSize:'0.85rem' }} />}
                                View
                                {hasRemark && (
                                  <span style={{ position:'absolute', top:'-3px', right:'-3px', width:'7px', height:'7px', borderRadius:'50%', background:'var(--accent)', border:'1.5px solid var(--bg)' }} />
                                )}
                              </button>
                            ) : (
                              <button className="btn btn-ghost btn-sm"
                                style={{ fontSize:'0.72rem', padding:'0.22rem 0.55rem', gap:'0.3rem' }}
                                onClick={() => setFeedbackFor(r.id)}>
                                <i className="bi bi-chat-quote" /> Rate
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Reservations Tab ── */}
          {activeTab === 'reservations' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Lab</th><th>PC</th><th>Purpose</th><th>Status</th><th>Requested</th><th>Resolved</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr><td colSpan={8}>
                      <div className="empty-state">
                        <i className="bi bi-calendar-x" style={{ fontSize:'2rem', opacity:0.4 }} />
                        <div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No reservations yet</div>
                      </div>
                    </td></tr>
                  ) : reservations.map(r => (
                    <tr key={r.id}>
                      <td style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.id}</td>
                      <td style={{ color:'var(--fg-dim)' }}>Lab {r.lab}</td>
                      <td><span style={{ fontFamily:'monospace', color:'var(--blue)' }}>PC {r.pc_number}</span></td>
                      <td><span className="badge badge-orange">{r.purpose}</span></td>
                      <td>
                        <span className={`badge ${r.status==='approved'?'badge-green':r.status==='denied'?'badge-red':'badge-orange'}`}>
                          {r.status === 'pending' ? <><i className="bi bi-hourglass-split" style={{ fontSize:'0.7rem' }} /> Pending</> :
                           r.status === 'approved' ? <><i className="bi bi-check-circle" style={{ fontSize:'0.7rem' }} /> Approved</> :
                           <><i className="bi bi-x-circle" style={{ fontSize:'0.7rem' }} /> Denied</>}
                        </span>
                      </td>
                      <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.requested_at?.slice(0,16).replace('T',' ')}</td>
                      <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.resolved_at?.slice(0,16).replace('T',' ')||'—'}</td>
                      <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis' }}>{r.notes||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
