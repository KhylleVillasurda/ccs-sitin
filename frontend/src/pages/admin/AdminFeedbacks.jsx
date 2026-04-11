import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../api'

const MOODS = [
  { value:1, icon:'bi-emoji-angry-fill',    label:'Terrible', color:'#e67e80' },
  { value:2, icon:'bi-emoji-frown-fill',    label:'Poor',     color:'#e69875' },
  { value:3, icon:'bi-emoji-neutral-fill',  label:'Okay',     color:'#dbbc7f' },
  { value:4, icon:'bi-emoji-smile-fill',    label:'Good',     color:'#7fbbb3' },
  { value:5, icon:'bi-emoji-laughing-fill', label:'Excellent',color:'#a7c080' },
]

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(dateStr).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
}

function ReplyModal({ feedback, onClose, onReplied }) {
  const [reply,   setReply]   = useState(feedback.admin_reply || '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const MAX = 400

  const handleSubmit = async () => {
    const t = reply.trim()
    if (!t) { setError('Reply cannot be empty.'); return }
    setLoading(true); setError('')
    try {
      await api.post(`/feedback/${feedback.id}/reply`, { reply: t })
      onReplied()
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send reply.')
    } finally { setLoading(false) }
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9100, padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'14px', padding:'1.75rem', width:'100%', maxWidth:'460px', boxShadow:'0 16px 48px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div>
            <h3 style={{ fontFamily:'Playfair Display, serif', fontSize:'0.95rem', color:'var(--fg)', margin:0 }}>
              <i className="bi bi-shield-exclamation" style={{ color:'var(--orange)', marginRight:'0.4rem' }} />
              Admin Remark
            </h3>
            <p style={{ fontSize:'0.75rem', color:'var(--fg-dim)', margin:'0.2rem 0 0' }}>
              This remark will be sent as a notification to the student.
            </p>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--fg-dim)', fontSize:'1rem' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Original feedback preview */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.8rem', color:'var(--fg-dim)' }}>
          <div style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--fg-dim)', marginBottom:'0.4rem' }}>
            <i className="bi bi-chat-quote" style={{ marginRight:'0.3rem' }} />Anonymous Feedback
          </div>
          <p style={{ margin:0, color:'var(--fg)', lineHeight:1.5 }}>{feedback.content}</p>
        </div>

        <textarea
          value={reply}
          onChange={e => { setReply(e.target.value.slice(0, MAX)); setError('') }}
          placeholder="Write a remark or warning for this student..."
          rows={4}
          style={{ width:'100%', background:'var(--bg2)', border:`1px solid ${error ? 'var(--red)' : 'var(--border)'}`, borderRadius:'8px', color:'var(--fg)', padding:'0.75rem', fontSize:'0.85rem', fontFamily:'Outfit, sans-serif', lineHeight:1.6, resize:'vertical', outline:'none' }}
        />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.3rem', marginBottom:'0.85rem' }}>
          {error ? <span style={{ fontSize:'0.75rem', color:'var(--red)' }}>{error}</span> : <span />}
          <span style={{ fontSize:'0.72rem', color: reply.length >= MAX ? 'var(--red)' : 'var(--fg-dim)', marginLeft:'auto' }}>{reply.length}/{MAX}</span>
        </div>

        <div style={{ display:'flex', gap:'0.6rem', justifyContent:'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !reply.trim()}>
            {loading ? <><i className="bi bi-arrow-repeat" style={{ animation:'spin 0.8s linear infinite' }} /> Sending…</> : <><i className="bi bi-send" /> Send Remark</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null) // feedback being replied to
  const [banner,    setBanner]    = useState('')
  const [highlightId, setHighlightId] = useState(null)
  const location = useLocation()
  const feedbackRefs = useRef({})

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams(location.search)
    const targetId = params.get('id')

    api.get('/feedback/')
      .then(r => {
        setFeedbacks(r.data)
        if (targetId) {
          // Increase timeout slightly to ensure DOM is ready after setFeedbacks
          setTimeout(() => {
            const el = Object.values(feedbackRefs.current).find(r => r?.dataset?.sitinId === targetId)
            if (el) {
              setHighlightId(parseInt(targetId))
              el.scrollIntoView({ behavior:'smooth', block:'center' })
              setTimeout(() => setHighlightId(null), 3500)
            }
          }, 350)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [location.search])

  const handleReplied = () => {
    setSelected(null)
    setBanner('Remark sent to student.')
    load()
    setTimeout(() => setBanner(''), 3500)
  }

  const unanswered = feedbacks.filter(f => !f.admin_reply).length
  const replied    = feedbacks.filter(f =>  f.admin_reply).length

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:'1.4rem', color:'var(--fg)', margin:0 }}>
          <i className="bi bi-chat-quote" style={{ color:'var(--blue)', marginRight:'0.5rem', fontSize:'1.2rem' }} />
          Student Feedbacks
        </h1>
        <p style={{ color:'var(--fg-dim)', fontSize:'0.82rem', marginTop:'0.25rem' }}>
          Anonymous feedback from students. Student identity is never revealed.
        </p>
      </div>

      {banner && (
        <div style={{ background:'rgba(167,192,128,0.12)', border:'1px solid rgba(167,192,128,0.3)', borderRadius:'8px', padding:'0.7rem 1rem', marginBottom:'1rem', fontSize:'0.82rem', color:'var(--green)', display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <i className="bi bi-check-circle-fill" /> {banner}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {[
          { label:'Total Feedbacks', value: feedbacks.length, color:'var(--accent)',  icon:'bi-chat-text',       bg:'rgba(219,188,127,0.1)' },
          { label:'Awaiting Reply',  value: unanswered,       color:'var(--orange)',  icon:'bi-hourglass-split', bg:'rgba(230,152,117,0.1)' },
          { label:'Replied',         value: replied,          color:'var(--green)',   icon:'bi-check2-circle',   bg:'rgba(167,192,128,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'10px', padding:'0.85rem 1.1rem', display:'flex', alignItems:'center', gap:'0.8rem', minWidth:'140px' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:'1rem' }} />
            </div>
            <div>
              <div style={{ fontSize:'1.2rem', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--fg-dim)', marginTop:'0.15rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback list */}
      {loading ? (
        <div style={{ padding:'3rem', textAlign:'center', color:'var(--fg-dim)' }}>
          <i className="bi bi-arrow-repeat" style={{ fontSize:'1.5rem', animation:'spin 0.9s linear infinite', display:'block', marginBottom:'0.5rem' }} />
          Loading feedbacks…
        </div>
      ) : feedbacks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 1rem', color:'var(--fg-dim)' }}>
          <i className="bi bi-inbox" style={{ fontSize:'2.5rem', opacity:0.35, display:'block', marginBottom:'0.6rem' }} />
          <div style={{ fontSize:'0.9rem' }}>No feedbacks submitted yet.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
          {feedbacks.map(f => (
            <div 
              key={f.id} 
              ref={el => feedbackRefs.current[f.id] = el}
              data-sitin-id={f.sitin_id}
              className={highlightId === f.sitin_id ? 'highlight-pulse' : ''}
              style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', transition:'all 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bg4)'}
              onMouseLeave={e => { if (highlightId !== f.sitin_id) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {/* Feedback header */}
              <div style={{ padding:'0.85rem 1.1rem', display:'flex', alignItems:'center', gap:'0.65rem', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(127,187,179,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className="bi bi-incognito" style={{ color:'var(--blue)', fontSize:'0.8rem' }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--fg-dim)', fontStyle:'italic' }}>Anonymous Student</span>
                  {(() => { const m = MOODS.find(x => x.value === f.rating); return m ? (
                    <span style={{ marginLeft:'0.5rem', display:'inline-flex', alignItems:'center', gap:'0.25rem', fontSize:'0.72rem', color: m.color }}>
                      <i className={`bi ${m.icon}`} style={{ fontSize:'0.85rem' }} />{m.label}
                    </span>
                  ) : null })()}
                  <span style={{ margin:'0 0.5rem', color:'var(--border)' }}>·</span>
                  <span className="badge badge-orange" style={{ fontSize:'0.65rem' }}>{f.purpose}</span>
                  <span style={{ margin:'0 0.35rem', color:'var(--border)' }}>·</span>
                  <span style={{ fontSize:'0.75rem', color:'var(--fg-dim)' }}>Lab {f.lab}</span>
                </div>
                <span style={{ fontSize:'0.7rem', color:'var(--fg-dim)', flexShrink:0 }}>{timeAgo(f.created_at)}</span>
                <span className={`badge ${f.admin_reply ? 'badge-green' : 'badge-orange'}`} style={{ fontSize:'0.65rem', flexShrink:0 }}>
                  {f.admin_reply ? <><i className="bi bi-check" /> Replied</> : 'Pending'}
                </span>
              </div>

              {/* Feedback content */}
              <div style={{ padding:'0.9rem 1.1rem' }}>
                <p style={{ margin:0, fontSize:'0.85rem', color:'var(--fg)', lineHeight:1.6 }}>{f.content}</p>
              </div>

              {/* Admin reply (if exists) */}
              {f.admin_reply && (
                <div style={{ padding:'0.75rem 1.1rem', background:'rgba(219,188,127,0.05)', borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--accent)', marginBottom:'0.35rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <i className="bi bi-shield-check" /> Admin Remark · {timeAgo(f.replied_at)}
                  </div>
                  <p style={{ margin:0, fontSize:'0.82rem', color:'var(--fg)', lineHeight:1.5 }}>{f.admin_reply}</p>
                </div>
              )}

              {/* Action */}
              <div style={{ padding:'0.65rem 1.1rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize:'0.78rem', gap:'0.3rem' }}
                  onClick={() => setSelected(f)}
                >
                  <i className={`bi ${f.admin_reply ? 'bi-pencil' : 'bi-reply'}`} />
                  {f.admin_reply ? 'Edit Remark' : 'Leave Remark (Optional)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <ReplyModal feedback={selected} onClose={() => setSelected(null)} onReplied={handleReplied} />
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .highlight-pulse {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 4px rgba(219,188,127,0.15);
          transform: scale(1.005);
        }
      `}</style>
    </div>
  )
}
