import { useState, useEffect, useMemo } from 'react'
import api from '../../api'
import { useDebounce } from '../../hooks/useDebounce'

const LABS = ['524','526','528','530','542']
const LAB_ROWS = 7
const LAB_COLS  = 7
const DIVIDER_AFTER = [2, 4, 6]

const STATUS_CFG = {
  pending:  { label:'Pending',  icon:'bi-hourglass-split', badge:'badge-orange' },
  approved: { label:'Approved', icon:'bi-check-circle',    badge:'badge-green'  },
  denied:   { label:'Denied',   icon:'bi-x-circle',        badge:'badge-red'    },
}

/* ── Resolve Modal (Approve / Deny) ── */
function ResolveModal({ reservation, action, onClose, onDone }) {
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const submit = async () => {
    setLoading(true); setError('')
    try {
      await api.post(`/reservations/${action}/${reservation.id}`, { notes: notes || null })
      onDone()
    } catch(e) {
      setError(e.response?.data?.error || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const isApprove = action === 'approve'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">
            <i className={`bi ${isApprove ? 'bi-check-circle text-green' : 'bi-x-circle text-red'}`} />
            {' '}{isApprove ? 'Approve' : 'Deny'} Reservation
          </span>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        {error && <div className="alert alert-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

        <div style={{ background:'var(--bg2)', borderRadius:8, padding:'1rem', marginBottom:'1rem', border:'1px solid var(--border)', fontSize:'0.85rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem', color:'var(--fg-dim)' }}>
            <span><strong style={{ color:'var(--fg)' }}>Student:</strong> {reservation.student_name} ({reservation.student_id})</span>
            <span><strong style={{ color:'var(--fg)' }}>Lab:</strong> {reservation.lab} &nbsp;·&nbsp; <strong style={{ color:'var(--fg)' }}>PC:</strong> {reservation.pc_number}</span>
            <span><strong style={{ color:'var(--fg)' }}>Purpose:</strong> {reservation.purpose}</span>
            {reservation.notes && <span><strong style={{ color:'var(--fg)' }}>Note:</strong> {reservation.notes}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="label">Admin Notes (optional)</label>
          <input className="input" placeholder={isApprove ? 'e.g. Approved for today only' : 'e.g. PC already occupied'}
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${isApprove ? 'btn-green' : 'btn-danger'}`}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Processing…' : isApprove
              ? <><i className="bi bi-check-lg" /> Approve</>
              : <><i className="bi bi-x-lg" /> Deny</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

const TIME_SLOTS_ADMIN = [
  '7:30 AM – 9:30 AM',
  '9:30 AM – 11:30 AM',
  '11:30 AM – 1:30 PM',
  '1:30 PM – 3:30 PM',
  '3:30 PM – 5:30 PM',
  '5:30 PM – 7:30 PM',
]

function todayAdminStr() {
  return new Date().toISOString().slice(0, 10)
}

/* ── PC Control Panel ── */
function PcControlPanel() {
  const [lab,      setLab]      = useState('524')
  const [dateStr,  setDateStr]  = useState(todayAdminStr())
  const [slot,     setSlot]     = useState(TIME_SLOTS_ADMIN[0])
  const [statuses, setStatuses] = useState({}) // pc_number -> is_disabled
  const [reserved, setReserved] = useState([]) // pc_numbers with approved reservations for this date+slot
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(null)

  const load = async (l, d, s) => {
    setLoading(true)
    try {
      const [pcRes, resRes] = await Promise.all([
        api.get(`/reservations/pc-status/${l}`),
        api.get(`/reservations/all?status=approved`),
      ])
      const map = {}
      pcRes.data.forEach(p => { map[p.pc_number] = p.is_disabled })
      setStatuses(map)
      setReserved(
        resRes.data
          .filter(r => r.lab === l && r.reservation_date === d && r.time_slot === s)
          .map(r => r.pc_number)
      )
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load(lab, dateStr, slot) }, [lab, dateStr, slot])

  const toggle = async (pc) => {
    const cur = !!statuses[pc]
    setSaving(pc)
    try {
      await api.post('/reservations/pc-control', { lab, pc_number: pc, disabled: !cur })
      setStatuses(s => ({ ...s, [pc]: !cur }))
    } catch {}
    finally { setSaving(null) }
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
        <span style={{ fontSize:'0.85rem', color:'var(--fg-dim)' }}>Lab:</span>
        {LABS.map(l => (
          <button key={l} onClick={() => setLab(l)} className={`btn btn-sm ${lab===l?'btn-primary':'btn-ghost'}`}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.2rem' }}>
          <label style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--fg-dim)', fontWeight:600 }}>Date</label>
          <input type="date" className="input" style={{ width:160, padding:'0.35rem 0.6rem', fontSize:'0.82rem' }}
            value={dateStr} min={todayAdminStr()}
            onChange={e => setDateStr(e.target.value)} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.2rem' }}>
          <label style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--fg-dim)', fontWeight:600 }}>Time Slot</label>
          <select className="select" style={{ width:200, padding:'0.35rem 0.6rem', fontSize:'0.82rem' }}
            value={slot} onChange={e => setSlot(e.target.value)}>
            {TIME_SLOTS_ADMIN.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ fontSize:'0.75rem', color:'var(--fg-dim)', alignSelf:'flex-end', paddingBottom:'0.1rem' }}>
          <i className="bi bi-eye" /> Showing availability for this slot
        </div>
      </div>

      <div className="pc-legend">
        <span className="pc-dot pc-ok" /> Available
        <span className="pc-dot pc-reserved" /> Reserved Today
        <span className="pc-dot pc-disabled" /> Offline (Admin)
      </div>

      {loading ? (
        <div style={{ color:'var(--fg-dim)', padding:'2rem', textAlign:'center' }}>Loading floor plan…</div>
      ) : (
        <div className="pc-grid">
          {Array.from({ length: LAB_ROWS }, (_, row) => (
            <div key={row}>
              <div className="pc-row">
                {Array.from({ length: LAB_COLS }, (_, col) => {
                  const pc = row * LAB_COLS + col + 1
                  const isDisabled = !!statuses[pc]
                  const isReserved = reserved.includes(pc)
                  const isSaving   = saving === pc
                  return (
                    <button
                      key={pc}
                      className={`pc-btn ${isDisabled ? 'pc-btn-disabled' : isReserved ? 'pc-btn-reserved' : 'pc-btn-ok'}`}
                      onClick={() => toggle(pc)}
                      title={`PC ${pc} — click to ${isDisabled ? 'enable' : 'disable'}`}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? <i className="bi bi-hourglass-split" style={{ fontSize:'1rem' }} />
                        : <i className={`bi ${isDisabled ? 'bi-display-fill' : 'bi-display'}`} style={{ fontSize:'1rem' }} />
                      }
                      <span className="pc-num">{pc}</span>
                      {isReserved && <span className="pc-res-dot" />}
                    </button>
                  )
                })}
              </div>
              {DIVIDER_AFTER.includes(row + 1) && row + 1 < LAB_ROWS && (
                <div style={{ height:1, background:'var(--border)', margin:'0.5rem 0', opacity:0.6 }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:'1rem', fontSize:'0.75rem', color:'var(--fg-dim)', display:'flex', alignItems:'center', gap:'0.4rem' }}>
        <i className="bi bi-info-circle" />
        Click any PC to toggle it between Available and Offline. Reserved PCs are read-only.
      </div>
    </div>
  )
}

/* ── Logs Section ── */
function ReservationLogs({ all }) {
  const logs = useMemo(() => {
    return all
      .filter(r => r.status !== 'pending')
      .sort((a, b) => new Date(b.resolved_at||0) - new Date(a.resolved_at||0))
  }, [all])

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Student</th><th>Lab</th><th>PC</th><th>Purpose</th><th>Date</th><th>Time Slot</th><th>Action</th><th>Resolved By</th><th>Resolved At</th><th>Notes</th></tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={9}>
              <div className="empty-state"><i className="bi bi-journal-x" style={{ fontSize:'2rem', opacity:0.4 }} /><div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No activity yet</div></div>
            </td></tr>
          ) : logs.map(r => (
            <tr key={r.id}>
              <td style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.id}</td>
              <td>
                <div style={{ fontWeight:500 }}>{r.student_name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--fg-dim)', fontFamily:'monospace' }}>{r.student_id}</div>
              </td>
              <td style={{ color:'var(--fg-dim)' }}>Lab {r.lab}</td>
              <td><span style={{ fontFamily:'monospace', color:'var(--blue)' }}>PC {r.pc_number}</span></td>
              <td><span className="badge badge-orange">{r.purpose}</span></td>
              <td style={{ fontSize:'0.78rem', color:'var(--fg)', fontWeight:500, whiteSpace:'nowrap' }}>
                {r.reservation_date
                  ? new Date(r.reservation_date + 'T00:00:00').toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'})
                  : '—'}
              </td>
              <td style={{ fontSize:'0.75rem', color:'var(--accent)', whiteSpace:'nowrap' }}>
                {r.time_slot || '—'}
              </td>
              <td>
                <span className={`badge ${STATUS_CFG[r.status]?.badge}`}>
                  <i className={`bi ${STATUS_CFG[r.status]?.icon}`} style={{ fontSize:'0.7rem', marginRight:'3px' }} />
                  {STATUS_CFG[r.status]?.label}
                </span>
              </td>
              <td style={{ fontSize:'0.8rem', color:'var(--fg-dim)' }}>{r.resolved_by || '—'}</td>
              <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.resolved_at?.slice(0,16).replace('T',' ') || '—'}</td>
              <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis' }}>{r.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main AdminReservations page ── */
export default function AdminReservations() {
  const [all,      setAll]      = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('requests')   // requests | pc-control | logs
  const [filter,   setFilter]   = useState('pending')
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput)
  const [resolve,  setResolve]  = useState(null)         // { reservation, action }
  const [toast,    setToast]    = useState('')

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/reservations/all'); setAll(data) }
    catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let r = all
    if (filter !== 'all') r = r.filter(x => x.status === filter)
    const q = search.toLowerCase()
    if (q) r = r.filter(x =>
      x.student_id.toLowerCase().includes(q) ||
      x.student_name.toLowerCase().includes(q) ||
      x.lab.includes(q) ||
      String(x.pc_number).includes(q)
    )
    return r
  }, [all, filter, search])

  const pendingCount = all.filter(r => r.status === 'pending').length

  const handleDone = (action) => {
    setResolve(null)
    setToast(`Reservation ${action === 'approve' ? 'approved' : 'denied'} and student notified.`)
    setTimeout(() => setToast(''), 4000)
    load()
  }

  return (
    <div>
      {resolve && (
        <ResolveModal
          reservation={resolve.reservation}
          action={resolve.action}
          onClose={() => setResolve(null)}
          onDone={() => handleDone(resolve.action)}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">PC reservation requests, floor control, and activity logs</p>
        </div>
        <div className="page-header-actions">
          {pendingCount > 0 && (
            <span className="badge badge-orange">
              <i className="bi bi-hourglass-split" style={{ fontSize:'0.7rem' }} /> {pendingCount} pending
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success" style={{ marginBottom:'1.25rem' }}>
          <i className="bi bi-check-circle-fill" /> {toast}
        </div>
      )}

      {/* Tab Nav */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.75rem' }}>
        {[
          { key:'requests',   icon:'bi-inbox',       label:'Requests' },
          { key:'pc-control', icon:'bi-grid-3x3',    label:'PC Control' },
          { key:'logs',       icon:'bi-journal-text',label:'Activity Logs' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn btn-sm ${tab===t.key?'btn-primary':'btn-ghost'}`}>
            <i className={`bi ${t.icon}`} /> {t.label}
            {t.key === 'requests' && pendingCount > 0 && (
              <span style={{ background:'var(--red)', color:'#fff', borderRadius:'999px', padding:'0 5px', fontSize:'0.65rem', marginLeft:'2px' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Requests Tab ── */}
      {tab === 'requests' && (
        <>
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', alignItems:'center', flexWrap:'wrap' }}>
            <div className="search-bar" style={{ maxWidth:260 }}>
              <span style={{ color:'var(--fg-dim)', fontSize:'0.9rem' }}>🔍</span>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by name, ID, lab…" />
            </div>
            <div style={{ display:'flex', gap:'0.4rem' }}>
              {['all','pending','approved','denied'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`}>
                  {f === 'all' ? 'All' : STATUS_CFG[f]?.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize:'0.8rem', color:'var(--fg-dim)', marginLeft:'auto' }}>{filtered.length} request{filtered.length!==1?'s':''}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Lab</th><th>PC</th><th>Purpose</th><th>Date</th><th>Time Slot</th><th>Status</th><th>Submitted</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--fg-dim)' }}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state"><i className="bi bi-calendar-x" style={{ fontSize:'2rem', opacity:0.4 }} /><div className="empty-state-text" style={{ marginTop:'0.5rem' }}>No reservations found</div></div>
                  </td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ color:'var(--fg-dim)', fontFamily:'monospace', fontSize:'0.8rem' }}>{r.id}</td>
                    <td>
                      <div style={{ fontWeight:500 }}>{r.student_name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--blue)', fontFamily:'monospace' }}>{r.student_id}</div>
                    </td>
                    <td style={{ color:'var(--fg-dim)' }}>Lab {r.lab}</td>
                    <td><span style={{ fontFamily:'monospace', color:'var(--blue)', fontWeight:600 }}>PC {r.pc_number}</span></td>
                    <td><span className="badge badge-orange">{r.purpose}</span></td>
                    <td>
                      <span className={`badge ${STATUS_CFG[r.status]?.badge}`}>
                        <i className={`bi ${STATUS_CFG[r.status]?.icon}`} style={{ fontSize:'0.7rem', marginRight:'3px' }} />
                        {STATUS_CFG[r.status]?.label}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)' }}>{r.requested_at?.slice(0,16).replace('T',' ')}</td>
                    <td style={{ fontSize:'0.78rem', color:'var(--fg-dim)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }}>{r.notes || '—'}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display:'flex', gap:'0.4rem' }}>
                          <button
                            className="btn btn-green btn-sm"
                            style={{ padding:'0.25rem 0.6rem', fontSize:'0.75rem' }}
                            onClick={() => setResolve({ reservation:r, action:'approve' })}
                          >
                            <i className="bi bi-check-lg" /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding:'0.25rem 0.6rem', fontSize:'0.75rem' }}
                            onClick={() => setResolve({ reservation:r, action:'deny' })}
                          >
                            <i className="bi bi-x-lg" /> Deny
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize:'0.75rem', color:'var(--fg-dim)', opacity:0.6 }}>
                          by {r.resolved_by || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── PC Control Tab ── */}
      {tab === 'pc-control' && (
        <div className="card">
          <PcControlPanel />
        </div>
      )}

      {/* ── Logs Tab ── */}
      {tab === 'logs' && <ReservationLogs all={all} />}
    </div>
  )
}
