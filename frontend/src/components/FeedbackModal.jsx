import { useState } from 'react'
import api from '../api'

// ── Mood config ──────────────────────────────────────────────────────────────
const MOODS = [
  {
    value: 1,
    icon: 'bi-emoji-angry-fill',
    label: 'Terrible',
    color: '#e67e80',
    bg: 'rgba(230,126,128,0.12)',
    ring: 'rgba(230,126,128,0.4)',
    desc: 'The session was frustrating and things did not go well at all.',
  },
  {
    value: 2,
    icon: 'bi-emoji-frown-fill',
    label: 'Poor',
    color: '#e69875',
    bg: 'rgba(230,152,117,0.12)',
    ring: 'rgba(230,152,117,0.4)',
    desc: 'There were notable issues that made the session difficult.',
  },
  {
    value: 3,
    icon: 'bi-emoji-neutral-fill',
    label: 'Okay',
    color: '#dbbc7f',
    bg: 'rgba(219,188,127,0.12)',
    ring: 'rgba(219,188,127,0.4)',
    desc: 'The session was average — nothing particularly good or bad.',
  },
  {
    value: 4,
    icon: 'bi-emoji-smile-fill',
    label: 'Good',
    color: '#7fbbb3',
    bg: 'rgba(127,187,179,0.12)',
    ring: 'rgba(127,187,179,0.4)',
    desc: 'The session went well overall. Minor room for improvement.',
  },
  {
    value: 5,
    icon: 'bi-emoji-laughing-fill',
    label: 'Excellent',
    color: '#a7c080',
    bg: 'rgba(167,192,128,0.12)',
    ring: 'rgba(167,192,128,0.4)',
    desc: 'Outstanding session! Everything worked perfectly.',
  },
]

export default function FeedbackModal({ sitinId, onClose, onSuccess }) {
  const [rating,  setRating]  = useState(null)
  const [hovered, setHovered] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const MAX = 500
  const active = hovered ?? rating
  const activeMood = MOODS.find(m => m.value === active)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!rating)         { setError('Please select how your session went.'); return }
    if (!trimmed)        { setError('Please write something before submitting.'); return }
    if (trimmed.length < 10) { setError('Feedback is too short (min 10 characters).'); return }

    setLoading(true); setError('')
    try {
      await api.post('/feedback/', { sitin_id: sitinId, content: trimmed, rating })
      onSuccess(rating)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9000, padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.75rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        animation: 'fbModalIn 0.2s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.4rem' }}>
          <div>
            <h3 style={{ fontFamily:'Playfair Display, serif', fontSize:'1.1rem', color:'var(--fg)', margin:0 }}>
              How was your session?
            </h3>
            <p style={{ fontSize:'0.76rem', color:'var(--fg-dim)', margin:'0.25rem 0 0' }}>
              Your feedback is completely anonymous — the admin cannot identify you.
            </p>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--fg-dim)', fontSize:'1.1rem', lineHeight:1, padding:'2px', marginLeft:'1rem' }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Mood Picker ── */}
        <div style={{ marginBottom:'1.25rem' }}>
          <div style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-dim)', marginBottom:'0.75rem' }}>
            Rate your experience
          </div>

          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'space-between' }}>
            {MOODS.map(m => {
              const isActive = rating === m.value
              const isHov    = hovered === m.value
              return (
                <button
                  key={m.value}
                  onMouseEnter={() => setHovered(m.value)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => { setRating(m.value); setError('') }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.7rem 0.3rem 0.55rem',
                    background: isActive ? m.bg : (isHov ? 'rgba(255,255,255,0.04)' : 'transparent'),
                    border: `1.5px solid ${isActive ? m.ring : 'var(--border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(.34,1.56,.64,1)',
                    boxShadow: isActive ? `0 0 0 3px ${m.ring}` : 'none',
                    transform: (isActive || isHov) ? 'translateY(-2px) scale(1.04)' : 'scale(1)',
                    outline: 'none',
                  }}
                >
                  <i
                    className={`bi ${m.icon}`}
                    style={{
                      fontSize: '1.65rem',
                      color: (isActive || isHov) ? m.color : 'var(--fg-dim)',
                      transition: 'color 0.18s, transform 0.18s',
                      display: 'block',
                      lineHeight: 1,
                    }}
                  />
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: isActive ? 600 : 400,
                    color: (isActive || isHov) ? m.color : 'var(--fg-dim)',
                    transition: 'color 0.15s',
                    letterSpacing: '0.01em',
                  }}>
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Dynamic description */}
          <div style={{
            height: '2.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '0.65rem',
          }}>
            {activeMood ? (
              <p style={{
                margin: 0,
                fontSize: '0.76rem',
                color: activeMood.color,
                textAlign: 'center',
                lineHeight: 1.4,
                animation: 'fadeInUp 0.15s ease',
                fontStyle: 'italic',
              }}>
                {activeMood.desc}
              </p>
            ) : (
              <p style={{ margin:0, fontSize:'0.76rem', color:'var(--fg-dim)', textAlign:'center', fontStyle:'italic' }}>
                Select a mood above to get started
              </p>
            )}
          </div>
        </div>

        <div style={{ height:'1px', background:'var(--border)', margin:'0.25rem 0 1.1rem' }} />

        {/* Written feedback */}
        <div style={{ marginBottom:'1rem' }}>
          <div style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--fg-dim)', marginBottom:'0.5rem' }}>
            Tell us more <span style={{ textTransform:'none', letterSpacing:'normal', opacity:0.6 }}>(optional but appreciated)</span>
          </div>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value.slice(0, MAX)); setError('') }}
            placeholder="Share your thoughts on the lab setup, assistance received, or any suggestions for improvement..."
            rows={4}
            style={{
              width: '100%',
              background: 'var(--bg2)',
              border: `1px solid ${error && !rating ? 'var(--red)' : (error ? 'var(--red)' : 'var(--border)')}`,
              borderRadius: '8px',
              color: 'var(--fg)',
              padding: '0.75rem',
              fontSize: '0.84rem',
              fontFamily: 'Outfit, sans-serif',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = activeMood?.ring ?? 'var(--accent)' }}
            onBlur={e => { if (!error) e.target.style.borderColor = 'var(--border)' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.3rem' }}>
            <span style={{ fontSize:'0.72rem', color: error ? 'var(--red)' : 'transparent', display:'flex', gap:'0.3rem', alignItems:'center' }}>
              {error && <><i className="bi bi-exclamation-circle" /> {error}</>}
            </span>
            <span style={{ fontSize:'0.7rem', color: content.length >= MAX ? 'var(--red)' : 'var(--fg-dim)' }}>
              {content.length}/{MAX}
            </span>
          </div>
        </div>

        {/* Privacy note */}
        <div style={{
          background: 'rgba(167,192,128,0.08)',
          border: '1px solid rgba(167,192,128,0.2)',
          borderRadius: '7px',
          padding: '0.55rem 0.8rem',
          marginBottom: '1.1rem',
          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
        }}>
          <i className="bi bi-shield-check" style={{ color:'var(--green)', fontSize:'0.8rem', marginTop:'2px', flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--fg-dim)', lineHeight:1.5 }}>
            Your name and student ID will never be shared. The admin may optionally send you a remark in response — you'll see it in your notifications.
          </span>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'0.6rem', justifyContent:'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={loading || !rating}
            style={rating ? { background: activeMood?.color, color: 'var(--bg)' } : {}}
          >
            {loading
              ? <><i className="bi bi-arrow-repeat" style={{ animation:'spin 0.8s linear infinite' }} /> Submitting…</>
              : <><i className="bi bi-send-check" /> Submit Anonymously</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fbModalIn   { from { opacity:0; transform:scale(0.95) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes fadeInUp    { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin        { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}
